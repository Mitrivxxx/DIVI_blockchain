namespace backend.Infrastructure.Blockchain
{
    public record OwnerDocumentInfoDto(string Hash, string Issuer, DateTimeOffset IssuedAt);
}
