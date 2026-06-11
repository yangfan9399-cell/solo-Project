using SealManagementSystem.Data;
using SealManagementSystem.Models;
using SealManagementSystem.Repositories;

namespace SealManagementSystem.Services
{
    public class ReturnService : IReturnService
    {
        private readonly IBorrowRequestRepository _requestRepository;
        private readonly ISealRepository _sealRepository;
        private readonly ApplicationDbContext _context;

        public ReturnService(
            IBorrowRequestRepository requestRepository,
            ISealRepository sealRepository,
            ApplicationDbContext context)
        {
            _requestRepository = requestRepository;
            _sealRepository = sealRepository;
            _context = context;
        }

        public async Task<(bool Success, string Message)> RegisterReturnAsync(int requestId, int operatorId, DateTime returnDate, string? remark)
        {
            var request = await _requestRepository.GetByIdAsync(requestId);
            if (request == null)
            {
                return (false, "申请记录不存在");
            }

            if (request.Status != BorrowStatus.Borrowed)
            {
                return (false, "当前状态不允许归还登记");
            }

            var returnNode = request.ApprovalNodes.FirstOrDefault(n => n.NodeType == NodeType.ReturnRegister && n.Result == NodeResult.Pending);
            if (returnNode == null)
            {
                return (false, "未找到待处理的归还登记节点");
            }

            returnNode.OperatorId = operatorId;
            returnNode.Result = NodeResult.Approved;
            returnNode.Remark = string.IsNullOrWhiteSpace(remark) ? $"印章归还，归还人：{request.Applicant?.UserName}" : remark;
            returnNode.ProcessedAt = DateTime.Now;

            request.ActualReturnDate = returnDate;
            request.Status = BorrowStatus.PendingRiskReview;

            if (returnDate > request.PlannedReturnDate)
            {
                request.ExceptionReason = ExceptionReason.Overdue;
                var overdueDays = (int)(returnDate - request.PlannedReturnDate).TotalDays;
                request.ExceptionDescription = $"实际归还日期{returnDate:yyyy-MM-dd}，超过计划归还日期{request.PlannedReturnDate:yyyy-MM-dd}共{overdueDays}天";
            }

            _context.ApprovalNodes.Add(new ApprovalNode
            {
                BorrowRequestId = requestId,
                NodeType = NodeType.RiskReview,
                Result = NodeResult.Pending,
                CreatedAt = DateTime.Now
            });

            await _sealRepository.UpdateStatusAsync(request.SealId, SealStatus.Available);
            await _context.SaveChangesAsync();
            await _requestRepository.UpdateAsync(request);

            return (true, "归还登记完成，等待风控复核");
        }

        public async Task<(bool Success, string Message)> RiskReviewAsync(int requestId, int operatorId, bool hasException, ExceptionReason? reason, string? description, string? remark)
        {
            var request = await _requestRepository.GetByIdAsync(requestId);
            if (request == null)
            {
                return (false, "申请记录不存在");
            }

            if (request.Status != BorrowStatus.PendingRiskReview)
            {
                return (false, "当前状态不允许风控复核");
            }

            var riskNode = request.ApprovalNodes.FirstOrDefault(n => n.NodeType == NodeType.RiskReview && n.Result == NodeResult.Pending);
            if (riskNode == null)
            {
                return (false, "未找到待处理的风控复核节点");
            }

            riskNode.OperatorId = operatorId;
            riskNode.Result = NodeResult.Approved;
            riskNode.Remark = remark;
            riskNode.ProcessedAt = DateTime.Now;

            request.RiskReviewRemark = remark;

            if (hasException && reason.HasValue)
            {
                if (request.ExceptionReason == ExceptionReason.None || request.ExceptionReason == ExceptionReason.Overdue)
                {
                    request.ExceptionReason = reason.Value;
                }
                if (!string.IsNullOrWhiteSpace(description))
                {
                    request.ExceptionDescription = description;
                }
                request.Status = BorrowStatus.ReturnException;
            }
            else if (request.ExceptionReason == ExceptionReason.Overdue)
            {
                request.Status = BorrowStatus.ReturnException;
            }
            else
            {
                request.Status = BorrowStatus.Returned;
            }

            await _context.SaveChangesAsync();
            await _requestRepository.UpdateAsync(request);

            return (true, request.Status == BorrowStatus.Returned ? "风控复核通过，流程正常结束" : "风控复核完成，已标记异常情况");
        }
    }
}
