using System.Net;
using System.Text;

namespace backend.Tests.Infrastructure.Fakes;

/// <summary>Answers Pinata pin requests with a deterministic-looking CID.</summary>
public sealed class FakePinataHandler : HttpMessageHandler
{
    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        var cid = "QmTest" + Guid.NewGuid().ToString("N");
        var response = new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent($"{{\"IpfsHash\":\"{cid}\"}}", Encoding.UTF8, "application/json"),
        };

        return Task.FromResult(response);
    }
}
