using Microsoft.AspNetCore.Mvc;
using backend.Services.Roles;
using Microsoft.Extensions.Logging;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/user-role")]
    public class UserRoleController : ControllerBase
    {
        private readonly IUserRoleService _userRoleService;
        private readonly ILogger<UserRoleController> _logger;

        public UserRoleController(IUserRoleService userRoleService, ILogger<UserRoleController> logger)
        {
            _userRoleService = userRoleService;
            _logger = logger;
        }

      /// <summary>
        /// Returns the user role for a given Ethereum address.
        /// </summary>
        [HttpGet]
        public IActionResult GetUserRole([FromQuery] string address)
        {
            _logger.LogInformation("User role lookup requested for address {EthereumAddress}", address);

            if (string.IsNullOrEmpty(address))
            {
                _logger.LogInformation("User role lookup rejected due to empty address");
                return BadRequest(new DTOs.UserRoleResponseDto());
            }

            var role = _userRoleService.GetUserRole(address);
            _logger.LogInformation("User role lookup resolved for address {EthereumAddress} with role {UserRole}", address, role);
            var response = new DTOs.UserRoleResponseDto { Role = role.ToString() };
            return Ok(response);
        }
    }
}