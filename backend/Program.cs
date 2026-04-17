using Serilog;
using backend.Infrastructure.Logging;
using backend.Extensions;

var builder = WebApplication.CreateBuilder(args);


Log.Logger = LoggingConfiguration.CreateLogger(builder.Environment);
builder.Host.UseSerilog();

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddPresentation();



var app = builder.Build();

// Test log on startup
Log.Information("Starting API in {Environment}", app.Environment.EnvironmentName);

app.UseApplicationPipeline();

app.Run();

