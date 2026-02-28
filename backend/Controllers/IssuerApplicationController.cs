using backend.DTOs;
using Microsoft.AspNetCore.Mvc;

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
        [Microsoft.AspNetCore.Authorization.Authorize(Roles = "User")]
        public async Task<IActionResult> Create([FromBody] CreateIssuerApplicationDto dto)
        {
            Console.WriteLine($"[IssuerApplicationController] POST /api/issuer - Received: {dto?.InstitutionName}, {dto!.EthereumAddress}");
            var entity = await _issuerApplicationService.CreateIssuerAsync(dto);
            Console.WriteLine($"[IssuerApplicationController] Created issuer application with id: {entity.Id}");
            return CreatedAtAction(null, new { id = entity.Id });
        }

        /// <summary>
        /// Gets only pending applications for admin to review.
        /// </summary>
        [HttpGet]
        [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<IssuerApplicationListDto>>> GetOnlyPending()
        {
            Console.WriteLine("[IssuerApplicationController] GET /api/issuer - OnlyPending called");
            var pendingIssuers = await _issuerApplicationService.GetOnlyPendingIssuerAsync();
            Console.WriteLine($"[IssuerApplicationController] Pending count: {pendingIssuers?.Count()}");
            return Ok(pendingIssuers);
        }

        /// <summary>
        /// Updates application status (notify).
        /// </summary>
        [HttpPatch("{id}/status")]
        [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateStatus(Guid id, [FromQuery] string status)
        {
            Console.WriteLine($"[IssuerApplicationController] PATCH /api/issuer/{{id}}/status - id: {id}, status: {status}");
            var result = await _issuerApplicationService.UpdateStatusIssuerAsync(id, status);
            if (!result)
            {
                Console.WriteLine("[IssuerApplicationController] UpdateStatus failed: Invalid request or status.");
                return BadRequest("Invalid request or status.");
            }
            Console.WriteLine("[IssuerApplicationController] UpdateStatus succeeded");
            return NoContent();
        }



    }
}