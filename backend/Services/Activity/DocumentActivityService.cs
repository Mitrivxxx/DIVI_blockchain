using backend.Data;
using backend.DTOs;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.Activity
{
    public class DocumentActivityService : IDocumentActivityService
    {
        public const byte ActivityIssued = 0;
        public const byte ActivityRevoked = 1;

        private readonly AppDbContext _db;
        private readonly ILogger<DocumentActivityService> _logger;

        public DocumentActivityService(AppDbContext db, ILogger<DocumentActivityService> logger)
        {
            _db = db;
            _logger = logger;
        }

        public async Task LogAsync(
            string documentHash,
            byte activityType,
            string? txHash,
            long? blockNumber,
            int? memberId,
            DateTimeOffset? timestamp = null)
        {
            var hash = documentHash?.Trim() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(hash))
            {
                return;
            }

            _db.DocumentActivities.Add(new DocumentActivity
            {
                DocumentHash = hash,
                ActivityType = activityType,
                TxHash = string.IsNullOrWhiteSpace(txHash) ? null : txHash.Trim(),
                BlockNumber = blockNumber is > 0 ? blockNumber : null,
                MemberId = memberId,
                CreatedAt = timestamp ?? DateTimeOffset.UtcNow,
            });

            await _db.SaveChangesAsync();
            _logger.LogInformation(
                "DocumentActivity logged: {Type} hash {Hash} member {MemberId}",
                ActivityTypeToString(activityType),
                hash,
                memberId);
        }

        public async Task<IReadOnlyList<DocumentActivityItemDto>> GetMyActivityAsync(int memberId)
        {
            var member = await _db.Members.AsNoTracking()
                .FirstOrDefaultAsync(m => m.Id == memberId);

            var address = member?.EthereumAddress?.Trim().ToLowerInvariant();

            var relatedDocs = await _db.Documents.AsNoTracking()
                .Where(d =>
                    d.IssuedByMemberId == memberId
                    || (address != null && d.OwnerAddress.ToLower() == address))
                .ToListAsync();

            var relatedHashes = relatedDocs.Select(d => d.Hash).ToHashSet(StringComparer.OrdinalIgnoreCase);
            var ownerByHash = relatedDocs.ToDictionary(
                d => d.Hash,
                d => d.OwnerAddress,
                StringComparer.OrdinalIgnoreCase);
            var cidByHash = relatedDocs.ToDictionary(
                d => d.Hash,
                d => PreviewableCid(d.Cid),
                StringComparer.OrdinalIgnoreCase);

            var logged = await _db.DocumentActivities.AsNoTracking()
                .Where(a =>
                    a.MemberId == memberId
                    || relatedHashes.Contains(a.DocumentHash))
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();

            var items = new List<DocumentActivityItemDto>();
            var issuedLoggedHashes = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            foreach (var a in logged)
            {
                if (a.ActivityType == ActivityIssued)
                {
                    issuedLoggedHashes.Add(a.DocumentHash);
                }

                ownerByHash.TryGetValue(a.DocumentHash, out var owner);
                cidByHash.TryGetValue(a.DocumentHash, out var cid);
                items.Add(new DocumentActivityItemDto
                {
                    Hash = a.DocumentHash,
                    ActivityType = ActivityTypeToString(a.ActivityType),
                    TxHash = a.TxHash,
                    BlockNumber = a.BlockNumber,
                    MemberId = a.MemberId,
                    Timestamp = a.CreatedAt,
                    OwnerAddress = owner,
                    FromFallback = false,
                    Cid = cid,
                });
            }

            // Fallback: Documents TxHash/BlockNumber when no Issued activity row yet.
            foreach (var doc in relatedDocs)
            {
                if (issuedLoggedHashes.Contains(doc.Hash))
                {
                    continue;
                }

                if (string.IsNullOrWhiteSpace(doc.TxHash))
                {
                    continue;
                }

                items.Add(new DocumentActivityItemDto
                {
                    Hash = doc.Hash,
                    ActivityType = "Issued",
                    TxHash = doc.TxHash,
                    BlockNumber = doc.BlockNumber > 0 ? doc.BlockNumber : null,
                    MemberId = doc.IssuedByMemberId,
                    Timestamp = doc.IssuedAt,
                    OwnerAddress = doc.OwnerAddress,
                    FromFallback = true,
                    Cid = PreviewableCid(doc.Cid),
                });
            }

            return items
                .OrderByDescending(i => i.Timestamp)
                .ToList();
        }

        /// <summary>IPFS CID suitable for PDF preview; null for missing or metadata-only (meta:) docs.</summary>
        private static string? PreviewableCid(string? cid)
        {
            if (string.IsNullOrWhiteSpace(cid))
            {
                return null;
            }

            return cid.StartsWith("meta:", StringComparison.OrdinalIgnoreCase) ? null : cid;
        }

        private static string ActivityTypeToString(byte activityType) => activityType switch
        {
            ActivityRevoked => "Revoked",
            _ => "Issued",
        };
    }
}
