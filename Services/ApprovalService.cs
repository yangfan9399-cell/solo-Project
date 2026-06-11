using SealManagementSystem.Data;
using SealManagementSystem.Models;
using SealManagementSystem.Repositories;

namespace SealManagementSystem.Services
{
    public class ApprovalService : IApprovalService
    {
        private readonly IBorrowRequestRepository _requestRepository;
        private readonly ISealRepository _sealRepository;
        private readonly ApplicationDbContext _context;

        public ApprovalService(
            IBorrowRequestRepository requestRepository,
            ISealRepository sealRepository,
            ApplicationDbContext context)
        {
            _requestRepository = requestRepository;
            _sealRepository = sealRepository;
            _context = context;
        }

        public async Task<(bool Success, string Message)> LegalReviewAsync(int requestId, int operatorId, bool isApproved, string? remark)
        {
            var request = await _requestRepository.GetByIdAsync(requestId);
            if (request == null)
            {
                return (false, "申请记录不存在");
            }

            if (request.Status != BorrowStatus.PendingLegal)
            {
                return (false, "当前状态不允许法务审核");
            }

            var legalNode = request.ApprovalNodes.FirstOrDefault(n => n.NodeType == NodeType.LegalReview && n.Result == NodeResult.Pending);
            if (legalNode == null)
            {
                return (false, "未找到待审核的法务节点");
            }

            legalNode.OperatorId = operatorId;
            legalNode.Result = isApproved ? NodeResult.Approved : NodeResult.Rejected;
            legalNode.Remark = remark;
            legalNode.ProcessedAt = DateTime.Now;

            if (isApproved)
            {
                request.Status = BorrowStatus.PendingHandover;
                _context.ApprovalNodes.Add(new ApprovalNode
                {
                    BorrowRequestId = requestId,
                    NodeType = NodeType.AdminHandover,
                    Result = NodeResult.Pending,
                    CreatedAt = DateTime.Now
                });
            }
            else
            {
                request.Status = BorrowStatus.LegalRejected;
                if (request.Contract != null && request.Contract.Status == ContractStatus.Missing)
                {
                    request.ExceptionReason = ExceptionReason.ContractMissing;
                    request.ExceptionDescription = remark ?? "合同缺失，法务审核驳回";
                }
            }

            await _context.SaveChangesAsync();
            await _requestRepository.UpdateAsync(request);

            return (true, isApproved ? "法务审核通过，等待行政交接" : $"法务审核驳回：{remark}");
        }

        public async Task<(bool Success, string Message)> AdminHandoverAsync(int requestId, int operatorId)
        {
            var request = await _requestRepository.GetByIdAsync(requestId);
            if (request == null)
            {
                return (false, "申请记录不存在");
            }

            if (request.Status != BorrowStatus.PendingHandover)
            {
                return (false, "当前状态不允许行政交接");
            }

            var adminNode = request.ApprovalNodes.FirstOrDefault(n => n.NodeType == NodeType.AdminHandover && n.Result == NodeResult.Pending);
            if (adminNode == null)
            {
                return (false, "未找到待处理的行政交接节点");
            }

            adminNode.OperatorId = operatorId;
            adminNode.Result = NodeResult.Approved;
            adminNode.Remark = $"印章已交接，签收人：{request.Applicant?.UserName}";
            adminNode.ProcessedAt = DateTime.Now;

            request.Status = BorrowStatus.Borrowed;
            request.ActualBorrowDate = DateTime.Now;

            _context.ApprovalNodes.Add(new ApprovalNode
            {
                BorrowRequestId = requestId,
                NodeType = NodeType.ReturnRegister,
                Result = NodeResult.Pending,
                CreatedAt = DateTime.Now
            });

            await _sealRepository.UpdateStatusAsync(request.SealId, SealStatus.Borrowed);
            await _context.SaveChangesAsync();
            await _requestRepository.UpdateAsync(request);

            return (true, "印章交接完成，状态已更新为外借中");
        }
    }
}
