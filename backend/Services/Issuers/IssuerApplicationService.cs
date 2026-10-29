using backend.Data;
using backend.DTOs;
using backend.Models;
using backend.Services.Issuers;
using backend.Services.Blockchain;
using Microsoft.EntityFrameworkCore;
using Serilog;

namespace backend.Services.Issuers
{
	public class IssuerApplicationService : IIssuerApplicationService
	 {
        private const int IssuerRoleId = 2;

        private readonly AppDbContext _db;
        private readonly IBlockchainService _blockchainService;
        private readonly IIssuerProfileService _issuerProfileService;

        public IssuerApplicationService(
            AppDbContext db,
            IBlockchainService blockchainService,
            IIssuerProfileService issuerProfileService)
        {
            _db = db;
            _blockchainService = blockchainService;
            _issuerProfileService = issuerProfileService;
        }

        public async Task<IssuerApplication> CreateIssuerAsync(CreateIssuerApplicationDto dto)
        {
            Log.Information(
                "[IssuerApplicationService] CreateIssuerAsync for {Institution}, {Address}",
                dto?.InstitutionName,
                dto!.EthereumAddress);

            var entity = new IssuerApplication
            {
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

        public async Task<(bool Ok, string? Error)> UpdateStatusIssuerAsync(int id, string status)
        {
            var entity = await _db.IssuerApplications.FirstOrDefaultAsync(x => x.Id == id);
            if (entity == null)
            {
                return (false, "Application not found.");
            }

            if (!Enum.TryParse<IssuerApplicationStatus>(status, true, out var newStatus) ||
                (newStatus != IssuerApplicationStatus.Approved && newStatus != IssuerApplicationStatus.Rejected))
            {
                return (false, "Invalid status. Use Approved or Rejected.");
            }

            Member? approvedMember = null;

            if (newStatus == IssuerApplicationStatus.Approved)
            {
                var normalizedAddress = entity.EthereumAddress.Trim().ToLowerInvariant();
                var member = await _db.Members
                    .FirstOrDefaultAsync(m =>
                        m.EthereumAddress != null &&
                        m.EthereumAddress.ToLower() == normalizedAddress);

                if (member is null)
                {
                    return (false, "No Member found for this Ethereum address. The applicant must register/login with that wallet first.");
                }

                try
                {
                    await _blockchainService.AddIssuerAsync(entity.EthereumAddress);
                }
                catch (Exception ex)
                {
                    Log.Error(ex, "[IssuerApplicationService] Blockchain AddIssuer failed for {Address}", entity.EthereumAddress);
                    return (false, $"Blockchain error: {ex.Message}");
                }

                member.MemberRoleId = IssuerRoleId;
                approvedMember = member;
            }

            entity.Status = newStatus;
            await _db.SaveChangesAsync();

            if (approvedMember is not null)
            {
                await _issuerProfileService.UpsertFromApplicationAsync(
                    approvedMember.Id,
                    entity.InstitutionName,
                    entity.Description);
            }

            Log.Information("[IssuerApplicationService] Application {Id} status → {Status}", id, newStatus);
            return (true, null);
        }
    }
}
