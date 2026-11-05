using System.Collections.Concurrent;
using backend.Infrastructure.Minio;

namespace backend.Tests.Infrastructure.Fakes;

public sealed class InMemoryObjectStorage : IMinioObjectStorage
{
    public const string PublicBaseUrl = "http://minio.test/divi-avatars";

    public ConcurrentDictionary<string, byte[]> Objects { get; } = new();

    public Task EnsureBucketReadyAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;

    public async Task<string> PutObjectAsync(
        string objectKey,
        Stream content,
        string contentType,
        CancellationToken cancellationToken = default)
    {
        using var buffer = new MemoryStream();
        await content.CopyToAsync(buffer, cancellationToken);
        Objects[objectKey] = buffer.ToArray();
        return $"{PublicBaseUrl}/{objectKey}";
    }

    public Task DeleteObjectAsync(string objectKey, CancellationToken cancellationToken = default)
    {
        Objects.TryRemove(objectKey, out _);
        return Task.CompletedTask;
    }

    public Task DeleteObjectsByPrefixAsync(string prefix, CancellationToken cancellationToken = default)
    {
        foreach (var key in Objects.Keys.Where(k => k.StartsWith(prefix, StringComparison.Ordinal)))
        {
            Objects.TryRemove(key, out _);
        }

        return Task.CompletedTask;
    }
}
