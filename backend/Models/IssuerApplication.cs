public enum IssuerApplicationStatus
{
    Pending,
    Approved,
    Rejected
}

namespace backend.Models
{
    public class IssuerApplication
    {
        public Guid Id { get; set; }


        public string InstitutionName { get; set; } = string.Empty;

        public string EthereumAddress { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public IssuerApplicationStatus Status { get; set; }

        public DateTime CreatedAt { get; set; }
    }

}