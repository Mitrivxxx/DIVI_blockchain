using Microsoft.AspNetCore.Mvc;
using Nethereum.Signer;
using backend.Services.Auth;
using backend.Data;
using backend.DTOs;
using backend.Models;
using backend.Utils;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly IJwtService _jwtService;
        private readonly AppDbContext _context;

        public AuthController(IAuthService authService, IJwtService jwtService, AppDbContext context)
        {
            _authService = authService;
            _jwtService = jwtService;
            _context = context;
        }

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

            return Ok(new
            {
                member.Id,
                member.Email,
                member.MemberRoleId,
                member.CreatedAt
            });
        }

        [HttpPost("verify")]
        public async Task<IActionResult> Verify([FromBody] VerifyDto dto)
        {
            Console.WriteLine($"[AuthController] POST /auth/verify - address: {dto!.Address}");
            var message = dto.Nonce;
            var signer = new EthereumMessageSigner();
            var recoveredAddress = signer.EncodeUTF8AndEcRecover(message, dto.Signature);

            if (recoveredAddress.ToLower() != dto.Address.ToLower())
            {
                Console.WriteLine("[AuthController] Verify failed: address mismatch");
                return Unauthorized();
            }

            await _authService.ConsumeNonce(dto.Address);
            var token = _jwtService.GenerateToken(dto.Address);
            Console.WriteLine("[AuthController] Verify succeeded, token issued");
            return Ok(new { token });
        }
    }

    public class VerifyDto
    {
        public string Address { get; set; }= string.Empty;
        public string Nonce { get; set; } = string.Empty;
        public string Signature { get; set; } = string.Empty;
    }
}
