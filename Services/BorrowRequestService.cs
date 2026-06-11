using SealManagementSystem.Models;
using SealManagementSystem.Models.DTOs;
using SealManagementSystem.Repositories;

namespace SealManagementSystem.Services
{
    public class BorrowRequestService : IBorrowRequestService
    {
        private readonly IBorrowRequestRepository _borrowRequestRepository;
        private readonly ISealRepository _sealRepository;
        private readonly IContractRepository _contractRepository;
        private readonly IUserRepository _userRepository;

        public BorrowRequestService(
            IBorrowRequestRepository borrowRequestRepository,
            ISealRepository sealRepository,
            IContractRepository contractRepository,
            IUserRepository userRepository)
        {
            _borrowRequestRepository = borrowRequestRepository;
            _sealRepository = sealRepository;
            _contractRepository = contractRepository;
            _userRepository = userRepository;
        }

        public async Task<IEnumerable<BorrowRequest>> GetAllRequestsAsync()
        {
            return await _borrowRequestRepository.GetAllAsync();
        }

        public async Task<BorrowRequest?> GetRequestByIdAsync(int id)
        {
            return await _borrowRequestRepository.GetByIdAsync(id);
        }

        public async Task<BorrowRequestDetailViewModel?> GetRequestDetailAsync(int id)
        {
            var request = await _borrowRequestRepository.GetByIdAsync(id);
            if (request == null) return null;

            return new BorrowRequestDetailViewModel
            {
                Request = request,
                ApprovalNodes = request.ApprovalNodes.OrderBy(n => n.CreatedAt).ToList()
            };
        }

        public async Task<CreateBorrowRequestViewModel> GetCreateViewModelAsync()
        {
            var seals = await _sealRepository.GetAvailableSealsAsync();
            var contracts = await _contractRepository.GetAvailableContractsAsync();

            return new CreateBorrowRequestViewModel
            {
                AvailableSeals = seals.ToList(),
                AvailableContracts = contracts.ToList(),
                PlannedBorrowDate = DateTime.Today,
                PlannedReturnDate = DateTime.Today.AddDays(3)
            };
        }

        public async Task<(bool Success, string Message, BorrowRequest? Request)> CreateRequestAsync(BorrowRequest request)
        {
            var contract = await _contractRepository.GetByIdAsync(request.ContractId);
            if (contract == null)
            {
                return (false, "合同不存在", null);
            }

            if (contract.Status == ContractStatus.Missing)
            {
                return (false, "合同状态为【缺失】，禁止外借印章，请先完善合同文件", null);
            }

            if (contract.Status != ContractStatus.Reviewed && contract.Status != ContractStatus.Signed)
            {
                return (false, "合同未完成审核，禁止外借印章", null);
            }

            var seal = await _sealRepository.GetByIdAsync(request.SealId);
            if (seal == null)
            {
                return (false, "印章不存在", null);
            }

            if (seal.Status != SealStatus.Available)
            {
                return (false, "印章当前不可用", null);
            }

            if (string.IsNullOrWhiteSpace(request.UsageScope))
            {
                return (false, "请填写详细的用印范围", null);
            }

            if (request.PlannedReturnDate <= request.PlannedBorrowDate)
            {
                return (false, "计划归还日期必须晚于借用日期", null);
            }

            var created = await _borrowRequestRepository.CreateAsync(request);
            return (true, "申请提交成功，等待法务审核", created);
        }
    }
}
