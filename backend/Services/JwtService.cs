using backend.Services.Interfaces;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using backend.Services;
using System.Text;
using Microsoft.Extensions.Configuration;
using System;

namespace backend.Services
{
    public class JwtService : IJwtService
    {
        private readonly IUserRoleService _userRoleService;
        private readonly IConfiguration _configuration;

        public JwtService(IUserRoleService userRoleService, IConfiguration configuration)
        {
            _userRoleService = userRoleService;
            _configuration = configuration;
        }

        public string GenerateToken(string address)
        {
            var userRole = _userRoleService.GetUserRole(address);
            Console.WriteLine($"[JwtService] GenerateToken for {address}, role: {userRole}");
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, address),
                new Claim(ClaimTypes.Role, userRole.ToString())
            };

            var jwtKey = _configuration["Jwt:Key"] ?? "super_secret_key";
            var jwtIssuer = _configuration["Jwt:Issuer"] ?? "DIVI";
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: jwtIssuer,
                audience: jwtIssuer,
                claims: claims,
                expires: DateTime.Now.AddHours(2),
                signingCredentials: creds
            );

            var jwt = new JwtSecurityTokenHandler().WriteToken(token);
            Console.WriteLine($"[JwtService] Token generated: {jwt.Substring(0, 20)}...");
            return jwt;
        }
    }
}
