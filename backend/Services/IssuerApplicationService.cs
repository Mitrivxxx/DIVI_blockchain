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
            return entity;
        }

        public async Task<IEnumerable<IssuerApplicationListDto>> GetOnlyPendingIssuerAsync()
        {
            return await _db.IssuerApplications
                .Where(x => x.Status == IssuerApplicationStatus.Pending)
                .Select(x => new IssuerApplicationListDto
                {
                    Id = x.Id,
                    InstitutionName = x.InstitutionName,
                    EthereumAddress = x.EthereumAddress,
                    Status = x.Status
                })
                .ToListAsync();
        }

        public async Task<bool> UpdateStatusIssuerAsync(Guid id, string status)
        {
            var entity = await _db.IssuerApplications.FirstOrDefaultAsync(x => x.Id == id);
            if (entity == null)
                return false;

            if (!Enum.TryParse<IssuerApplicationStatus>(status, true, out var newStatus) ||
                (newStatus != IssuerApplicationStatus.Approved && newStatus != IssuerApplicationStatus.Rejected))
            {
                return false;
            }

            if (newStatus == IssuerApplicationStatus.Approved)
            {
                try
                {
                    await _blockchainService.AddIssuerAsync(entity.EthereumAddress);
                }
                catch
                {
                    // Blockchain failed, do not update DB
                    return false;
                }
            }
            entity.Status = newStatus;
            await _db.SaveChangesAsync();
            return true;
        }
    }
}
