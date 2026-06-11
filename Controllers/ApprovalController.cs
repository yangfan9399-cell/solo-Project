using Microsoft.AspNetCore.Mvc;
using SealManagementSystem.Models;
using SealManagementSystem.Services;

namespace SealManagementSystem.Controllers
{
    public class ApprovalController : Controller
    {
        private readonly IApprovalService _approvalService;
        private readonly IBorrowRequestService _borrowService;

        public ApprovalController(IApprovalService approvalService, IBorrowRequestService borrowService)
        {
            _approvalService = approvalService;
            _borrowService = borrowService;
        }

        public async Task<IActionResult> PendingLegal()
        {
            var requests = (await _borrowService.GetAllRequestsAsync())
                .Where(r => r.Status == BorrowStatus.PendingLegal);
            return View(requests);
        }

        public async Task<IActionResult> PendingHandover()
        {
            var requests = (await _borrowService.GetAllRequestsAsync())
                .Where(r => r.Status == BorrowStatus.PendingHandover);
            return View(requests);
        }

        public async Task<IActionResult> LegalReview(int id)
        {
            var request = await _borrowService.GetRequestByIdAsync(id);
            if (request == null || request.Status != BorrowStatus.PendingLegal)
            {
                return NotFound();
            }
            return View(request);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> LegalReview(int id, bool isApproved, string? remark)
        {
            var result = await _approvalService.LegalReviewAsync(id, 5, isApproved, remark);
            if (!result.Success)
            {
                ModelState.AddModelError(string.Empty, result.Message);
                var request = await _borrowService.GetRequestByIdAsync(id);
                return View(request);
            }
            TempData["Success"] = result.Message;
            return RedirectToAction(nameof(PendingLegal));
        }

        public async Task<IActionResult> AdminHandover(int id)
        {
            var request = await _borrowService.GetRequestByIdAsync(id);
            if (request == null || request.Status != BorrowStatus.PendingHandover)
            {
                return NotFound();
            }
            return View(request);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> AdminHandover(int id, IFormCollection collection)
        {
            var result = await _approvalService.AdminHandoverAsync(id, 6);
            if (!result.Success)
            {
                ModelState.AddModelError(string.Empty, result.Message);
                var request = await _borrowService.GetRequestByIdAsync(id);
                return View(request);
            }
            TempData["Success"] = result.Message;
            return RedirectToAction(nameof(PendingHandover));
        }
    }
}
