
using backend.Infrastructure.Pinata;
using backend.Infrastructure;
using backend.Infrastructure.Swagger;
using backend.Services;
using backend.Data;
using DotNetEnv;
using Microsoft.EntityFrameworkCore;



var builder = WebApplication.CreateBuilder(args);
Env.Load();
var dbHost = Environment.GetEnvironmentVariable("DB_HOST") ?? "localhost";
var dbPort = Environment.GetEnvironmentVariable("DB_PORT") ?? "5432";
var dbName = Environment.GetEnvironmentVariable("DB_NAME") ?? "IssuerDb";
var dbUser = Environment.GetEnvironmentVariable("DB_USER") ?? "postgres";
var dbPassword = Environment.GetEnvironmentVariable("DB_PASSWORD") ?? "";
var connectionString = $"Host={dbHost};Port={dbPort};Database={dbName};Username={dbUser};Password={dbPassword}";
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddCors(options =>
{
    options.AddPolicy("react",
        policy =>
        {
            policy.WithOrigins("http://localhost:3000")
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
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
builder.Services.AddHttpClient<PinataClient>();
builder.Services.AddScoped<BlockchainService>();
builder.Services.AddScoped<IUserRoleService, UserRoleService>();
builder.Services.AddScoped<backend.Services.Interfaces.IIssuerApplicationService, backend.Services.IssuerApplicationService>();
builder.Services.AddScoped<backend.Services.Interfaces.IAuthService, backend.Services.AuthService>();
builder.Services.AddScoped<backend.Services.Interfaces.IJwtService, backend.Services.JwtService>();
builder.Services.AddHostedService<backend.Services.NonceCleanupService>();


var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}


app.UseHttpsRedirection();

// CORS musi być przed autoryzacją
app.UseCors("react");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
