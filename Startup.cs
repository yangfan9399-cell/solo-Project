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
            services.AddControllersWithViews();

            var useDatabase = Configuration["UseDatabase"] ?? "Sqlite";
            if (useDatabase.Equals("SqlServer", StringComparison.OrdinalIgnoreCase))
            {
                services.AddDbContext<ApplicationDbContext>(options =>
                    options.UseSqlServer(Configuration.GetConnectionString("SqlServerConnection")));
            }
            else
            {
                services.AddDbContext<ApplicationDbContext>(options =>
                    options.UseSqlite(Configuration.GetConnectionString("DefaultConnection")));
            }

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

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env, ApplicationDbContext dbContext)
        {
            dbContext.Database.EnsureCreated();

            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                app.UseExceptionHandler("/Home/Error");
                app.UseHsts();
            }

            app.UseHttpsRedirection();
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
