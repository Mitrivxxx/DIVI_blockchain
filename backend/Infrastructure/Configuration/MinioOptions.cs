namespace backend.Infrastructure.Configuration;

/// <summary>S3-compatible MinIO settings for profile avatars (not used for document IPFS).</summary>
public sealed class MinioOptions
{
    public const string SectionName = "Minio";

    /// <summary>Host:port without scheme, e.g. localhost:9000 or minio:9000.</summary>
    public string Endpoint { get; set; } = "localhost:9000";

    public string AccessKey { get; set; } = "minioadmin";

    public string SecretKey { get; set; } = "minioadmin";

    public string Bucket { get; set; } = "divi-avatars";

    /// <summary>Browser-reachable base URL for public object links (scheme + host[:port], no trailing slash).</summary>
    public string PublicBaseUrl { get; set; } = "http://localhost:9000";

    public bool UseSsl { get; set; }

    public string Region { get; set; } = "us-east-1";
}
