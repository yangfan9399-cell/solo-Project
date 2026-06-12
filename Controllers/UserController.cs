using MeetingRoomEquipment.Data;
using MeetingRoomEquipment.Models;
using MeetingRoomEquipment.Services;
using MeetingRoomEquipment.ViewModels;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MeetingRoomEquipment.Controllers;

public class UserController : Controller
{
    private readonly ApplicationDbContext _ctx;
    private readonly ICurrentUserService _user;

    public UserController(ApplicationDbContext ctx, ICurrentUserService user)
    {
        _ctx = ctx;
        _user = user;
    }

    public async Task<IActionResult> Switch()
    {
        var users = await _ctx.Users.Where(u => u.IsActive).ToListAsync();
        var vm = new UserSwitchViewModel
        {
            Users = users,
            CurrentUserId = _user.UserId,
            CurrentUserName = _user.UserName,
            CurrentRole = EnumDisplay.GetRoleText(_user.Role)
        };
        return PartialView("_UserSwitch", vm);
    }

    [HttpPost]
    public IActionResult DoSwitch(string userId, string userName, string role)
    {
        _user.SwitchUser(userId, userName, role);
        return Redirect(Request.Headers["Referer"].ToString() ?? "/");
    }
}
