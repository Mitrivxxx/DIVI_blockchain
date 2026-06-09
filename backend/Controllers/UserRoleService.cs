using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/user-role")]
    [Authorize]
    public class UserRoleController : ControllerBase
    {
        private readonly ILogger<UserRoleController> _logger;

        public UserRoleController(ILogger<UserRoleController> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// Returns the role of the currently authenticated user.
        /// </summary>
        [HttpGet]
        public IActionResult GetUserRole()
        {
            var role = User.FindFirstValue(ClaimTypes.Role) ?? "user";
            _logger.LogInformation("User role lookup resolved for authenticated user with role {UserRole}", role);
            var response = new DTOs.UserRoleResponseDto { Role = role };
            return Ok(response);
        }
    }
}
