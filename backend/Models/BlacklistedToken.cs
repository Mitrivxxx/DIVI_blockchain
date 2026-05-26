using System;

namespace backend.Models
{
    public class BlacklistedToken
    {
        public int Id { get; set; }
        public string Jti { get; set; } = string.Empty;
        public DateTime ExpiryDate { get; set; }
    }
}
