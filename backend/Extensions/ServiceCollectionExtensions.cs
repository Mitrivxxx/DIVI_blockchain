using System.Reflection;
using backend.Infrastructure;
using backend.Data;
using backend.Infrastructure.Configuration;
using backend.Infrastructure.Database;
using backend.Infrastructure.Swagger;
using backend.Services.Auth;
using backend.Services.BackgroundJobs;
using backend.Services.Blockchain;
using backend.Services.Documents;
using backend.Services.DocumentVerification;
using backend.Services.GetProfile;
using backend.Services.Issuers;
using backend.Services.Roles;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace backend.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IDocumentService, DocumentService>();
        services.AddScoped<IDocumentVerification, DocumentVerificationService>();
        services.AddScoped<IBlockchainService, BlockchainService>();
        services.AddScoped<IUserRoleService, UserRoleService>();
        services.AddScoped<IIssuerApplicationService, IssuerApplicationService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IJwtService, JwtService>();
        services.AddScoped<IGetProfileService, GetProfileService>();
        services.AddHostedService<DatabaseInitializerHostedService>();
        services.AddHostedService<NonceCleanupService>();

        return services;
    }

    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var corsOrigins = CorsOptions.ResolveAllowedOrigins(configuration);

        services.AddOptions<DatabaseOptions>()
            .Bind(configuration.GetSection("Database"))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        services.AddOptions<BlockchainOptions>()
            .Bind(configuration.GetSection("Blockchain"))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        services.AddDbContext<AppDbContext>((serviceProvider, options) =>
        {
            var databaseOptions = serviceProvider.GetRequiredService<IOptions<DatabaseOptions>>().Value;
            options.UseNpgsql(databaseOptions.BuildConnectionString());
        });

        services.AddCors(options =>
        {
            options.AddPolicy("react",
                policy =>
                {
                    policy.WithOrigins(corsOrigins)
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials();
                });
        });

        services.Configure<ForwardedHeadersOptions>(options =>
        {
            options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
            options.KnownNetworks.Clear();
            options.KnownProxies.Clear();
        });

        services.Configure<PinataOptions>(configuration.GetSection("Pinata"));

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            var jwtKey = Environment.GetEnvironmentVariable("JWT_KEY")
                ?? configuration["Jwt:Key"]
                ?? throw new InvalidOperationException("Missing JWT_KEY environment variable or Jwt:Key config");

            var jwtIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER")
                ?? configuration["Jwt:Issuer"]
                ?? throw new InvalidOperationException("Missing JWT_ISSUER environment variable or Jwt:Issuer config");

            var jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE")
                ?? configuration["Jwt:Audience"]
                ?? throw new InvalidOperationException("Missing JWT_AUDIENCE environment variable or Jwt:Audience config");

            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = jwtIssuer,
                ValidAudience = jwtAudience,
                IssuerSigningKey = new SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(jwtKey)),
                ClockSkew = TimeSpan.Zero
            };

            options.Events = new JwtBearerEvents
            {
                OnMessageReceived = context =>
                {
                    // Try Authorization header first
                    var authHeader = context.Request.Headers["Authorization"].FirstOrDefault();
                    if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                    {
                        context.Token = authHeader.Substring("Bearer ".Length).Trim();
                    }
                    // Fall back to cookies
                    else if (context.Request.Cookies.TryGetValue("access_token", out var token))
                    {
                        context.Token = token;
                    }
                    return Task.CompletedTask;
                },
                OnTokenValidated = async context =>
                {
                    var dbContext = context.HttpContext.RequestServices.GetRequiredService<AppDbContext>();
                    var jti = context.Principal?.FindFirst(JwtRegisteredClaimNames.Jti)?.Value;
                    if (!string.IsNullOrEmpty(jti) && await dbContext.BlacklistedTokens.AnyAsync(b => b.Jti == jti))
                    {
                        context.Fail("Token is blacklisted");
                    }
                }
            };
        });

        services.AddHttpClient<PinataClient>();

        return services;
    }

    public static IServiceCollection AddPresentation(this IServiceCollection services)
    {
        services.AddControllers();
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(options =>
        {
            options.OperationFilter<FileUploadOperationFilter>();

            var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
            var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
            if (File.Exists(xmlPath))
            {
                options.IncludeXmlComments(xmlPath);
            }
        });

        return services;
    }
}