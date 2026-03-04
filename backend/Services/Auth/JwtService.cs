using backend.Services.Auth;
using backend.Services.Roles;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.Extensions.Configuration;
using System;

namespace backend.Services.Auth
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
				expires: DateTime.UtcNow.AddHours(1),
				signingCredentials: creds
			);

			return new JwtSecurityTokenHandler().WriteToken(token);
		}
	}
}
