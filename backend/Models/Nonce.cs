using System;

namespace backend.Models
{
    public class Nonce
    {
        public int Id { get; set; }
        public string Address { get; set; } = string.Empty;
        public string Value { get; set; } = string.Empty;
        public bool IsUsed { get; set; } = true;
        public DateTime ExpiresAt { get; set; }
    }
}