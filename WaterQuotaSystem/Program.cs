using Microsoft.EntityFrameworkCore;
using WaterQuotaSystem.Data;
using WaterQuotaSystem.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllersWithViews();

builder.Services.AddDbContext<WaterQuotaDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<IWorkflowService, WorkflowService>();

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseRouting();
app.UseAuthorization();

app.MapStaticAssets();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<WaterQuotaDbContext>();
    db.Database.EnsureCreated();

    try
    {
        db.Database.ExecuteSqlRaw(
            "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Applications') AND name = 'ReviewerComment') " +
            "ALTER TABLE Applications ADD ReviewerComment NVARCHAR(500) NOT NULL DEFAULT ''");
    }
    catch { }

    var allApps = db.Applications.ToList();
    foreach (var a in allApps)
    {
        WorkflowService.SyncApplicationDisplay(a);
    }
    db.SaveChanges();
}

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Application}/{action=Index}/{id?}")
    .WithStaticAssets();

app.Run();
