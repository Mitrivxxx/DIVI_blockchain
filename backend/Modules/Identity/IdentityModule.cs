using backend.Modules.Identity.Application;
using backend.Modules.Identity.Contracts;

namespace backend.Modules.Identity;

public static class IdentityModule
{
    public static IServiceCollection AddIdentityModule(this IServiceCollection services)
    {
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IJwtService, JwtService>();
        services.AddScoped<UserService>();
        services.AddScoped<ITokenBlacklist, TokenBlacklist>();
        services.AddHostedService<NonceCleanupService>();
        return services;
    }
}
