namespace backend.Modules.Issuers.Contracts
{
    public class CreateIssuerApplicationDto
    {
        public string InstitutionName { get; set; } = default!;
        public string EthereumAddress { get; set; } = default!;
        public string Email { get; set; } = default!;
        public string Description { get; set; } = default!;
    }
}