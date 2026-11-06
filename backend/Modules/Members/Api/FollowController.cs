using backend.BuildingBlocks;
using backend.Modules.Members.Application;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Modules.Members.Api
{
    [ApiController]
    [Route("api/profiles")]
    public class FollowController : ControllerBase
    {
        private readonly IMemberFollowService _follows;

        public FollowController(IMemberFollowService follows)
        {
            _follows = follows;
        }

        [HttpPost("{ethereumAddress}/follow")]
        [Authorize]
        public async Task<IActionResult> Follow(string ethereumAddress)
        {
            var memberId = User.GetMemberId() ?? 0;
            if (memberId == 0)
            {
                return Unauthorized();
            }

            var (status, error) = await _follows.FollowByAddressAsync(memberId, ethereumAddress);
            if (status != 200)
            {
                return StatusCode(status, new { error });
            }

            return Ok(new { isFollowing = true });
        }

        [HttpDelete("{ethereumAddress}/follow")]
        [Authorize]
        public async Task<IActionResult> Unfollow(string ethereumAddress)
        {
            var memberId = User.GetMemberId() ?? 0;
            if (memberId == 0)
            {
                return Unauthorized();
            }

            var (status, error) = await _follows.UnfollowByAddressAsync(memberId, ethereumAddress);
            if (status != 200)
            {
                return StatusCode(status, new { error });
            }

            return Ok(new { isFollowing = false });
        }

        [HttpGet("{ethereumAddress}/follow-status")]
        [Authorize]
        public async Task<IActionResult> FollowStatus(string ethereumAddress)
        {
            var memberId = User.GetMemberId() ?? 0;
            if (memberId == 0)
            {
                return Unauthorized();
            }

            var status = await _follows.GetFollowStatusByAddressAsync(memberId, ethereumAddress);
            if (status is null)
            {
                return NotFound(new { error = "Nie znaleziono użytkownika." });
            }

            return Ok(status);
        }

        /// <summary>People this member follows (avatar + name). Public.</summary>
        [HttpGet("{ethereumAddress}/following")]
        [AllowAnonymous]
        public async Task<IActionResult> ListFollowing(string ethereumAddress, [FromQuery] int limit = 100)
        {
            var list = await _follows.ListFollowingByAddressAsync(ethereumAddress, limit);
            return Ok(list);
        }
    }
}
