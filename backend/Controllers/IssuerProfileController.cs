using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using backend.DTOs;
using backend.Services.Issuers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/issuer/profile")]
    [Authorize(Roles = "issuer,admin,owner")]
    public class IssuerProfileController : ControllerBase
    {
        private readonly IIssuerProfileService _issuerProfileService;

        public IssuerProfileController(IIssuerProfileService issuerProfileService)
        {
            _issuerProfileService = issuerProfileService;
        }

        [HttpGet]
        public async Task<IActionResult> GetMyProfile()
        {
            var memberId = GetCurrentMemberId();
            if (memberId == 0)
            {
                return Unauthorized();
            }

            var profile = await _issuerProfileService.GetMyProfileAsync(memberId);
            if (profile is null)
            {
                return NotFound(new { error = "Issuer profile not found. Approve an issuer application first or create via PATCH." });
            }

            return Ok(profile);
        }

        [HttpPatch]
        public async Task<IActionResult> UpdateMyProfile([FromBody] UpdateIssuerProfileDto dto)
        {
            var memberId = GetCurrentMemberId();
            if (memberId == 0)
            {
                return Unauthorized();
            }

            var (profile, statusCode, error) = await _issuerProfileService.UpdateMyProfileAsync(memberId, dto);
            if (statusCode != 200)
            {
                return StatusCode(statusCode, new { error });
            }

            return Ok(profile);
        }

        private int GetCurrentMemberId()
        {
            var memberId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);

            return int.TryParse(memberId, out var id) ? id : 0;
        }
    }
}
