using Serilog;
using backend.Infrastructure.Logging;
using backend.Extensions;
using DotNetEnv;


Env.Load("../.env");


var builder = WebApplication.CreateBuilder(args);


Log.Logger = LoggingConfiguration.CreateLogger(builder.Environment);
builder.Host.UseSerilog();

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddPresentation();



var app = builder.Build();

app.Lifetime.ApplicationStarted.Register(() =>
{
	Log.Information(
		"Starting API in {Environment} on {Urls}",
		app.Environment.EnvironmentName,
		string.Join(", ", app.Urls));
});

app.UseApplicationPipeline();

app.Run();

