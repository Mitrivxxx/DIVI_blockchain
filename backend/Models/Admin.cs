namespace backend.Models
{
    public class Admin
    {
        public Guid Id { get; set; }
        public string EthereumAddress { get; set; } = string.Empty;
    }
}