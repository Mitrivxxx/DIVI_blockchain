using backend.Modules.Issuers.Application;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Modules.Issuers.Api
{
    /// <summary>Public catalog of IssuerProfile institutions.</summary>
    [ApiController]
    [Route("api/institutions")]
    [AllowAnonymous]
    public class InstitutionsController : ControllerBase
    {
        private readonly IIssuerProfileService _issuerProfileService;

        public InstitutionsController(IIssuerProfileService issuerProfileService)
        {
            _issuerProfileService = issuerProfileService;
        }

        /// <summary>
        /// List institutions. Optional <c>q</c> filters by name / country / description / tax id (min 2 chars).
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> List([FromQuery] string? q, [FromQuery] int limit = 100)
        {
            var results = await _issuerProfileService.ListInstitutionsAsync(q, limit);
            return Ok(results);
        }

        [HttpGet("{memberId:int}")]
        public async Task<IActionResult> GetByMemberId(int memberId)
        {
            var institution = await _issuerProfileService.GetInstitutionByMemberIdAsync(memberId);
            if (institution is null)
            {
                return NotFound(new { error = "Nie znaleziono instytucji." });
            }

            return Ok(institution);
        }
    }
}
