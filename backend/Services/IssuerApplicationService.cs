using backend.Data;
using backend.DTOs;
using backend.Models;
using backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    public class IssuerApplicationService : IIssuerApplicationService
    {
        private readonly AppDbContext _db;
        private readonly BlockchainService _blockchainService;

        public IssuerApplicationService(AppDbContext db, BlockchainService blockchainService)
        {
            _db = db;
            _blockchainService = blockchainService;
        }

        public async Task<IssuerApplication> CreateIssuerAsync(CreateIssuerApplicationDto dto)
        {
            Console.WriteLine($"[IssuerApplicationService] CreateIssuerAsync - Creating for {dto?.InstitutionName}, {dto?.EthereumAddress}");
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
            Console.WriteLine($"[IssuerApplicationService] Created entity with id: {entity.Id}");
            return entity;
        }

        public async Task<IEnumerable<IssuerApplicationListDto>> GetOnlyPendingIssuerAsync()
        {
            Console.WriteLine("[IssuerApplicationService] GetOnlyPendingIssuerAsync called");
            var result = await _db.IssuerApplications
                .Where(x => x.Status == IssuerApplicationStatus.Pending)
                .Select(x => new IssuerApplicationListDto
                {
                    Id = x.Id,
                    InstitutionName = x.InstitutionName,
                    EthereumAddress = x.EthereumAddress,
                    Status = x.Status
                })
                .ToListAsync();
            Console.WriteLine($"[IssuerApplicationService] Pending found: {result.Count}");
            return result;
        }

        public async Task<bool> UpdateStatusIssuerAsync(Guid id, string status)
        {
            Console.WriteLine($"[IssuerApplicationService] UpdateStatusIssuerAsync - id: {id}, status: {status}");
            var entity = await _db.IssuerApplications.FirstOrDefaultAsync(x => x.Id == id);
            if (entity == null)
            {
                Console.WriteLine("[IssuerApplicationService] UpdateStatusIssuerAsync - entity not found");
                return false;
            }

            if (!Enum.TryParse<IssuerApplicationStatus>(status, true, out var newStatus) ||
                (newStatus != IssuerApplicationStatus.Approved && newStatus != IssuerApplicationStatus.Rejected))
            {
                Console.WriteLine("[IssuerApplicationService] UpdateStatusIssuerAsync - invalid status");
                return false;
            }

            if (newStatus == IssuerApplicationStatus.Approved)
            {
                try
                {
                    await _blockchainService.AddIssuerAsync(entity.EthereumAddress);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[IssuerApplicationService] Blockchain error: {ex.Message}");
                    return false;
                }
            }
            entity.Status = newStatus;
            await _db.SaveChangesAsync();
            Console.WriteLine($"[IssuerApplicationService] Status updated to {newStatus}");
            return true;
        }
    }
}
