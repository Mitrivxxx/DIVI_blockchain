namespace backend.Infrastructure.Minio;

public interface IMinioObjectStorage
{
    Task EnsureBucketReadyAsync(CancellationToken cancellationToken = default);

    Task<string> PutObjectAsync(
        string objectKey,
        Stream content,
        string contentType,
        CancellationToken cancellationToken = default);

    Task DeleteObjectAsync(string objectKey, CancellationToken cancellationToken = default);

    Task DeleteObjectsByPrefixAsync(string prefix, CancellationToken cancellationToken = default);
}
