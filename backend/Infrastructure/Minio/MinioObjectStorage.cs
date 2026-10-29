using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Xml.Linq;
using backend.Infrastructure.Configuration;
using Microsoft.Extensions.Options;

namespace backend.Infrastructure.Minio;

public sealed class MinioObjectStorage : IMinioObjectStorage
{
    private readonly HttpClient _http;
    private readonly MinioOptions _options;
    private readonly ILogger<MinioObjectStorage> _logger;
    private readonly SemaphoreSlim _bucketLock = new(1, 1);
    private bool _bucketReady;

    public MinioObjectStorage(
        HttpClient http,
        IOptions<MinioOptions> options,
        ILogger<MinioObjectStorage> logger)
    {
        _http = http;
        _options = options.Value;
        _logger = logger;
    }

    public async Task EnsureBucketReadyAsync(CancellationToken cancellationToken = default)
    {
        if (_bucketReady)
        {
            return;
        }

        await _bucketLock.WaitAsync(cancellationToken);
        try
        {
            if (_bucketReady)
            {
                return;
            }

            var exists = await BucketExistsAsync(cancellationToken);
            if (!exists)
            {
                await CreateBucketAsync(cancellationToken);
                _logger.LogInformation("Created MinIO bucket {Bucket}", _options.Bucket);
            }

            await PutPublicReadPolicyAsync(cancellationToken);
            _bucketReady = true;
        }
        finally
        {
            _bucketLock.Release();
        }
    }

    public async Task<string> PutObjectAsync(
        string objectKey,
        Stream content,
        string contentType,
        CancellationToken cancellationToken = default)
    {
        await EnsureBucketReadyAsync(cancellationToken);

        await using var buffer = new MemoryStream();
        await content.CopyToAsync(buffer, cancellationToken);
        var bytes = buffer.ToArray();

        var path = $"/{_options.Bucket}/{objectKey.TrimStart('/')}";
        using var request = new HttpRequestMessage(HttpMethod.Put, BuildUri(path))
        {
            Content = new ByteArrayContent(bytes),
        };
        request.Content.Headers.ContentType = new MediaTypeHeaderValue(contentType);
        request.Content.Headers.ContentLength = bytes.Length;

        await SignAsync(request, path, bytes, cancellationToken);
        using var response = await _http.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            throw new InvalidOperationException(
                $"MinIO PutObject failed ({(int)response.StatusCode}): {body}");
        }

        return BuildPublicUrl(objectKey);
    }

    public async Task DeleteObjectAsync(string objectKey, CancellationToken cancellationToken = default)
    {
        await EnsureBucketReadyAsync(cancellationToken);

        var path = $"/{_options.Bucket}/{objectKey.TrimStart('/')}";
        using var request = new HttpRequestMessage(HttpMethod.Delete, BuildUri(path));
        await SignAsync(request, path, Array.Empty<byte>(), cancellationToken);
        using var response = await _http.SendAsync(request, cancellationToken);
        if (response.StatusCode is HttpStatusCode.NoContent or HttpStatusCode.OK or HttpStatusCode.NotFound)
        {
            return;
        }

        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        throw new InvalidOperationException(
            $"MinIO DeleteObject failed ({(int)response.StatusCode}): {body}");
    }

    public async Task DeleteObjectsByPrefixAsync(string prefix, CancellationToken cancellationToken = default)
    {
        await EnsureBucketReadyAsync(cancellationToken);

        var keys = await ListObjectKeysAsync(prefix, cancellationToken);
        foreach (var key in keys)
        {
            await DeleteObjectAsync(key, cancellationToken);
        }
    }

    private async Task<bool> BucketExistsAsync(CancellationToken cancellationToken)
    {
        var path = $"/{_options.Bucket}";
        using var request = new HttpRequestMessage(HttpMethod.Head, BuildUri(path));
        await SignAsync(request, path, Array.Empty<byte>(), cancellationToken);
        using var response = await _http.SendAsync(request, cancellationToken);
        return response.IsSuccessStatusCode;
    }

    private async Task CreateBucketAsync(CancellationToken cancellationToken)
    {
        var path = $"/{_options.Bucket}";
        using var request = new HttpRequestMessage(HttpMethod.Put, BuildUri(path));
        await SignAsync(request, path, Array.Empty<byte>(), cancellationToken);
        using var response = await _http.SendAsync(request, cancellationToken);
        if (response.IsSuccessStatusCode || response.StatusCode == HttpStatusCode.Conflict)
        {
            return;
        }

        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        throw new InvalidOperationException(
            $"MinIO CreateBucket failed ({(int)response.StatusCode}): {body}");
    }

    private async Task PutPublicReadPolicyAsync(CancellationToken cancellationToken)
    {
        var policy =
            "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Principal\":{\"AWS\":[\"*\"]},"
            + "\"Action\":[\"s3:GetObject\"],\"Resource\":[\"arn:aws:s3:::"
            + _options.Bucket
            + "/*\"]}]}";

        var path = $"/{_options.Bucket}";
        var bytes = Encoding.UTF8.GetBytes(policy);
        using var request = new HttpRequestMessage(HttpMethod.Put, BuildUri($"{path}?policy"))
        {
            Content = new ByteArrayContent(bytes),
        };
        request.Content.Headers.ContentType = new MediaTypeHeaderValue("application/json");
        request.Content.Headers.ContentLength = bytes.Length;

        await SignAsync(request, path, bytes, cancellationToken, canonicalQuery: "policy=");
        using var response = await _http.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogWarning(
                "MinIO PutBucketPolicy returned {Status}: {Body}",
                (int)response.StatusCode,
                body);
        }
    }

    private async Task<IReadOnlyList<string>> ListObjectKeysAsync(string prefix, CancellationToken cancellationToken)
    {
        var encodedPrefix = Uri.EscapeDataString(prefix);
        var path = $"/{_options.Bucket}";
        var query = $"list-type=2&prefix={encodedPrefix}";
        using var request = new HttpRequestMessage(HttpMethod.Get, BuildUri($"{path}?{query}"));
        await SignAsync(
            request,
            path,
            Array.Empty<byte>(),
            cancellationToken,
            canonicalQuery: $"list-type=2&prefix={encodedPrefix}");

        using var response = await _http.SendAsync(request, cancellationToken);
        var xml = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException(
                $"MinIO ListObjects failed ({(int)response.StatusCode}): {xml}");
        }

        var doc = XDocument.Parse(xml);
        XNamespace ns = "http://s3.amazonaws.com/doc/2006-03-01/";
        return doc.Descendants(ns + "Key").Select(e => e.Value).Where(v => !string.IsNullOrWhiteSpace(v)).ToList();
    }

    private Uri BuildUri(string pathAndQuery)
    {
        var scheme = _options.UseSsl ? "https" : "http";
        return new Uri($"{scheme}://{_options.Endpoint.TrimEnd('/')}{pathAndQuery}");
    }

    private string BuildPublicUrl(string objectKey)
    {
        var baseUrl = _options.PublicBaseUrl.TrimEnd('/');
        return $"{baseUrl}/{_options.Bucket}/{objectKey.TrimStart('/')}";
    }

    private async Task SignAsync(
        HttpRequestMessage request,
        string canonicalUri,
        byte[] payload,
        CancellationToken cancellationToken,
        string canonicalQuery = "")
    {
        var now = DateTimeOffset.UtcNow;
        var amzDate = AwsSigV4.FormatAmzDate(now);
        var dateStamp = AwsSigV4.FormatDateStamp(now);
        var payloadHash = AwsSigV4.HashHex(payload);

        request.Headers.Host = _options.Endpoint;
        request.Headers.TryAddWithoutValidation("x-amz-content-sha256", payloadHash);
        request.Headers.TryAddWithoutValidation("x-amz-date", amzDate);

        var signedHeaders = "host;x-amz-content-sha256;x-amz-date";
        var canonicalHeaders =
            $"host:{_options.Endpoint}\n" +
            $"x-amz-content-sha256:{payloadHash}\n" +
            $"x-amz-date:{amzDate}\n";

        var canonicalRequest =
            $"{request.Method.Method}\n" +
            $"{canonicalUri}\n" +
            $"{canonicalQuery}\n" +
            $"{canonicalHeaders}\n" +
            $"{signedHeaders}\n" +
            $"{payloadHash}";

        var credentialScope = $"{dateStamp}/{_options.Region}/s3/aws4_request";
        var stringToSign =
            "AWS4-HMAC-SHA256\n" +
            $"{amzDate}\n" +
            $"{credentialScope}\n" +
            AwsSigV4.HashHex(canonicalRequest);

        var signingKey = AwsSigV4.GetSigningKey(_options.SecretKey, dateStamp, _options.Region, "s3");
        var signature = Convert.ToHexString(AwsSigV4.HmacSha256(signingKey, stringToSign)).ToLowerInvariant();

        var authorization =
            $"AWS4-HMAC-SHA256 Credential={_options.AccessKey}/{credentialScope}, " +
            $"SignedHeaders={signedHeaders}, Signature={signature}";

        request.Headers.TryAddWithoutValidation("Authorization", authorization);
        await Task.CompletedTask;
    }
}
