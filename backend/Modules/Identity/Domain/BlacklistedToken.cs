namespace backend.Modules.Identity.Domain
{
    public class BlacklistedToken
    {
        public int Id { get; set; }
        public string Jti { get; set; } = string.Empty;
        public DateTime ExpiryDate { get; set; }
    }
}
