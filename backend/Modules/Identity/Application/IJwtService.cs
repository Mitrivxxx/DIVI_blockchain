namespace backend.Modules.Identity.Application
{
	public interface IJwtService
	{
		string GenerateAccessToken(string userId, string role);
		string GenerateRefreshToken(string userId);
		string? ValidateRefreshToken(string token);
	}
}
