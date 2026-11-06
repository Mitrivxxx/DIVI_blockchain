using backend.Modules.Issuers.Application;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Modules.Issuers.Api
{
    /// <summary>
    /// Public institution card for /u/:address (mirrors CredentialWalletController routing under api/profiles).
    /// </summary>
    [ApiController]
    [Route("api/profiles")]
    public class PublicIssuerInstitutionController : ControllerBase
    {
        private readonly IIssuerProfileService _issuerProfileService;

        public PublicIssuerInstitutionController(IIssuerProfileService issuerProfileService)
        {
            _issuerProfileService = issuerProfileService;
        }

        [HttpGet("{ethereumAddress}/institution")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPublicInstitution(string ethereumAddress)
        {
            var profile = await _issuerProfileService.GetByEthereumAddressAsync(ethereumAddress);
            if (profile is null)
            {
                return NotFound(new { error = "Issuer institution profile not found." });
            }

            return Ok(profile);
        }

        /// <summary>
        /// Ephemeral: check if address is in contract authorizedIssuers. No persistence.
        /// </summary>
        [HttpGet("{ethereumAddress}/verify-issuer")]
        [AllowAnonymous]
        public async Task<IActionResult> VerifyIssuerOnChain(string ethereumAddress)
        {
            var result = await _issuerProfileService.VerifyIssuerOnChainAsync(ethereumAddress);
            return Ok(result);
        }
    }
}
