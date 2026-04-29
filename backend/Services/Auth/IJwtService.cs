namespace backend.Services.Auth
{
	public interface IJwtService
	{
		string GenerateToken(string address);
		string GenerateAccessToken(string userId, string role);
		string GenerateRefreshToken(string userId);
		string? ValidateRefreshToken(string token);
	}
}
