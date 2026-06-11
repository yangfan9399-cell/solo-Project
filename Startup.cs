using Microsoft.EntityFrameworkCore;
using SealManagementSystem.Data;
using SealManagementSystem.Repositories;
using SealManagementSystem.Services;

namespace SealManagementSystem
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        public void ConfigureServices(IServiceCollection services)
        {
            services.AddControllersWithViews()
                .AddRazorRuntimeCompilation();

            var connectionString = Configuration.GetConnectionString("DefaultConnection");
            services.AddDbContextPool<ApplicationDbContext>(options =>
                options.UseSqlServer(connectionString, b => b.MigrationsAssembly("SealManagementSystem")));

            services.AddHttpContextAccessor();

            services.AddScoped<ISealRepository, SealRepository>();
            services.AddScoped<IContractRepository, ContractRepository>();
            services.AddScoped<IBorrowRequestRepository, BorrowRequestRepository>();
            services.AddScoped<IDepartmentRepository, DepartmentRepository>();
            services.AddScoped<IUserRepository, UserRepository>();

            services.AddScoped<IBorrowRequestService, BorrowRequestService>();
            services.AddScoped<IApprovalService, ApprovalService>();
            services.AddScoped<IReturnService, ReturnService>();
            services.AddScoped<IDashboardService, DashboardService>();
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env, ApplicationDbContext dbContext, ILogger<Startup> logger)
        {
            logger.LogInformation("Using database provider: {provider}", dbContext.Database.ProviderName);
            logger.LogInformation("Applying migrations and seeding data...");

            try
            {
                dbContext.Database.Migrate();
                var count = dbContext.BorrowRequests.Count();
                logger.LogInformation("Database migrated successfully. BorrowRequests count: {count}", count);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Database initialization failed.");
                throw;
            }

            app.UseDeveloperExceptionPage();

            app.UseStaticFiles();
            app.UseRouting();
            app.UseAuthorization();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllerRoute(
                    name: "default",
                    pattern: "{controller=Home}/{action=Index}/{id?}");
            });
        }
    }
}
