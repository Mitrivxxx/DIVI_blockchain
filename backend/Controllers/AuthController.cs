using Microsoft.AspNetCore.Mvc;
using Nethereum.Signer;
using backend.Services.Auth;
using backend.Data;
using backend.DTOs;
using backend.Models;

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
