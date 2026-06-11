using Microsoft.EntityFrameworkCore;
using SealManagementSystem.Data;
using SealManagementSystem.Models;

namespace SealManagementSystem.Repositories
{
    public class SealRepository : ISealRepository
    {
        private readonly ApplicationDbContext _context;

        public SealRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Seal>> GetAllAsync()
        {
            return await _context.Seals.Include(s => s.Department).ToListAsync();
        }

        public async Task<Seal?> GetByIdAsync(int id)
        {
            return await _context.Seals.Include(s => s.Department).FirstOrDefaultAsync(s => s.SealId == id);
        }

        public async Task<IEnumerable<Seal>> GetAvailableSealsAsync()
        {
            return await _context.Seals
                .Include(s => s.Department)
                .Where(s => s.Status == SealStatus.Available)
                .ToListAsync();
        }

        public async Task UpdateStatusAsync(int sealId, SealStatus status)
        {
            var seal = await _context.Seals.FindAsync(sealId);
            if (seal != null)
            {
                seal.Status = status;
                seal.UpdatedAt = DateTime.Now;
                await _context.SaveChangesAsync();
            }
        }
    }

    public class ContractRepository : IContractRepository
    {
        private readonly ApplicationDbContext _context;

        public ContractRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Contract>> GetAllAsync()
        {
            return await _context.Contracts.Include(c => c.Applicant).ToListAsync();
        }

        public async Task<Contract?> GetByIdAsync(int id)
        {
            return await _context.Contracts.Include(c => c.Applicant).FirstOrDefaultAsync(c => c.ContractId == id);
        }

        public async Task<IEnumerable<Contract>> GetAvailableContractsAsync()
        {
            return await _context.Contracts
                .Include(c => c.Applicant)
                .Where(c => c.Status == ContractStatus.Reviewed || c.Status == ContractStatus.Signed)
                .ToListAsync();
        }
    }
}
