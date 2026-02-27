namespace backend.Services.Interfaces
{
    public interface IJwtService
    {
        string GenerateToken(string address);
    }
}
