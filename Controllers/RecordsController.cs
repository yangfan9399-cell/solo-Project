using MeetingRoomEquipment.Models;
using MeetingRoomEquipment.Services;
using MeetingRoomEquipment.ViewModels;
using Microsoft.AspNetCore.Mvc;

namespace MeetingRoomEquipment.Controllers;

public class RecordsController : Controller
{
    private readonly IRecordService _svc;
    private readonly ICurrentUserService _user;

    public RecordsController(IRecordService svc, ICurrentUserService user)
    {
        _svc = svc;
        _user = user;
    }

    public async Task<IActionResult> Index(RecordStatus? status, SampleCategory? category, string? keyword, string? department)
    {
        var list = await _svc.GetListAsync(status, category, keyword, department);
        ViewData["CurrentUser"] = _user.UserName;
        ViewData["CurrentRole"] = _user.Role;
        ViewData["FilterStatus"] = status;
        ViewData["FilterCategory"] = category;
        ViewData["Keyword"] = keyword;
        ViewData["Department"] = department;
        return View(list);
    }

    public async Task<IActionResult> Detail(int id)
    {
        var vm = await _svc.GetDetailAsync(id);
        if (vm == null) return NotFound();
        ViewData["CurrentUser"] = _user.UserName;
        ViewData["CurrentRole"] = _user.Role;
        return View(vm);
    }
}
