using Serilog;
using Serilog.Events;
using Serilog.Sinks.SystemConsole.Themes;

namespace backend.Infrastructure.Logging;

public static class LoggingConfiguration
{
    public static Serilog.ILogger CreateLogger(IHostEnvironment environment)
    {
        var minimumLevel = environment.IsDevelopment()
            ? LogEventLevel.Debug
            : LogEventLevel.Information;

        return new LoggerConfiguration()
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
    }
}