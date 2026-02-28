namespace backend.Services.Auth
{
	public interface IJwtService
	{
		string GenerateToken(string address);
	}
}
