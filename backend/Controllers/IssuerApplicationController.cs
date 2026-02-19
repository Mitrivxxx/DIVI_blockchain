using backend.DTOs;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/issuer")]
    public class IssuerApplicationController : ControllerBase
    {
        private readonly backend.Services.Interfaces.IIssuerApplicationService _issuerApplicationService;

        public IssuerApplicationController(backend.Services.Interfaces.IIssuerApplicationService issuerApplicationService)
        {
            _issuerApplicationService = issuerApplicationService;
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateIssuerApplicationDto dto)
        {
            var entity = await _issuerApplicationService.CreateIssuerAsync(dto);
            return CreatedAtAction(null, new { id = entity.Id });
        }
        [HttpGet]
        public async Task<ActionResult<IEnumerable<IssuerApplicationListDto>>> GetOnlyPending()
        {
            var pendingIssuers = await _issuerApplicationService.GetOnlyPendingIssuerAsync();
            return Ok(pendingIssuers);
        }
        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateStatus(Guid id, [FromQuery] string status)
        {
            var result = await _issuerApplicationService.UpdateStatusIssuerAsync(id, status);
            if (!result)
            {
                return BadRequest("Invalid request or status.");
            }
            return NoContent();
        }

    }
}