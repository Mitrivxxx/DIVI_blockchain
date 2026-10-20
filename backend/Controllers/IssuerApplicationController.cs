using backend.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Serilog;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/issuer")]
    public class IssuerApplicationController : ControllerBase
    {
        private readonly Services.Issuers.IIssuerApplicationService _issuerApplicationService;
        public IssuerApplicationController(Services.Issuers.IIssuerApplicationService issuerApplicationService)
        {
            _issuerApplicationService = issuerApplicationService;
        }

        /// <summary>
        /// Creates a new issuer application (applicationissuer -> notify).
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "user")]
        public async Task<IActionResult> Create([FromBody] CreateIssuerApplicationDto dto)
        {
            var entity = await _issuerApplicationService.CreateIssuerAsync(dto);
            return CreatedAtAction(null, new { id = entity.Id });
        }

        /// <summary>
        /// Gets only pending applications for admin/owner to review.
        /// </summary>
        [HttpGet]
        [Authorize(Roles = "admin,owner")]
        public async Task<ActionResult<IEnumerable<IssuerApplicationListDto>>> GetOnlyPending()
        {
            var pendingIssuers = await _issuerApplicationService.GetOnlyPendingIssuerAsync();
            return Ok(pendingIssuers);
        }

        /// <summary>
        /// Updates application status (notify). Approve → on-chain addIssuer + DB role issuer.
        /// </summary>
        [HttpPatch("{id}/status")]
        [Authorize(Roles = "admin,owner")]
        public async Task<IActionResult> UpdateStatus(int id, [FromQuery] string status)
        {
            var (ok, error) = await _issuerApplicationService.UpdateStatusIssuerAsync(id, status);
            if (!ok)
            {
                Log.Warning("[IssuerApplicationController] UpdateStatus failed: {Error}", error);
                return BadRequest(error ?? "Invalid request or status.");
            }
            return NoContent();
        }
    }
}
