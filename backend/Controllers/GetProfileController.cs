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
            var ethereumAddress = GetCurrentEthereumAddress();
            _logger.LogInformation("Profile GET requested for address {EthereumAddress}", ethereumAddress ?? "<missing>");
            if (string.IsNullOrWhiteSpace(ethereumAddress))
            {
                _logger.LogInformation("Profile GET rejected due to missing Ethereum address claim");
                return Unauthorized("Brak adresu Ethereum w tokenie.");
            }

            var profile = await _profileService.GetProfileByAddressAsync(ethereumAddress);
            if (profile is null)
            {
                _logger.LogInformation("Profile GET not found for address {EthereumAddress}", ethereumAddress);
                return NotFound("Nie znaleziono profilu dla zalogowanego użytkownika.");
            }

            _logger.LogInformation("Profile GET succeeded for address {EthereumAddress}", ethereumAddress);
            return Ok(profile);
        }

        /// <summary>
        /// Updates the name of the currently authenticated user.
        /// </summary>
        [HttpPatch("name")]
        public async Task<IActionResult> UpdateName([FromBody] UpdateProfileNameDto dto)
        {
            var ethereumAddress = GetCurrentEthereumAddress();
            _logger.LogInformation("Profile NAME update requested for address {EthereumAddress}", ethereumAddress ?? "<missing>");
            if (string.IsNullOrWhiteSpace(ethereumAddress))
            {
                _logger.LogInformation("Profile NAME update rejected due to missing Ethereum address claim");
                return Unauthorized("Brak adresu Ethereum w tokenie.");
            }

            var normalizedName = dto.Name?.Trim();
            if (string.IsNullOrWhiteSpace(normalizedName))
            {
                _logger.LogInformation("Profile NAME update rejected due to empty payload for address {EthereumAddress}", ethereumAddress);
                return BadRequest("Name jest wymagane.");
            }

            var updated = await _profileService.UpdateNameAsync(ethereumAddress, normalizedName);
            if (!updated)
            {
                _logger.LogInformation("Profile NAME update not found for address {EthereumAddress}", ethereumAddress);
                return NotFound("Nie znaleziono profilu dla zalogowanego użytkownika.");
            }

            _logger.LogInformation("Profile NAME update succeeded for address {EthereumAddress}", ethereumAddress);
            return NoContent();
        }

        /// <summary>
        /// Updates the e-mail of the currently authenticated user.
        /// </summary>
        [HttpPatch("email")]
        public async Task<IActionResult> UpdateEmail([FromBody] UpdateProfileEmailDto dto)
        {
            var ethereumAddress = GetCurrentEthereumAddress();
            _logger.LogInformation("Profile EMAIL update requested for address {EthereumAddress}", ethereumAddress ?? "<missing>");
            if (string.IsNullOrWhiteSpace(ethereumAddress))
            {
                _logger.LogInformation("Profile EMAIL update rejected due to missing Ethereum address claim");
                return Unauthorized("Brak adresu Ethereum w tokenie.");
            }

            var normalizedEmail = dto.Email?.Trim();
            if (string.IsNullOrWhiteSpace(normalizedEmail))
            {
                _logger.LogInformation("Profile EMAIL update rejected due to empty payload for address {EthereumAddress}", ethereumAddress);
                return BadRequest("Email jest wymagany.");
            }

            var updated = await _profileService.UpdateEmailAsync(ethereumAddress, normalizedEmail);
            if (!updated)
            {
                _logger.LogInformation("Profile EMAIL update not found for address {EthereumAddress}", ethereumAddress);
                return NotFound("Nie znaleziono profilu dla zalogowanego użytkownika.");
            }

            _logger.LogInformation("Profile EMAIL update succeeded for address {EthereumAddress}", ethereumAddress);
            return NoContent();
        }

        /// <summary>
        /// Updates the bio of the currently authenticated user.
        /// </summary>
        [HttpPatch("bio")]
        public async Task<IActionResult> UpdateBio([FromBody] UpdateProfileBioDto dto)
        {
            var ethereumAddress = GetCurrentEthereumAddress();
            _logger.LogInformation("Profile BIO update requested for address {EthereumAddress}", ethereumAddress ?? "<missing>");
            if (string.IsNullOrWhiteSpace(ethereumAddress))
            {
                _logger.LogInformation("Profile BIO update rejected due to missing Ethereum address claim");
                return Unauthorized("Brak adresu Ethereum w tokenie.");
            }

            var normalizedBio = dto.Bio?.Trim();
            if (string.IsNullOrWhiteSpace(normalizedBio))
            {
                _logger.LogInformation("Profile BIO update rejected due to empty payload for address {EthereumAddress}", ethereumAddress);
                return BadRequest("Bio jest wymagane.");
            }

            var updated = await _profileService.UpdateBioAsync(ethereumAddress, normalizedBio);
            if (!updated)
            {
                _logger.LogInformation("Profile BIO update not found for address {EthereumAddress}", ethereumAddress);
                return NotFound("Nie znaleziono profilu dla zalogowanego użytkownika.");
            }

            _logger.LogInformation("Profile BIO update succeeded for address {EthereumAddress}", ethereumAddress);
            return NoContent();
        }

        /// <summary>
        /// Deletes the name of the currently authenticated user.
        /// </summary>
        [HttpDelete("name")]
        public async Task<IActionResult> DeleteName()
        {
            var ethereumAddress = GetCurrentEthereumAddress();
            _logger.LogInformation("Profile NAME delete requested for address {EthereumAddress}", ethereumAddress ?? "<missing>");
            if (string.IsNullOrWhiteSpace(ethereumAddress))
            {
                _logger.LogInformation("Profile NAME delete rejected due to missing Ethereum address claim");
                return Unauthorized("Brak adresu Ethereum w tokenie.");
            }

            var deleted = await _profileService.DeleteNameAsync(ethereumAddress);
            if (!deleted)
            {
                _logger.LogInformation("Profile NAME delete not found for address {EthereumAddress}", ethereumAddress);
                return NotFound("Nie znaleziono profilu dla zalogowanego użytkownika.");
            }

            _logger.LogInformation("Profile NAME delete succeeded for address {EthereumAddress}", ethereumAddress);
            return NoContent();
        }

        /// <summary>
        /// Deletes the e-mail of the currently authenticated user.
        /// </summary>
        [HttpDelete("email")]
        public async Task<IActionResult> DeleteEmail()
        {
            var ethereumAddress = GetCurrentEthereumAddress();
            _logger.LogInformation("Profile EMAIL delete requested for address {EthereumAddress}", ethereumAddress ?? "<missing>");
            if (string.IsNullOrWhiteSpace(ethereumAddress))
            {
                _logger.LogInformation("Profile EMAIL delete rejected due to missing Ethereum address claim");
                return Unauthorized("Brak adresu Ethereum w tokenie.");
            }

            var deleted = await _profileService.DeleteEmailAsync(ethereumAddress);
            if (!deleted)
            {
                _logger.LogInformation("Profile EMAIL delete not found for address {EthereumAddress}", ethereumAddress);
                return NotFound("Nie znaleziono profilu dla zalogowanego użytkownika.");
            }

            _logger.LogInformation("Profile EMAIL delete succeeded for address {EthereumAddress}", ethereumAddress);
            return NoContent();
        }

        /// <summary>
        /// Deletes the bio of the currently authenticated user.
        /// </summary>
        [HttpDelete("bio")]
        public async Task<IActionResult> DeleteBio()
        {
            var ethereumAddress = GetCurrentEthereumAddress();
            _logger.LogInformation("Profile BIO delete requested for address {EthereumAddress}", ethereumAddress ?? "<missing>");
            if (string.IsNullOrWhiteSpace(ethereumAddress))
            {
                _logger.LogInformation("Profile BIO delete rejected due to missing Ethereum address claim");
                return Unauthorized("Brak adresu Ethereum w tokenie.");
            }

            var deleted = await _profileService.DeleteBioAsync(ethereumAddress);
            if (!deleted)
            {
                _logger.LogInformation("Profile BIO delete not found for address {EthereumAddress}", ethereumAddress);
                return NotFound("Nie znaleziono profilu dla zalogowanego użytkownika.");
            }

            _logger.LogInformation("Profile BIO delete succeeded for address {EthereumAddress}", ethereumAddress);
            return NoContent();
        }

        private string? GetCurrentEthereumAddress()
        {
            return User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue("nameid")
                ?? User.FindFirstValue("sub");
        }
    }
}