using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;

namespace backend.Tests.Infrastructure;

public static class HttpTestExtensions
{
    /// <summary>Reads the body as raw JSON so tests assert the wire contract, not backend DTO classes.</summary>
    public static async Task<JsonElement> ReadJsonAsync(this HttpResponseMessage response)
    {
        var body = await response.Content.ReadAsStringAsync();
        Assert.False(string.IsNullOrWhiteSpace(body), $"Expected JSON body, got empty ({(int)response.StatusCode}).");
        using var doc = JsonDocument.Parse(body);
        return doc.RootElement.Clone();
    }

    public static HttpClient WithBearer(this HttpClient client, string token)
    {
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    public static string GetString(this JsonElement element, string property) =>
        element.GetProperty(property).GetString() ?? string.Empty;

    public static bool HasProperty(this JsonElement element, string property) =>
        element.TryGetProperty(property, out _);

    public static IEnumerable<string> SetCookieNames(this HttpResponseMessage response) =>
        response.Headers.TryGetValues("Set-Cookie", out var values)
            ? values.Select(v => v.Split('=', 2)[0].Trim())
            : Enumerable.Empty<string>();

    public static async Task AssertStatusAsync(this HttpResponseMessage response, System.Net.HttpStatusCode expected)
    {
        if (response.StatusCode != expected)
        {
            var body = await response.Content.ReadAsStringAsync();
            Assert.Fail($"Expected {(int)expected} {expected}, got {(int)response.StatusCode} {response.StatusCode}. Body: {body}");
        }
    }
}
