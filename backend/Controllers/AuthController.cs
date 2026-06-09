using Microsoft.AspNetCore.Mvc;
using Nethereum.Signer;
using backend.Services.Auth;
using backend.Data;
using backend.DTOs;
using backend.Models;
using backend.Utils;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authorization;
using backend.Services.GoogleUser;
using backend.Infrastructure.Google;

namespace backend.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly IJwtService _jwtService;
        private readonly AppDbContext _context;
        private readonly GoogleAuthService _googleAuth;
        private readonly UserService _userService;

        public AuthController(IAuthService authService, IJwtService jwtService, AppDbContext context, GoogleAuthService googleAuth, UserService userService)
        {
            _authService = authService;
            _jwtService = jwtService;
            _context = context;
            _googleAuth = googleAuth;
            _userService = userService;
        }

        [AllowAnonymous]
        [HttpPost("nonce")]
        public async Task<IActionResult> GenerateNonce([FromBody] NonceDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Address))
                return BadRequest("Address required");

            var nonce = _authService.GenerateNonce(dto.Address);

            var entity = new Nonce
            {
                Address = dto.Address.ToLower(),
                Value = nonce,
                ExpiresAt = DateTime.UtcNow.AddMinutes(5)
            };

            _context.Nonces.Add(entity);
            await _context.SaveChangesAsync();

            return Ok(new { nonce });
        }

        [HttpPost("register")]
        public async Task<IActionResult> CreateAccount([FromBody] RegisterUserDto dto)
        {
            if (dto is null)
                return BadRequest("Payload required");

            if (string.IsNullOrWhiteSpace(dto.Email))
                return BadRequest("Email required");

            if (string.IsNullOrWhiteSpace(dto.Password))
                return BadRequest("Password required");

            var member = new Member
            {
                Email = dto.Email.Trim(),
                Password = PasswordHasher.HashPassword(dto.Password),
                EthereumAddress = null,
                MemberRoleId = 3,
                CreatedAt = DateTime.UtcNow,
                Role = null!
            };

            _context.Members.Add(member);
            await _context.SaveChangesAsync();

            return StatusCode(201, new
            {
                member.Id,
                member.Email,
                member.MemberRoleId,
                member.CreatedAt
            });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginUserDto dto)
        {
            if (dto is null)
                return BadRequest("Payload required");

            if (string.IsNullOrWhiteSpace(dto.Email))
                return BadRequest("Email required");

            if (string.IsNullOrWhiteSpace(dto.Password))
                return BadRequest("Password required");

            var normalizedEmail = dto.Email.Trim().ToLowerInvariant();
            var member = await _context.Members
                .AsNoTracking()
                .Include(m => m.Role)
                .FirstOrDefaultAsync(m => m.Email != null && m.Email.ToLower() == normalizedEmail);

            if (member is null || string.IsNullOrWhiteSpace(member.Password))
            {
                return Unauthorized("Nieprawidlowy email lub haslo.");
            }

            var isPasswordValid = PasswordHasher.VerifyPassword(dto.Password, member.Password);
            if (!isPasswordValid)
            {
                return Unauthorized("Nieprawidlowy email lub haslo.");
            }

            var accessToken = _jwtService.GenerateAccessToken(member.Id.ToString(), member.Role?.Name ?? "user");
            var refreshToken = _jwtService.GenerateRefreshToken(member.Id.ToString());

            SetTokenCookies(accessToken, refreshToken);

            return Ok(new
            {
                member.Id,
                member.Email,
                member.MemberRoleId,
                member.CreatedAt
            });
        }

        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh()
        {
            var refreshToken = Request.Cookies["refresh_token"];
            if (string.IsNullOrEmpty(refreshToken)) return Unauthorized("No refresh token");

            var userIdStr = _jwtService.ValidateRefreshToken(refreshToken);
            if (userIdStr == null || !int.TryParse(userIdStr, out var userId))
                return Unauthorized("Invalid refresh token");

            var member = await _context.Members
                .AsNoTracking()
                .Include(m => m.Role)
                .FirstOrDefaultAsync(m => m.Id == userId);

            if (member == null) return Unauthorized("User not found");

            var newAccessToken = _jwtService.GenerateAccessToken(member.Id.ToString(), member.Role?.Name ?? "user");
            var newRefreshToken = _jwtService.GenerateRefreshToken(member.Id.ToString());

            SetTokenCookies(newAccessToken, newRefreshToken);

            return Ok(new { message = "Tokens refreshed" });
        }

        [Authorize]
        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            var jti = User.FindFirst(JwtRegisteredClaimNames.Jti)?.Value;
            if (!string.IsNullOrEmpty(jti))
            {
                var expiryDate = User.FindFirst(JwtRegisteredClaimNames.Exp)?.Value;
                DateTime exp = DateTime.UtcNow.AddMinutes(15);
                if (expiryDate != null && long.TryParse(expiryDate, out var expSeconds))
                {
                    exp = DateTimeOffset.FromUnixTimeSeconds(expSeconds).UtcDateTime;
                }

                _context.BlacklistedTokens.Add(new BlacklistedToken
                {
                    Jti = jti,
                    ExpiryDate = exp
                });
                await _context.SaveChangesAsync();
            }

            var cookieOptions = CreateAuthCookieOptions();
            Response.Cookies.Delete("access_token", cookieOptions);
            Response.Cookies.Delete("refresh_token", cookieOptions);

            return Ok(new { message = "Logged out" });
        }

        private CookieOptions CreateAuthCookieOptions() => new()
        {
            HttpOnly = true,
            Secure = Request.IsHttps,
            SameSite = SameSiteMode.Strict
        };

        private void SetTokenCookies(string accessToken, string refreshToken)
        {
            var cookieOptions = CreateAuthCookieOptions();

            Response.Cookies.Append("access_token", accessToken, cookieOptions);
            Response.Cookies.Append("refresh_token", refreshToken, cookieOptions);
        }

        [AllowAnonymous]
        [HttpPost("verify")]
        public async Task<IActionResult> Verify([FromBody] VerifyDto dto)
        {
            Console.WriteLine($"[AuthController] POST /auth/verify - address: {dto!.Address}, nonce: {dto.Nonce}, signature: {dto.Signature?.Substring(0, Math.Min(20, dto.Signature?.Length ?? 0))}...");

            var storedNonce = await _context.Nonces
                .Where(n => n.Address == dto.Address.ToLower() && n.IsUsed && n.ExpiresAt > DateTime.UtcNow)
                .OrderByDescending(n => n.ExpiresAt)
                .FirstOrDefaultAsync();

            if (storedNonce == null)
            {
                Console.WriteLine("[AuthController] Verify failed: no valid nonce found in DB for this address");
                return Unauthorized("Nonce not found or expired");
            }

            var message = storedNonce.Value;
            var signer = new EthereumMessageSigner();
            var recoveredAddress = signer.EncodeUTF8AndEcRecover(message, dto.Signature);

            Console.WriteLine($"[AuthController] Recovered address: {recoveredAddress}, expected: {dto.Address}");

            if (recoveredAddress.ToLower() != dto.Address.ToLower())
            {
                Console.WriteLine("[AuthController] Verify failed: address mismatch");
                return Unauthorized("Signature verification failed");
            }

            storedNonce.IsUsed = false;
            await _context.SaveChangesAsync();

            var member = await _context.Members
                .Include(m => m.Role)
                .FirstOrDefaultAsync(m => m.EthereumAddress != null && m.EthereumAddress.ToLower() == dto.Address.ToLower());

            if (member == null)
            {
                member = new Member
                {
                    EthereumAddress = dto.Address.ToLower(),
                    MemberRoleId = 3,
                    CreatedAt = DateTime.UtcNow,
                    Role = null!
                };
                _context.Members.Add(member);
                await _context.SaveChangesAsync();
                await _context.Entry(member).Reference(m => m.Role).LoadAsync();
                Console.WriteLine($"[AuthController] New member created for address: {dto.Address}");
            }
            var accessToken = _jwtService.GenerateAccessToken(member.Id.ToString(), member.Role?.Name ?? "user");
            var refreshToken = _jwtService.GenerateRefreshToken(member.Id.ToString());

            SetTokenCookies(accessToken, refreshToken);

            Console.WriteLine("[AuthController] Verify succeeded, token issued");
            return Ok(new { token = accessToken });
        }

        [HttpPost("google")]
        public async Task<IActionResult> GoogleLogin([FromBody] GoogleAuthRequest request)
        {
            var payload = await _googleAuth.VerifyAsync(request.IdToken);
            var user = await _userService.GetOrCreateGoogleUser(payload);

            var accessToken = _jwtService.GenerateAccessToken(user.Id.ToString(), user.Role?.Name ?? "user");
            var refreshToken = _jwtService.GenerateRefreshToken(user.Id.ToString());

            SetTokenCookies(accessToken, refreshToken);

            return Ok(new
            {
                user.Id,
                user.Email,
                user.FirstName,
                user.LastName,
                user.MemberRoleId,
                user.CreatedAt
            });
        }


    }

    public class VerifyDto
    {
        public string Address { get; set; } = string.Empty;
        public string Nonce { get; set; } = string.Empty;
        public string Signature { get; set; } = string.Empty;
    }
}
