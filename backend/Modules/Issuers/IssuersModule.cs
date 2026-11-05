using backend.Modules.Issuers.Application;
using backend.Modules.Issuers.Contracts;

namespace backend.Modules.Issuers;

public static class IssuersModule
{
    public static IServiceCollection AddIssuersModule(this IServiceCollection services)
    {
        services.AddScoped<IIssuerDirectory, IssuerDirectory>();
        services.AddScoped<IIssuerApplicationService, IssuerApplicationService>();
        services.AddScoped<IIssuerProfileService, IssuerProfileService>();
        services.AddScoped<IAdminManagementService, AdminManagementService>();
        return services;
    }
}
