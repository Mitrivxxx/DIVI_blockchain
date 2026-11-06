using backend.Modules.Members.Contracts;
using backend.Modules.Members.Application;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Modules.Members.Api
{
    [ApiController]
    [Route("api/profiles")]
    public class ProfilesController : ControllerBase
    {
        private readonly IGetProfileService _profiles;

        public ProfilesController(IGetProfileService profiles)
        {
            _profiles = profiles;
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
                profile.MemberId,
                profile.FirstName,
                profile.LastName,
                profile.Name,
                profile.EthereumAddress,
                profile.Role,
                profile.Bio,
                profile.LinkedInUrl,
                profile.GithubUrl,
                profile.WebsiteUrl,
                profile.AvatarUrl,
                profile.CreatedAt,
            });
        }
    }
}
