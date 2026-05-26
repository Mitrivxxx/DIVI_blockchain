using System;

namespace backend.DTOs
{
    public record OwnerDocumentInfoDto(string Hash, string Issuer, DateTimeOffset IssuedAt);
}
