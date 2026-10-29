using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using backend.DTOs;
using backend.Services.Activity;
using backend.Services.Credentials;
using backend.Services.GetProfile;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/profiles")]
    public class ProfilesController : ControllerBase
    {
        private readonly ICredentialWalletService _credentials;
        private readonly IDocumentActivityService _activity;
        private readonly IGetProfileService _profiles;
        private readonly ILogger<ProfilesController> _logger;

        public ProfilesController(
            ICredentialWalletService credentials,
            IDocumentActivityService activity,
            IGetProfileService profiles,
            ILogger<ProfilesController> logger)
        {
            _credentials = credentials;
            _activity = activity;
            _profiles = profiles;
            _logger = logger;
        }

        /// <summary>
        /// All members (every role) for the network directory.
        /// </summary>
        [HttpGet]
        [Authorize]
        public async Task<IActionResult> List([FromQuery] int limit = 200)
        {
            var results = await _profiles.ListMembersAsync(limit);
            return Ok(results);
        }

        /// <summary>
        /// Search members by Ethereum address or display name (FirstName / LastName).
        /// </summary>
        [HttpGet("search")]
        [Authorize]
        public async Task<IActionResult> Search([FromQuery] string? q, [FromQuery] int limit = 10)
        {
            var trimmed = q?.Trim() ?? string.Empty;
            if (trimmed.Length < 2)
            {
                return Ok(Array.Empty<MemberSearchResultDto>());
            }

            var results = await _profiles.SearchMembersAsync(trimmed, limit);
            return Ok(results);
        }

        /// <summary>
        /// Public profile card for a member (no email). Used after header search.
        /// </summary>
        [HttpGet("{ethereumAddress}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPublicProfile(string ethereumAddress)
        {
            var profile = await _profiles.GetProfileByAddressAsync(ethereumAddress);
            if (profile is null)
            {
                return NotFound(new { error = "Nie znaleziono użytkownika." });
            }

            return Ok(new
            {
                profile.FirstName,
                profile.LastName,
                profile.Name,
                profile.EthereumAddress,
                profile.Role,
                profile.Bio,
                profile.AvatarUrl,
                profile.CreatedAt,
            });
        }

        [HttpGet("me/credentials")]
        [Authorize]
        public async Task<IActionResult> GetMyCredentials()
        {
            var memberId = GetCurrentMemberId();
            if (memberId == 0)
            {
                return Unauthorized();
            }

            var items = await _credentials.GetMyCredentialsAsync(memberId);
            return Ok(items);
        }

        [HttpPatch("me/credentials/{hash}/visibility")]
        [Authorize]
        public async Task<IActionResult> UpdateCredentialVisibility(
            string hash,
            [FromBody] UpdateCredentialVisibilityDto dto)
        {
            var memberId = GetCurrentMemberId();
            if (memberId == 0)
            {
                return Unauthorized();
            }

            if (dto is null || string.IsNullOrWhiteSpace(dto.Visibility))
            {
                return BadRequest(new { error = "visibility is required" });
            }

            var (item, statusCode, error) = await _credentials.UpdateVisibilityAsync(
                memberId,
                hash,
                dto.Visibility);

            if (statusCode != 200)
            {
                _logger.LogInformation(
                    "Visibility update failed for member {MemberId} hash {Hash}: {Error}",
                    memberId,
                    hash,
                    error);
                return StatusCode(statusCode, new { error });
            }

            return Ok(item);
        }

        [HttpGet("me/activity")]
        [Authorize]
        public async Task<IActionResult> GetMyActivity()
        {
            var memberId = GetCurrentMemberId();
            if (memberId == 0)
            {
                return Unauthorized();
            }

            var items = await _activity.GetMyActivityAsync(memberId);
            return Ok(items);
        }

        [HttpGet("{ethereumAddress}/credentials")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPublicCredentials(string ethereumAddress)
        {
            var items = await _credentials.GetPublicCredentialsByAddressAsync(ethereumAddress);
            return Ok(items);
        }

        private int GetCurrentMemberId()
        {
            var memberId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);

            if (int.TryParse(memberId, out var id))
            {
                return id;
            }

            return 0;
        }
    }
}
