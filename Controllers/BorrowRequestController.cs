using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using SealManagementSystem.Models;
using SealManagementSystem.Models.DTOs;
using SealManagementSystem.Services;

namespace SealManagementSystem.Controllers
{
    public class BorrowRequestController : Controller
    {
        private readonly IBorrowRequestService _borrowService;

        public BorrowRequestController(IBorrowRequestService borrowService)
        {
            _borrowService = borrowService;
        }

        public async Task<IActionResult> Index()
        {
            var requests = await _borrowService.GetAllRequestsAsync();
            return View(requests);
        }

        public async Task<IActionResult> Details(int id)
        {
            var detail = await _borrowService.GetRequestDetailAsync(id);
            if (detail == null)
            {
                return NotFound();
            }
            return View(detail);
        }

        public async Task<IActionResult> Create()
        {
            var model = await _borrowService.GetCreateViewModelAsync();
            return View(model);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(CreateBorrowRequestViewModel model)
        {
            var request = new BorrowRequest
            {
                SealId = model.SealId,
                ContractId = model.ContractId,
                ApplicantId = 1,
                UsageScope = model.UsageScope,
                PlannedBorrowDate = model.PlannedBorrowDate,
                PlannedReturnDate = model.PlannedReturnDate
            };

            var result = await _borrowService.CreateRequestAsync(request);

            if (!result.Success)
            {
                ModelState.AddModelError(string.Empty, result.Message);
                var vm = await _borrowService.GetCreateViewModelAsync();
                vm.SealId = model.SealId;
                vm.ContractId = model.ContractId;
                vm.UsageScope = model.UsageScope;
                vm.PlannedBorrowDate = model.PlannedBorrowDate;
                vm.PlannedReturnDate = model.PlannedReturnDate;
                return View(vm);
            }

            TempData["Success"] = result.Message;
            return RedirectToAction(nameof(Details), new { id = result.Request!.BorrowRequestId });
        }
    }
}
