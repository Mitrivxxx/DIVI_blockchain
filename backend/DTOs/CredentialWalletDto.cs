namespace backend.DTOs
{
    public class CredentialWalletDto
    {
        public IReadOnlyList<CredentialSectionDto> Sections { get; set; } = Array.Empty<CredentialSectionDto>();
    }

    public class CredentialSectionDto
    {
        public byte DocumentType { get; set; }
        public string Label { get; set; } = string.Empty;
        public IReadOnlyList<CredentialItemDto> Items { get; set; } = Array.Empty<CredentialItemDto>();
    }

    public class PublicCredentialWalletDto
    {
        public IReadOnlyList<PublicCredentialSectionDto> Sections { get; set; } = Array.Empty<PublicCredentialSectionDto>();
    }

    public class PublicCredentialSectionDto
    {
        public byte DocumentType { get; set; }
        public string Label { get; set; } = string.Empty;
        public IReadOnlyList<PublicCredentialDto> Items { get; set; } = Array.Empty<PublicCredentialDto>();
    }
}
