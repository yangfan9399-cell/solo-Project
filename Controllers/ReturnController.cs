using Microsoft.AspNetCore.Mvc;
using SealManagementSystem.Models;
using SealManagementSystem.Models.DTOs;
using SealManagementSystem.Services;

namespace SealManagementSystem.Controllers
{
    public class ReturnController : Controller
    {
        private readonly IReturnService _returnService;
        private readonly IBorrowRequestService _borrowService;

        public ReturnController(IReturnService returnService, IBorrowRequestService borrowService)
        {
            _returnService = returnService;
            _borrowService = borrowService;
        }

        public async Task<IActionResult> BorrowedList()
        {
            var requests = (await _borrowService.GetAllRequestsAsync())
                .Where(r => r.Status == BorrowStatus.Borrowed);
            return View(requests);
        }

        public async Task<IActionResult> PendingRisk()
        {
            var requests = (await _borrowService.GetAllRequestsAsync())
                .Where(r => r.Status == BorrowStatus.PendingRiskReview);
            return View(requests);
        }

        public async Task<IActionResult> RegisterReturn(int id)
        {
            var request = await _borrowService.GetRequestByIdAsync(id);
            if (request == null || request.Status != BorrowStatus.Borrowed)
            {
                return NotFound();
            }
            var model = new ReturnViewModel
            {
                BorrowRequestId = id,
                ActualReturnDate = DateTime.Now
            };
            return View((request, model));
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> RegisterReturn(int id, ReturnViewModel model)
        {
            var result = await _returnService.RegisterReturnAsync(id, 6, model.ActualReturnDate, model.ReturnRemark);
            if (!result.Success)
            {
                ModelState.AddModelError(string.Empty, result.Message);
                var request = await _borrowService.GetRequestByIdAsync(id);
                return View((request!, model));
            }
            TempData["Success"] = result.Message;
            return RedirectToAction(nameof(BorrowedList));
        }

        public async Task<IActionResult> RiskReview(int id)
        {
            var request = await _borrowService.GetRequestByIdAsync(id);
            if (request == null || request.Status != BorrowStatus.PendingRiskReview)
            {
                return NotFound();
            }
            var model = new ReturnViewModel
            {
                BorrowRequestId = id,
                ExceptionReason = request.ExceptionReason != ExceptionReason.None ? request.ExceptionReason : null
            };
            return View((request, model));
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> RiskReview(int id, ReturnViewModel model, bool hasException)
        {
            var result = await _returnService.RiskReviewAsync(
                id,
                7,
                hasException,
                hasException ? model.ExceptionReason : null,
                hasException ? model.ExceptionDescription : null,
                model.ReturnRemark);

            if (!result.Success)
            {
                ModelState.AddModelError(string.Empty, result.Message);
                var request = await _borrowService.GetRequestByIdAsync(id);
                return View((request!, model));
            }
            TempData["Success"] = result.Message;
            return RedirectToAction(nameof(PendingRisk));
        }
    }
}
