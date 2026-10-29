using System.Globalization;
using System.Security.Cryptography;
using System.Text;

namespace backend.Infrastructure.Minio;

/// <summary>Minimal AWS Signature Version 4 helper for S3-compatible APIs (MinIO).</summary>
internal static class AwsSigV4
{
    public static string HashHex(byte[] data)
    {
        var hash = SHA256.HashData(data);
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    public static string HashHex(string text) => HashHex(Encoding.UTF8.GetBytes(text));

    public static byte[] HmacSha256(byte[] key, string data) =>
        HMACSHA256.HashData(key, Encoding.UTF8.GetBytes(data));

    public static byte[] GetSigningKey(string secretKey, string dateStamp, string region, string service)
    {
        var kDate = HmacSha256(Encoding.UTF8.GetBytes("AWS4" + secretKey), dateStamp);
        var kRegion = HmacSha256(kDate, region);
        var kService = HmacSha256(kRegion, service);
        return HmacSha256(kService, "aws4_request");
    }

    public static string FormatAmzDate(DateTimeOffset utc) =>
        utc.UtcDateTime.ToString("yyyyMMdd'T'HHmmss'Z'", CultureInfo.InvariantCulture);

    public static string FormatDateStamp(DateTimeOffset utc) =>
        utc.UtcDateTime.ToString("yyyyMMdd", CultureInfo.InvariantCulture);
}
