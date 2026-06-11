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

            var useDb = (Configuration["UseDatabase"] ?? "SqlServer").Trim();
            var sqliteConn = Configuration.GetConnectionString("DefaultConnection");
            var sqlServerConn = Configuration.GetConnectionString("SqlServerConnection");

            Action<DbContextOptionsBuilder> dbConfig;
            bool sqlServerAvailable = false;

            if (useDb.Equals("SqlServer", StringComparison.OrdinalIgnoreCase))
            {
                try
                {
                    using var testConn = new Microsoft.Data.SqlClient.SqlConnection(sqlServerConn);
                    testConn.Open();
                    testConn.Close();
                    sqlServerAvailable = true;
                }
                catch { sqlServerAvailable = false; }
            }

            if (sqlServerAvailable)
            {
                dbConfig = (o) => o.UseSqlServer(sqlServerConn);
            }
            else
            {
                dbConfig = (o) => o.UseSqlite(sqliteConn);
            }

            services.AddDbContextPool<ApplicationDbContext>(dbConfig, poolSize: 32);
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
            try
            {
                dbContext.Database.EnsureCreated();
                var count = dbContext.BorrowRequests.Count();
                logger.LogInformation("Database initialized. BorrowRequests count: {count}", count);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Database initialization error.");
            }

            app.UseDeveloperExceptionPage();

            app.UseStaticFiles();
            app.UseRouting();
            app.UseAuthorization();

            app.Use(async (context, next) =>
            {
                var logger = context.RequestServices.GetRequiredService<ILogger<Startup>>();
                logger.LogInformation("Request: {method} {path}", context.Request.Method, context.Request.Path);
                await next();
            });

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllerRoute(
                    name: "default",
                    pattern: "{controller=Home}/{action=Index}/{id?}");
            });
        }
    }
}
