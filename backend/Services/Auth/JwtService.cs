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
			return GenerateAccessToken(address, userRole, out _);
		}

		public string GenerateAccessToken(string userId, string role, out string jti)
		{
			jti = Guid.NewGuid().ToString();
			var claims = new[]
			{
				new Claim(JwtRegisteredClaimNames.Sub, userId),
				new Claim("role", role),
				new Claim(JwtRegisteredClaimNames.Jti, jti)
			};

			var key = GetSymmetricSecurityKey();
			var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

			var header = new JwtHeader(creds);
			header["typ"] = "JWT";

			var payload = new JwtPayload(
				issuer: GetIssuer(),
				audience: GetAudience(),
				claims: claims,
				notBefore: DateTime.UtcNow,
				expires: DateTime.UtcNow.AddMinutes(15),
				issuedAt: DateTime.UtcNow
			);

			var token = new JwtSecurityToken(header, payload);
			return new JwtSecurityTokenHandler().WriteToken(token);
		}

		public string GenerateRefreshToken(string userId)
		{
			var claims = new[]
			{
				new Claim(JwtRegisteredClaimNames.Sub, userId),
				new Claim("type", "refresh")
			};

			var key = GetSymmetricSecurityKey();
			var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

			var token = new JwtSecurityToken(
				issuer: GetIssuer(),
				audience: GetAudience(),
				claims: claims,
				expires: DateTime.UtcNow.AddDays(7),
				signingCredentials: creds
			);

			return new JwtSecurityTokenHandler().WriteToken(token);
		}

		public string? ValidateRefreshToken(string token)
		{
			if (string.IsNullOrWhiteSpace(token))
				return null;

			var tokenHandler = new JwtSecurityTokenHandler();
			var key = GetSymmetricSecurityKey();

			try
			{
				tokenHandler.ValidateToken(token, new TokenValidationParameters
				{
					ValidateIssuerSigningKey = true,
					IssuerSigningKey = key,
					ValidateIssuer = true,
					ValidIssuer = GetIssuer(),
					ValidateAudience = true,
					ValidAudience = GetAudience(),
					ValidateLifetime = true,
					ClockSkew = TimeSpan.Zero
				}, out SecurityToken validatedToken);

				var jwtToken = (JwtSecurityToken)validatedToken;
				var typeClaim = jwtToken.Claims.FirstOrDefault(x => x.Type == "type")?.Value;
				if (typeClaim != "refresh") return null;

				var userId = jwtToken.Claims.FirstOrDefault(x => x.Type == JwtRegisteredClaimNames.Sub)?.Value;
				return userId;
			}
			catch
			{
				return null;
			}
		}

		private SymmetricSecurityKey GetSymmetricSecurityKey()
		{
			var jwtKey = Environment.GetEnvironmentVariable("JWT_KEY")
				?? _configuration["Jwt:Key"]
				?? "change_me_32_chars_minimum";
			return new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
		}

		private string GetIssuer()
		{
			return Environment.GetEnvironmentVariable("JWT_ISSUER")
				?? _configuration["Jwt:Issuer"]
				?? "your-api";
		}

		private string GetAudience()
		{
			return Environment.GetEnvironmentVariable("JWT_AUDIENCE")
				?? _configuration["Jwt:Audience"]
				?? "your-frontend";
		}
	}
}
