using backend.Modules.Documents.Application;

namespace backend.Modules.Documents;

public static class DocumentsModule
{
    public static IServiceCollection AddDocumentsModule(this IServiceCollection services)
    {
        services.AddScoped<IDocumentService, DocumentService>();
        services.AddScoped<IDocumentActivityService, DocumentActivityService>();
        services.AddScoped<IDocumentVerification, DocumentVerificationService>();
        services.AddScoped<ICredentialWalletService, CredentialWalletService>();
        return services;
    }
}
