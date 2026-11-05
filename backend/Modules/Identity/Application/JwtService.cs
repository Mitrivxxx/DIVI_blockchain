using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
namespace backend.Modules.Identity.Application
{
    public class JwtService : IJwtService
    {
        private readonly IConfiguration _configuration;

        public JwtService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        // ACCESS TOKEN (krótki)
        public string GenerateAccessToken(string userId, string role)
        {
            var normalizedRole = string.IsNullOrWhiteSpace(role) ? "user" : role.ToLowerInvariant();
            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, userId),
                new Claim(ClaimTypes.Role, normalizedRole),
                new Claim("type", "access"),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var creds = new SigningCredentials(GetKey(), SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: GetIssuer(),
                audience: GetAudience(),
                claims: claims,
                notBefore: DateTime.UtcNow,
                expires: DateTime.UtcNow.AddMinutes(15),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        // REFRESH TOKEN (długi)
        public string GenerateRefreshToken(string userId)
        {
            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, userId),
                new Claim("type", "refresh"),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var creds = new SigningCredentials(GetKey(), SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: GetIssuer(),
                audience: GetAudience(),
                claims: claims,
                notBefore: DateTime.UtcNow,
                expires: DateTime.UtcNow.AddDays(7),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        // WALIDACJA REFRESH TOKENA
        public string? ValidateRefreshToken(string token)
        {
            if (string.IsNullOrWhiteSpace(token))
                return null;

            // Keep raw claim names: the default inbound map renames "sub" to ClaimTypes.NameIdentifier.
            var handler = new JwtSecurityTokenHandler { MapInboundClaims = false };

            try
            {
                var principal = handler.ValidateToken(token, new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = GetKey(),

                    ValidateIssuer = true,
                    ValidIssuer = GetIssuer(),

                    ValidateAudience = true,
                    ValidAudience = GetAudience(),

                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                }, out _);

                // MUSI być refresh
                var type = principal.FindFirst("type")?.Value;
                if (type != "refresh") return null;

                // zwracamy userId
                return principal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
            }
            catch
            {
                return null;
            }
        }

        // KLUCZ (krytyczne)
        private SymmetricSecurityKey GetKey()
        {
            var key = Environment.GetEnvironmentVariable("JWT_KEY")
                      ?? _configuration["Jwt:Key"];

            if (string.IsNullOrWhiteSpace(key) || key.Length < 32)
                throw new Exception("JWT_KEY must be at least 32 characters long");

            return new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        }

        private string GetIssuer()
        {
            return Environment.GetEnvironmentVariable("JWT_ISSUER")
                   ?? _configuration["Jwt:Issuer"]
                   ?? throw new Exception("JWT_ISSUER not set");
        }

        private string GetAudience()
        {
            return Environment.GetEnvironmentVariable("JWT_AUDIENCE")
                   ?? _configuration["Jwt:Audience"]
                   ?? throw new Exception("JWT_AUDIENCE not set");
        }
    }
}