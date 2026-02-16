using backend.Infrastructure;
using backend.Infrastructure.Swagger;
using backend.Services;
using DotNetEnv;

var builder = WebApplication.CreateBuilder(args);
Env.Load();
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
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.OperationFilter<FileUploadOperationFilter>();
});
builder.Services.AddScoped<IDocumentService, DocumentService>();
builder.Services.AddHttpClient<PinataClient>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("react");

app.MapControllers();


app.Run();
