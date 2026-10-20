using Serilog;
using backend.Infrastructure.Logging;
using backend.Extensions;
using DotNetEnv;

LoadEnvFile();

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();
ApplyDatabaseEnvAliases(builder.Configuration);

Log.Logger = LoggingConfiguration.CreateLogger(builder.Environment);
builder.Host.UseSerilog();

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddPresentation();

var app = builder.Build();

app.MapDefaultEndpoints();

app.Lifetime.ApplicationStarted.Register(() =>
{
	Log.Information(
		"Starting API in {Environment} on {Urls}",
		app.Environment.EnvironmentName,
		string.Join(", ", app.Urls));
});

app.UseApplicationPipeline();

app.Run();

static void LoadEnvFile()
{
	// Prefer .env.example (Aspire / shared template). Fall back to .env for local runs.
	var candidates = new[]
	{
		Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", ".env.example")),
		Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", ".env.example")),
		Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", ".env")),
		Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", ".env")),
	};

	foreach (var path in candidates)
	{
		if (File.Exists(path))
		{
			Env.Load(path);
			return;
		}
	}
}

static void ApplyDatabaseEnvAliases(ConfigurationManager configuration)
{
	static void SetIfPresent(ConfigurationManager config, string key, string envName)
	{
		var value = Environment.GetEnvironmentVariable(envName);
		if (!string.IsNullOrWhiteSpace(value))
		{
			config[key] = value;
		}
	}

	SetIfPresent(configuration, "Database:Host", "DB_HOST");
	SetIfPresent(configuration, "Database:Port", "DB_PORT");
	SetIfPresent(configuration, "Database:Name", "DB_NAME");
	SetIfPresent(configuration, "Database:Username", "DB_USER");
	SetIfPresent(configuration, "Database:Password", "DB_PASSWORD");
}
