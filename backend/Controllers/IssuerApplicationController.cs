using backend.DTOs;
using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class IssuerApplicationController : ControllerBase
    {
        private readonly AppDbContext _db;

        public IssuerApplicationController(AppDbContext db)
        {
            _db = db;
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateIssuerApplicationDto dto)
        {
            var entity = new IssuerApplication
            {
                Id = Guid.NewGuid(),
                InstitutionName = dto.InstitutionName,
                EthereumAddress = dto.EthereumAddress,
                Email = dto.Email,
                Description = dto.Description,
                Status = IssuerApplicationStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };
            _db.IssuerApplications.Add(entity);
            await _db.SaveChangesAsync();
            return CreatedAtAction(null, new { id = entity.Id });
        }
        [HttpGet]
        public async Task<ActionResult<IEnumerable<IssuerApplicationListDto>>> GetOnlyPending()
        {
            var pendingIssuers = await _db.IssuerApplications
               .Where(x => x.Status == IssuerApplicationStatus.Pending)
               .Select(x => new IssuerApplicationListDto
               {
                   InstitutionName = x.InstitutionName,
                   Status = x.Status
               })
               .ToListAsync();

            return Ok(pendingIssuers);
        }
    }
}