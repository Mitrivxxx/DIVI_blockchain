using backend.BuildingBlocks;
using backend.Modules.Documents.Application;
using backend.Modules.Documents.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Modules.Documents.Api
{
    /// <summary>
    /// Credential wallet and activity under the shared <c>api/profiles</c> prefix (member profile itself lives in Members).
    /// </summary>
    [ApiController]
    [Route("api/profiles")]
    public class CredentialWalletController : ControllerBase
    {
        private readonly ICredentialWalletService _credentials;
        private readonly IDocumentActivityService _activity;
        private readonly ILogger<CredentialWalletController> _logger;

        public CredentialWalletController(
            ICredentialWalletService credentials,
            IDocumentActivityService activity,
            ILogger<CredentialWalletController> logger)
        {
            _credentials = credentials;
            _activity = activity;
            _logger = logger;
        }

        [HttpGet("me/credentials")]
        [Authorize]
        public async Task<IActionResult> GetMyCredentials()
        {
            if (User.GetMemberId() is not int memberId)
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
            if (User.GetMemberId() is not int memberId)
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
            if (User.GetMemberId() is not int memberId)
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

        /// <summary>Public Issued/Revoked timeline for documents marked visibility=public.</summary>
        [HttpGet("{ethereumAddress}/activity")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPublicActivity(string ethereumAddress)
        {
            var items = await _activity.GetPublicActivityByAddressAsync(ethereumAddress);
            return Ok(items);
        }
    }
}
