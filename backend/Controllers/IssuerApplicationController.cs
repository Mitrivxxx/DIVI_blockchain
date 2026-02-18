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
        private readonly BlockchainService _blockchainService;

        public IssuerApplicationController(AppDbContext db, BlockchainService blockchainService)
        {
            _db = db;
            _blockchainService = blockchainService;
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
                   Id = x.Id,
                   InstitutionName = x.InstitutionName,
                   EthereumAddress = x.EthereumAddress,
                   Status = x.Status
               })
               .ToListAsync();

            return Ok(pendingIssuers);
        }
        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateStatus(Guid id, [FromQuery] string status)
        {
            var entity = await _db.IssuerApplications.FirstOrDefaultAsync(x => x.Id == id);
            if (entity == null)
                return NotFound();

            if (!Enum.TryParse<IssuerApplicationStatus>(status, true, out var newStatus) ||
                (newStatus != IssuerApplicationStatus.Approved && newStatus != IssuerApplicationStatus.Rejected))
            {
                return BadRequest("Status must be 'Approved' or 'Rejected'.");
            }

            entity.Status = newStatus;
            await _db.SaveChangesAsync();

            if (newStatus == IssuerApplicationStatus.Approved)
            {
                await _blockchainService.AddIssuerAsync(entity.EthereumAddress);
            }

            return NoContent();
        }

    }
}