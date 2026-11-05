using Microsoft.AspNetCore.Mvc;

namespace backend.Host;

[ApiController]
[Route("health")]
public class HealthController : ControllerBase
{
    /// <summary>
    /// Returns the server status.
    /// </summary>
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new { status = "ok" });
    }
}
