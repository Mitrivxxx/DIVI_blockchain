using Microsoft.AspNetCore.Mvc;
using backend.Services;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/user-role")]
    public class UserRoleController : ControllerBase
    {
        private readonly IUserRoleService _userRoleService;

        public UserRoleController(IUserRoleService userRoleService)
        {
            _userRoleService = userRoleService;
        }

      /// <summary>
        /// Returns the user role for a given Ethereum address.
        /// </summary>
        [HttpGet]
        public IActionResult GetUserRole([FromQuery] string address)
        {
            if (string.IsNullOrEmpty(address))
                return BadRequest(new { role = "User" });

            var role = _userRoleService.GetUserRole(address);
            return Ok(new { role = role.ToString() });
        }
    }
}