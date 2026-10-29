using System.Security.Claims;
using backend.DTOs;
using backend.Services.GetProfile;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class GetProfileController : ControllerBase
    {
        private readonly IGetProfileService _profileService;
        private readonly ILogger<GetProfileController> _logger;

        public GetProfileController(IGetProfileService profileService, ILogger<GetProfileController> logger)
        {
            _profileService = profileService;
            _logger = logger;
        }

        /// <summary>
        /// Returns the profile of the currently authenticated user.
        /// </summary>
        /// <returns>Current user profile data matched by Ethereum address from JWT.</returns>
        [HttpGet]
        public async Task<IActionResult> GetCurrentUserProfile()
        {
            var memberId = GetCurrentMemberId();
            _logger.LogInformation("Profile GET requested for memberId {MemberId}", memberId);
            if (memberId == 0)
            {
                _logger.LogInformation("Profile GET rejected due to missing member ID claim");
                return Unauthorized("Brak identyfikatora użytkownika w tokenie.");
            }

            var profile = await _profileService.GetProfileByIdAsync(memberId);
            if (profile is null)
            {
                _logger.LogInformation("Profile GET not found for memberId {MemberId}", memberId);
                return NotFound("Nie znaleziono profilu dla zalogowanego użytkownika.");
            }

            _logger.LogInformation("Profile GET succeeded for memberId {MemberId}", memberId);
            return Ok(profile);
        }

        /// <summary>
        /// Updates the name of the currently authenticated user.
        /// </summary>
        [HttpPatch("name")]
        public async Task<IActionResult> UpdateName([FromBody] UpdateProfileNameDto dto)
        {
            var memberId = GetCurrentMemberId();
            _logger.LogInformation("Profile NAME update requested for memberId {MemberId}", memberId);
            if (memberId == 0)
            {
                _logger.LogInformation("Profile NAME update rejected due to missing member ID claim");
                return Unauthorized("Brak identyfikatora użytkownika w tokenie.");
            }

            if (dto is null || !TryResolveName(dto, out var firstName, out var lastName))
            {
                _logger.LogInformation("Profile NAME update rejected due to empty payload for memberId {MemberId}", memberId);
                return BadRequest("Name (lub FirstName) jest wymagane.");
            }

            var updated = await _profileService.UpdateNameByIdAsync(memberId, firstName, lastName);
            if (!updated)
            {
                _logger.LogInformation("Profile NAME update not found for memberId {MemberId}", memberId);
                return NotFound("Nie znaleziono profilu dla zalogowanego użytkownika.");
            }

            _logger.LogInformation("Profile NAME update succeeded for memberId {MemberId}", memberId);
            return NoContent();
        }

        /// <summary>
        /// Updates the e-mail of the currently authenticated user.
        /// </summary>
        [HttpPatch("email")]
        public async Task<IActionResult> UpdateEmail([FromBody] UpdateProfileEmailDto dto)
        {
            var memberId = GetCurrentMemberId();
            _logger.LogInformation("Profile EMAIL update requested for memberId {MemberId}", memberId);
            if (memberId == 0)
            {
                _logger.LogInformation("Profile EMAIL update rejected due to missing member ID claim");
                return Unauthorized("Brak identyfikatora użytkownika w tokenie.");
            }

            var normalizedEmail = dto.Email?.Trim();
            if (string.IsNullOrWhiteSpace(normalizedEmail))
            {
                _logger.LogInformation("Profile EMAIL update rejected due to empty payload for memberId {MemberId}", memberId);
                return BadRequest("Email jest wymagany.");
            }

            var updated = await _profileService.UpdateEmailByIdAsync(memberId, normalizedEmail);
            if (!updated)
            {
                _logger.LogInformation("Profile EMAIL update not found for memberId {MemberId}", memberId);
                return NotFound("Nie znaleziono profilu dla zalogowanego użytkownika.");
            }

            _logger.LogInformation("Profile EMAIL update succeeded for memberId {MemberId}", memberId);
            return NoContent();
        }

        /// <summary>
        /// Updates the bio of the currently authenticated user.
        /// </summary>
        [HttpPatch("bio")]
        public async Task<IActionResult> UpdateBio([FromBody] UpdateProfileBioDto dto)
        {
            var memberId = GetCurrentMemberId();
            _logger.LogInformation("Profile BIO update requested for memberId {MemberId}", memberId);
            if (memberId == 0)
            {
                _logger.LogInformation("Profile BIO update rejected due to missing member ID claim");
                return Unauthorized("Brak identyfikatora użytkownika w tokenie.");
            }

            var normalizedBio = dto.Bio?.Trim();
            if (string.IsNullOrWhiteSpace(normalizedBio))
            {
                _logger.LogInformation("Profile BIO update rejected due to empty payload for memberId {MemberId}", memberId);
                return BadRequest("Bio jest wymagane.");
            }

            var updated = await _profileService.UpdateBioByIdAsync(memberId, normalizedBio);
            if (!updated)
            {
                _logger.LogInformation("Profile BIO update not found for memberId {MemberId}", memberId);
                return NotFound("Nie znaleziono profilu dla zalogowanego użytkownika.");
            }

            _logger.LogInformation("Profile BIO update succeeded for memberId {MemberId}", memberId);
            return NoContent();
        }

        /// <summary>
        /// Deletes the name of the currently authenticated user.
        /// </summary>
        [HttpDelete("name")]
        public async Task<IActionResult> DeleteName()
        {
            var memberId = GetCurrentMemberId();
            _logger.LogInformation("Profile NAME delete requested for memberId {MemberId}", memberId);
            if (memberId == 0)
            {
                _logger.LogInformation("Profile NAME delete rejected due to missing member ID claim");
                return Unauthorized("Brak identyfikatora użytkownika w tokenie.");
            }

            var deleted = await _profileService.DeleteNameByIdAsync(memberId);
            if (!deleted)
            {
                _logger.LogInformation("Profile NAME delete not found for memberId {MemberId}", memberId);
                return NotFound("Nie znaleziono profilu dla zalogowanego użytkownika.");
            }

            _logger.LogInformation("Profile NAME delete succeeded for memberId {MemberId}", memberId);
            return NoContent();
        }

        /// <summary>
        /// Deletes the e-mail of the currently authenticated user.
        /// </summary>
        [HttpDelete("email")]
        public async Task<IActionResult> DeleteEmail()
        {
            var memberId = GetCurrentMemberId();
            _logger.LogInformation("Profile EMAIL delete requested for memberId {MemberId}", memberId);
            if (memberId == 0)
            {
                _logger.LogInformation("Profile EMAIL delete rejected due to missing member ID claim");
                return Unauthorized("Brak identyfikatora użytkownika w tokenie.");
            }

            var deleted = await _profileService.DeleteEmailByIdAsync(memberId);
            if (!deleted)
            {
                _logger.LogInformation("Profile EMAIL delete not found for memberId {MemberId}", memberId);
                return NotFound("Nie znaleziono profilu dla zalogowanego użytkownika.");
            }

            _logger.LogInformation("Profile EMAIL delete succeeded for memberId {MemberId}", memberId);
            return NoContent();
        }

        /// <summary>
        /// Deletes the bio of the currently authenticated user.
        /// </summary>
        [HttpDelete("bio")]
        public async Task<IActionResult> DeleteBio()
        {
            var memberId = GetCurrentMemberId();
            _logger.LogInformation("Profile BIO delete requested for memberId {MemberId}", memberId);
            if (memberId == 0)
            {
                _logger.LogInformation("Profile BIO delete rejected due to missing member ID claim");
                return Unauthorized("Brak identyfikatora użytkownika w tokenie.");
            }

            var deleted = await _profileService.DeleteBioByIdAsync(memberId);
            if (!deleted)
            {
                _logger.LogInformation("Profile BIO delete not found for memberId {MemberId}", memberId);
                return NotFound("Nie znaleziono profilu dla zalogowanego użytkownika.");
            }

            _logger.LogInformation("Profile BIO delete succeeded for memberId {MemberId}", memberId);
            return NoContent();
        }

        /// <summary>
        /// Uploads a profile avatar image (JPEG/PNG/WebP, max 2 MB) for the current user.
        /// </summary>
        [HttpPost("avatar")]
        [RequestSizeLimit(2 * 1024 * 1024 + 64 * 1024)]
        public async Task<IActionResult> UploadAvatar(IFormFile file)
        {
            var memberId = GetCurrentMemberId();
            _logger.LogInformation("Profile AVATAR upload requested for memberId {MemberId}", memberId);
            if (memberId == 0)
            {
                return Unauthorized("Brak identyfikatora użytkownika w tokenie.");
            }

            var (avatarUrl, statusCode, error) = await _profileService.UploadAvatarByIdAsync(memberId, file);
            if (statusCode != 200)
            {
                return StatusCode(statusCode, new { error });
            }

            return Ok(new { avatarUrl });
        }

        /// <summary>
        /// Redirects to the public MinIO avatar URL (keeps old &lt;img src="/api/GetProfile/avatar/{id}"&gt; working).
        /// </summary>
        [HttpGet("avatar/{memberId:int}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetAvatar(int memberId)
        {
            var (ok, publicUrl, statusCode) = await _profileService.ResolveAvatarPublicUrlAsync(memberId);
            if (!ok || string.IsNullOrWhiteSpace(publicUrl))
            {
                return StatusCode(statusCode);
            }

            return Redirect(publicUrl);
        }

        /// <summary>
        /// Removes the current user's avatar.
        /// </summary>
        [HttpDelete("avatar")]
        public async Task<IActionResult> DeleteAvatar()
        {
            var memberId = GetCurrentMemberId();
            _logger.LogInformation("Profile AVATAR delete requested for memberId {MemberId}", memberId);
            if (memberId == 0)
            {
                return Unauthorized("Brak identyfikatora użytkownika w tokenie.");
            }

            var (ok, statusCode, error) = await _profileService.DeleteAvatarByIdAsync(memberId);
            if (!ok)
            {
                return StatusCode(statusCode, new { error });
            }

            return NoContent();
        }

        private int GetCurrentMemberId()
        {
            var memberId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue("nameid")
                ?? User.FindFirstValue("sub");

            if (int.TryParse(memberId, out var id))
            {
                return id;
            }

            return 0;
        }

        /// <summary>
        /// Prefer single Name; otherwise FirstName (+ optional LastName).
        /// Name splits on first space: first token → FirstName, remainder → LastName.
        /// </summary>
        private static bool TryResolveName(UpdateProfileNameDto dto, out string firstName, out string? lastName)
        {
            firstName = string.Empty;
            lastName = null;

            var single = dto.Name?.Trim();
            if (!string.IsNullOrWhiteSpace(single))
            {
                var space = single.IndexOf(' ');
                if (space < 0)
                {
                    firstName = single;
                    lastName = null;
                }
                else
                {
                    firstName = single[..space].Trim();
                    var rest = single[(space + 1)..].Trim();
                    lastName = string.IsNullOrWhiteSpace(rest) ? null : rest;
                }

                return !string.IsNullOrWhiteSpace(firstName);
            }

            firstName = dto.FirstName?.Trim() ?? string.Empty;
            var ln = dto.LastName?.Trim();
            lastName = string.IsNullOrWhiteSpace(ln) ? null : ln;
            return !string.IsNullOrWhiteSpace(firstName);
        }
    }
}