using Microsoft.EntityFrameworkCore;
using SealManagementSystem.Data;
using SealManagementSystem.Models;

namespace SealManagementSystem.Repositories
{
    public class BorrowRequestRepository : IBorrowRequestRepository
    {
        private readonly ApplicationDbContext _context;

        public BorrowRequestRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<BorrowRequest>> GetAllAsync()
        {
            return await _context.BorrowRequests
                .Include(r => r.Seal)
                .Include(r => r.Contract)
                .Include(r => r.Applicant)
                    .ThenInclude(u => u.Department)
                .Include(r => r.ApprovalNodes)
                    .ThenInclude(n => n.Operator)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

        public async Task<BorrowRequest?> GetByIdAsync(int id)
        {
            return await _context.BorrowRequests
                .Include(r => r.Seal)
                    .ThenInclude(s => s.Department)
                .Include(r => r.Contract)
                .Include(r => r.Applicant)
                    .ThenInclude(u => u.Department)
                .Include(r => r.ApprovalNodes)
                    .ThenInclude(n => n.Operator)
                .FirstOrDefaultAsync(r => r.BorrowRequestId == id);
        }

        public async Task<BorrowRequest> CreateAsync(BorrowRequest request)
        {
            request.RequestCode = $"BR-{DateTime.Now:yyyy}-{(_context.BorrowRequests.Count() + 1):D3}";
            request.Status = BorrowStatus.PendingLegal;
            request.CreatedAt = DateTime.Now;
            _context.BorrowRequests.Add(request);
            await _context.SaveChangesAsync();

            var submitNode = new ApprovalNode
            {
                BorrowRequestId = request.BorrowRequestId,
                NodeType = NodeType.Submit,
                OperatorId = request.ApplicantId,
                Result = NodeResult.Approved,
                Remark = "提交印章外借申请",
                CreatedAt = DateTime.Now,
                ProcessedAt = DateTime.Now
            };
            _context.ApprovalNodes.Add(submitNode);

            var legalNode = new ApprovalNode
            {
                BorrowRequestId = request.BorrowRequestId,
                NodeType = NodeType.LegalReview,
                Result = NodeResult.Pending,
                CreatedAt = DateTime.Now
            };
            _context.ApprovalNodes.Add(legalNode);

            await _context.SaveChangesAsync();
            return request;
        }

        public async Task UpdateAsync(BorrowRequest request)
        {
            request.UpdatedAt = DateTime.Now;
            _context.BorrowRequests.Update(request);
            await _context.SaveChangesAsync();
        }

        public async Task<IEnumerable<BorrowRequest>> GetByStatusAsync(BorrowStatus status)
        {
            return await _context.BorrowRequests
                .Include(r => r.Seal)
                .Include(r => r.Contract)
                .Include(r => r.Applicant)
                    .ThenInclude(u => u.Department)
                .Where(r => r.Status == status)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<BorrowRequest>> GetByApplicantAsync(int applicantId)
        {
            return await _context.BorrowRequests
                .Include(r => r.Seal)
                .Include(r => r.Contract)
                .Where(r => r.ApplicantId == applicantId)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<BorrowRequest>> GetExceptionRequestsAsync()
        {
            return await _context.BorrowRequests
                .Include(r => r.Seal)
                .Include(r => r.Contract)
                .Include(r => r.Applicant)
                    .ThenInclude(u => u.Department)
                .Where(r => r.ExceptionReason != ExceptionReason.None)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }
    }

    public class DepartmentRepository : IDepartmentRepository
    {
        private readonly ApplicationDbContext _context;

        public DepartmentRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Department>> GetAllAsync()
        {
            return await _context.Departments.ToListAsync();
        }

        public async Task<Department?> GetByIdAsync(int id)
        {
            return await _context.Departments.FindAsync(id);
        }
    }

    public class UserRepository : IUserRepository
    {
        private readonly ApplicationDbContext _context;

        public UserRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<User>> GetAllAsync()
        {
            return await _context.Users.Include(u => u.Department).ToListAsync();
        }

        public async Task<User?> GetByIdAsync(int id)
        {
            return await _context.Users.Include(u => u.Department).FirstOrDefaultAsync(u => u.UserId == id);
        }

        public async Task<IEnumerable<User>> GetByRoleAsync(UserRole role)
        {
            return await _context.Users
                .Include(u => u.Department)
                .Where(u => u.Role == role)
                .ToListAsync();
        }
    }
}
