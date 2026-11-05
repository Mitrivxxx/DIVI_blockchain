using backend.BuildingBlocks;
using backend.Infrastructure.Persistence;
using backend.Infrastructure.Blockchain;
using backend.Modules.Issuers.Contracts;
using backend.Modules.Issuers.Domain;
using backend.Modules.Members.Contracts;
using Microsoft.EntityFrameworkCore;
using Serilog;

namespace backend.Modules.Issuers.Application
{
	public class IssuerApplicationService : IIssuerApplicationService
	 {
        private readonly AppDbContext _db;
        private readonly IBlockchainService _blockchainService;
        private readonly IIssuerProfileService _issuerProfileService;
        private readonly IMemberDirectory _members;

        public IssuerApplicationService(
            AppDbContext db,
            IBlockchainService blockchainService,
            IIssuerProfileService issuerProfileService,
            IMemberDirectory members)
        {
            _db = db;
            _blockchainService = blockchainService;
            _issuerProfileService = issuerProfileService;
            _members = members;
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

            MemberAccount? approvedMember = null;

            if (newStatus == IssuerApplicationStatus.Approved)
            {
                var member = await _members.FindByEthereumAddressAsync(entity.EthereumAddress);
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

                approvedMember = member;
            }

            // Members and IssuerApplications share the scoped AppDbContext, so SetRoleAsync
            // commits the status change in the same SaveChanges.
            entity.Status = newStatus;
            if (approvedMember is not null)
            {
                await _members.SetRoleAsync(approvedMember.Id, MemberRoles.IssuerId);
            }
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
