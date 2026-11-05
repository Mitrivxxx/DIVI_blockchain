using backend.Infrastructure.Persistence;
using backend.Modules.Members.Application;
using backend.Modules.Members.Contracts;
using backend.Modules.Members.Persistence;

namespace backend.Modules.Members;

public static class MembersModule
{
    public static IServiceCollection AddMembersModule(this IServiceCollection services)
    {
        services.AddScoped<IMemberDirectory, MemberDirectory>();
        services.AddScoped<IGetProfileService, GetProfileService>();
        services.AddSingleton<IPreMigrationStep, AvatarBlobToMinioMigrator>();
        return services;
    }
}
