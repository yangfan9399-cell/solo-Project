using SealManagementSystem.Models;
using SealManagementSystem.Models.DTOs;
using SealManagementSystem.Repositories;

namespace SealManagementSystem.Services
{
    public class DashboardService : IDashboardService
    {
        private readonly IBorrowRequestRepository _requestRepository;
        private readonly IDepartmentRepository _departmentRepository;
        private readonly ISealRepository _sealRepository;

        public DashboardService(
            IBorrowRequestRepository requestRepository,
            IDepartmentRepository departmentRepository,
            ISealRepository sealRepository)
        {
            _requestRepository = requestRepository;
            _departmentRepository = departmentRepository;
            _sealRepository = sealRepository;
        }

        public async Task<DashboardViewModel> GetDashboardDataAsync()
        {
            var allRequests = (await _requestRepository.GetAllAsync()).ToList();
            var departments = (await _departmentRepository.GetAllAsync()).ToList();
            var seals = (await _sealRepository.GetAllAsync()).ToList();

            var model = new DashboardViewModel
            {
                TotalRequests = allRequests.Count,
                PendingLegal = allRequests.Count(r => r.Status == BorrowStatus.PendingLegal),
                Borrowed = allRequests.Count(r => r.Status == BorrowStatus.Borrowed),
                PendingRisk = allRequests.Count(r => r.Status == BorrowStatus.PendingRiskReview),
                ReturnedNormal = allRequests.Count(r => r.Status == BorrowStatus.Returned),
                ReturnException = allRequests.Count(r => r.Status == BorrowStatus.ReturnException),
                OverdueCount = allRequests.Count(r => r.IsOverdue && r.Status != BorrowStatus.Returned && r.Status != BorrowStatus.Cancelled)
            };

            foreach (var dept in departments)
            {
                var deptRequests = allRequests.Where(r => r.Applicant?.DepartmentId == dept.DepartmentId).ToList();
                if (deptRequests.Any())
                {
                    model.DepartmentStats.Add(new DepartmentStats
                    {
                        DepartmentName = dept.DepartmentName,
                        TotalCount = deptRequests.Count,
                        NormalCount = deptRequests.Count(r => r.Status == BorrowStatus.Returned && r.ExceptionReason == ExceptionReason.None),
                        ExceptionCount = deptRequests.Count(r => r.Status == BorrowStatus.ReturnException || r.ExceptionReason != ExceptionReason.None)
                    });
                }
            }

            foreach (SealType type in Enum.GetValues(typeof(SealType)))
            {
                var typeSeals = seals.Where(s => s.SealType == type).ToList();
                var typeRequests = allRequests.Where(r => r.Seal?.SealType == type).ToList();
                if (typeSeals.Any() || typeRequests.Any())
                {
                    model.SealTypeStats.Add(new SealTypeStats
                    {
                        SealType = type,
                        SealTypeName = GetSealTypeName(type),
                        TotalCount = typeRequests.Count,
                        Available = typeSeals.Count(s => s.Status == SealStatus.Available),
                        Borrowed = typeSeals.Count(s => s.Status == SealStatus.Borrowed)
                    });
                }
            }

            var totalExceptions = allRequests.Count(r => r.ExceptionReason != ExceptionReason.None);
            foreach (ExceptionReason reason in Enum.GetValues(typeof(ExceptionReason)))
            {
                if (reason == ExceptionReason.None) continue;
                var count = allRequests.Count(r => r.ExceptionReason == reason);
                model.ExceptionStats.Add(new ExceptionStats
                {
                    Reason = reason,
                    ReasonName = GetExceptionReasonName(reason),
                    Count = count,
                    Percentage = totalExceptions > 0 ? Math.Round((decimal)count / totalExceptions * 100, 1) : 0
                });
            }

            var completedRequests = allRequests
                .Where(r => r.ActualBorrowDate.HasValue && r.ActualReturnDate.HasValue)
                .ToList();

            var ranges = new (string Name, int Min, int Max)[]
            {
                ("1天以内", 0, 1),
                ("2-3天", 2, 3),
                ("4-7天", 4, 7),
                ("8-14天", 8, 14),
                ("15天以上", 15, int.MaxValue)
            };

            foreach (var range in ranges)
            {
                var count = completedRequests.Count(r =>
                {
                    var days = (r.ActualReturnDate!.Value - r.ActualBorrowDate!.Value).TotalDays;
                    return days >= range.Min && days <= range.Max;
                });
                model.DurationStats.Add(new DurationStats { DurationRange = range.Name, Count = count });
            }

            model.RecentRequests = allRequests.Take(5).ToList();
            model.ExceptionRequests = allRequests.Where(r => r.ExceptionReason != ExceptionReason.None).OrderByDescending(r => r.CreatedAt).Take(5).ToList();

            return model;
        }

        private static string GetSealTypeName(SealType type) => type switch
        {
            SealType.CompanySeal => "公章",
            SealType.ContractSeal => "合同专用章",
            SealType.FinanceSeal => "财务专用章",
            SealType.LegalPersonSeal => "法人章",
            SealType.InvoiceSeal => "发票专用章",
            _ => "未知"
        };

        private static string GetExceptionReasonName(ExceptionReason reason) => reason switch
        {
            ExceptionReason.ContractMissing => "合同缺失",
            ExceptionReason.Overdue => "超期未还",
            ExceptionReason.ScopeMismatch => "用印范围不符",
            ExceptionReason.SealDamaged => "印章损坏",
            ExceptionReason.Other => "其他",
            _ => "未知"
        };
    }
}
