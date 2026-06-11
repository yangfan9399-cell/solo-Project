using SealManagementSystem.Models;

namespace SealManagementSystem.Repositories
{
    public interface ISealRepository
    {
        Task<IEnumerable<Seal>> GetAllAsync();
        Task<Seal?> GetByIdAsync(int id);
        Task<IEnumerable<Seal>> GetAvailableSealsAsync();
        Task UpdateStatusAsync(int sealId, SealStatus status);
    }

    public interface IContractRepository
    {
        Task<IEnumerable<Contract>> GetAllAsync();
        Task<Contract?> GetByIdAsync(int id);
        Task<IEnumerable<Contract>> GetAvailableContractsAsync();
    }

    public interface IBorrowRequestRepository
    {
        Task<IEnumerable<BorrowRequest>> GetAllAsync();
        Task<BorrowRequest?> GetByIdAsync(int id);
        Task<BorrowRequest> CreateAsync(BorrowRequest request);
        Task UpdateAsync(BorrowRequest request);
        Task<IEnumerable<BorrowRequest>> GetByStatusAsync(BorrowStatus status);
        Task<IEnumerable<BorrowRequest>> GetByApplicantAsync(int applicantId);
        Task<IEnumerable<BorrowRequest>> GetExceptionRequestsAsync();
    }

    public interface IDepartmentRepository
    {
        Task<IEnumerable<Department>> GetAllAsync();
        Task<Department?> GetByIdAsync(int id);
    }

    public interface IUserRepository
    {
        Task<IEnumerable<User>> GetAllAsync();
        Task<User?> GetByIdAsync(int id);
        Task<IEnumerable<User>> GetByRoleAsync(UserRole role);
    }
}
