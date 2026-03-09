
using backend.Infrastructure.Pinata;
using Serilog;
using backend.Infrastructure;
using backend.Infrastructure.Swagger;
using backend.Services.Auth;
using backend.Services.Blockchain;
using backend.Services.Documents;
using backend.Services.DocumentVerification;
using backend.Services.Issuers;
using backend.Services.Roles;
using backend.Services.BackgroundJobs;
using backend.Services.GetProfile;
using backend.Data;
using DotNetEnv;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Serilog.Events;
using Serilog.Sinks.SystemConsole.Themes;



var builder = WebApplication.CreateBuilder(args);

// Prefer one shared env file in project root for local runs.
var sharedEnvPath = Path.GetFullPath(Path.Combine(builder.Environment.ContentRootPath, "..", ".env"));
if (File.Exists(sharedEnvPath))
{
    Env.Load(sharedEnvPath);
}
else
{
    Env.Load();
}

var minimumLevel = builder.Environment.IsDevelopment()
    ? LogEventLevel.Debug
    : LogEventLevel.Information;

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Is(minimumLevel)
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .MinimumLevel.Override("System", LogEventLevel.Warning)
    .WriteTo.Console(
        theme: new AnsiConsoleTheme(new Dictionary<ConsoleThemeStyle, string>
        {
            [ConsoleThemeStyle.Text] = "\x1b[37m",
            [ConsoleThemeStyle.SecondaryText] = "\x1b[90m",
            [ConsoleThemeStyle.TertiaryText] = "\x1b[90m",
            [ConsoleThemeStyle.Invalid] = "\x1b[33m",
            [ConsoleThemeStyle.Null] = "\x1b[33m",
            [ConsoleThemeStyle.Name] = "\x1b[37m",
            [ConsoleThemeStyle.String] = "\x1b[36m",
            [ConsoleThemeStyle.Number] = "\x1b[36m",
            [ConsoleThemeStyle.Boolean] = "\x1b[36m",
            [ConsoleThemeStyle.Scalar] = "\x1b[37m",
            [ConsoleThemeStyle.LevelVerbose] = "\x1b[37m",
            [ConsoleThemeStyle.LevelDebug] = "\x1b[90m",
            [ConsoleThemeStyle.LevelInformation] = "\x1b[32m",
            [ConsoleThemeStyle.LevelWarning] = "\x1b[33m",
            [ConsoleThemeStyle.LevelError] = "\x1b[31m",
            [ConsoleThemeStyle.LevelFatal] = "\x1b[31;1m"
        }),
        outputTemplate: "[{Level:u3}] {Message:lj}{NewLine}{Exception}")
    .CreateLogger();
builder.Host.UseSerilog();
var dbHost = Environment.GetEnvironmentVariable("DB_HOST") ?? "localhost";
var dbPort = Environment.GetEnvironmentVariable("DB_PORT") ?? "5432";
var dbName = Environment.GetEnvironmentVariable("DB_NAME") ?? "IssuerDb";
var dbUser = Environment.GetEnvironmentVariable("DB_USER") ?? "postgres";
var dbPassword = Environment.GetEnvironmentVariable("DB_PASSWORD") ?? "";
var connectionString = $"Host={dbHost};Port={dbPort};Database={dbName};Username={dbUser};Password={dbPassword}";
var corsOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? new[] { "http://localhost:3000" };

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddCors(options =>
{
    options.AddPolicy("react",
        policy =>
        {
            policy.WithOrigins(corsOrigins)
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});
builder.Services.Configure<PinataOptions>(builder.Configuration.GetSection("Pinata"));
builder.Services.AddControllers();

// JWT Authentication configuration
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    var jwtKey = builder.Configuration["Jwt:Key"] ?? "super_secret_key";
    var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "DIVI";
    options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtIssuer,
        IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(jwtKey)),
        ClockSkew = System.TimeSpan.Zero
    };
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.OperationFilter<FileUploadOperationFilter>();
        var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        options.IncludeXmlComments(xmlPath);
    }
});
builder.Services.AddScoped<IDocumentService, DocumentService>();
builder.Services.AddScoped<IDocumentVerification, DocumentVerificationService>();
builder.Services.AddScoped<IBlockchainService, BlockchainService>();
builder.Services.AddScoped<IUserRoleService, UserRoleService>();
builder.Services.AddScoped<IIssuerApplicationService, IssuerApplicationService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IGetProfileService, GetProfileService>();
builder.Services.AddHostedService<NonceCleanupService>();
builder.Services.AddHttpClient<PinataClient>();



var app = builder.Build();

// Test log on startup
Log.Information("Application starting up");

for (var attempt = 1; attempt <= 10; attempt++)
{
    try
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.Migrate();
        break;
    }
    catch when (attempt < 10)
    {
        await Task.Delay(TimeSpan.FromSeconds(3));
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseForwardedHeaders();

app.UseSerilogRequestLogging(options =>
{
    options.MessageTemplate = "HTTP {RequestMethod} {RequestPath} => {StatusCode} in {Elapsed:0.0000} ms";
});

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

// CORS musi być przed autoryzacją
app.UseCors("react");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
