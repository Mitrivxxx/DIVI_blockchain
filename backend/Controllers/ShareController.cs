using backend.Services.Credentials;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/share")]
    public class ShareController : ControllerBase
    {
        private readonly ICredentialWalletService _credentials;

        public ShareController(ICredentialWalletService credentials)
        {
            _credentials = credentials;
        }

        [HttpGet("{token}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetSharedCredential(string token)
        {
            var item = await _credentials.GetByShareTokenAsync(token);
            if (item is null)
            {
                return NotFound(new { error = "Shared credential not found" });
            }

            return Ok(item);
        }
    }
}
