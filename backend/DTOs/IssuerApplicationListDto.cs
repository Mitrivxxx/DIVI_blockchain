namespace backend.DTOs
{
    public class IssuerApplicationListDto
    {
        public Guid Id { get; set; }
        public string InstitutionName { get; set; } = default!;
        public string EthereumAddress { get; set; } = default!;
        public IssuerApplicationStatus Status { get; set; }
    }
}