using Microsoft.EntityFrameworkCore;
using OceanFarm.Data;
using OceanFarm.Models;
using OceanFarm.ViewModels;

namespace OceanFarm.Services;

public class DataSeeder : IDataSeeder
{
    private readonly ApplicationDbContext _context;

    public DataSeeder(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task SeedAsync()
    {
        await _context.Database.EnsureCreatedAsync();

        if (await _context.Users.AnyAsync()) return;

        var users = new List<AppUser>
        {
            new() { UserName = "patrol01", FullName = "张伟", Role = UserRole.PatrolInspector, Phone = "13800000001", CreatedAt = DateTime.UtcNow.AddDays(-30) },
            new() { UserName = "patrol02", FullName = "李娜", Role = UserRole.PatrolInspector, Phone = "13800000002", CreatedAt = DateTime.UtcNow.AddDays(-25) },
            new() { UserName = "feed01", FullName = "王强", Role = UserRole.FeedingOperator, Phone = "13800000003", CreatedAt = DateTime.UtcNow.AddDays(-28) },
            new() { UserName = "feed02", FullName = "赵敏", Role = UserRole.FeedingOperator, Phone = "13800000004", CreatedAt = DateTime.UtcNow.AddDays(-20) },
            new() { UserName = "vet01", FullName = "陈医生", Role = UserRole.Veterinarian, Phone = "13800000005", CreatedAt = DateTime.UtcNow.AddDays(-35) },
            new() { UserName = "vet02", FullName = "刘医生", Role = UserRole.Veterinarian, Phone = "13800000006", CreatedAt = DateTime.UtcNow.AddDays(-22) },
            new() { UserName = "mgr01", FullName = "孙场长", Role = UserRole.FarmManager, Phone = "13800000007", CreatedAt = DateTime.UtcNow.AddDays(-60) }
        };
        await _context.Users.AddRangeAsync(users);
        await _context.SaveChangesAsync();

        var seaAreas = new List<SeaArea>
        {
            new() { Name = "黄海A区", Description = "冷水鱼养殖区" },
            new() { Name = "黄海B区", Description = "温水鱼养殖区" },
            new() { Name = "东海C区", Description = "深水养殖试验区" }
        };
        await _context.SeaAreas.AddRangeAsync(seaAreas);
        await _context.SaveChangesAsync();

        var species = new List<FishSpecies>
        {
            new() { Name = "大黄鱼", ScientificName = "Larimichthys crocea", OptimalMinTemperature = 18, OptimalMaxTemperature = 28, OptimalMinDissolvedOxygen = 5.0m, DailyFeedRatePerKg = 0.03m, Notes = "暖温性近海鱼类" },
            new() { Name = "鲈鱼", ScientificName = "Lateolabrax japonicus", OptimalMinTemperature = 15, OptimalMaxTemperature = 26, OptimalMinDissolvedOxygen = 4.5m, DailyFeedRatePerKg = 0.025m, Notes = "广温广盐性鱼类" },
            new() { Name = "石斑鱼", ScientificName = "Epinephelus", OptimalMinTemperature = 22, OptimalMaxTemperature = 30, OptimalMinDissolvedOxygen = 5.5m, DailyFeedRatePerKg = 0.02m, Notes = "名贵海水鱼类" },
            new() { Name = "真鲷", ScientificName = "Pagrus major", OptimalMinTemperature = 17, OptimalMaxTemperature = 27, OptimalMinDissolvedOxygen = 5.0m, DailyFeedRatePerKg = 0.028m, Notes = "高级食用鱼" }
        };
        await _context.FishSpecies.AddRangeAsync(species);
        await _context.SaveChangesAsync();

        var cages = new List<Cage>
        {
            new() { Code = "A-001", SeaAreaId = seaAreas[0].Id, FishSpeciesId = species[0].Id, FishCount = 8000, AverageWeightKg = 0.35m, StockingDate = DateTime.UtcNow.AddDays(-90), VolumeCubicMeters = 500, IsActive = true, CurrentAnomaly = AnomalyType.None, CurrentStatus = DisposalStatus.Completed },
            new() { Code = "A-002", SeaAreaId = seaAreas[0].Id, FishSpeciesId = species[0].Id, FishCount = 7500, AverageWeightKg = 0.32m, StockingDate = DateTime.UtcNow.AddDays(-80), VolumeCubicMeters = 500, IsActive = true, CurrentAnomaly = AnomalyType.LowDissolvedOxygen, CurrentStatus = DisposalStatus.Pending, CurrentAnomalyNote = "连续两次检测溶氧低于4.0mg/L", AnomalyReportedAt = DateTime.UtcNow.AddHours(-8) },
            new() { Code = "B-001", SeaAreaId = seaAreas[1].Id, FishSpeciesId = species[1].Id, FishCount = 10000, AverageWeightKg = 0.5m, StockingDate = DateTime.UtcNow.AddDays(-120), VolumeCubicMeters = 600, IsActive = true, CurrentAnomaly = AnomalyType.InsufficientFeed, CurrentStatus = DisposalStatus.Approved, CurrentAnomalyNote = "投喂员报告饲料库存不足，鱼群摄食活跃但投喂量减少30%", AnomalyReportedAt = DateTime.UtcNow.AddHours(-20) },
            new() { Code = "B-002", SeaAreaId = seaAreas[1].Id, FishSpeciesId = species[1].Id, FishCount = 6000, AverageWeightKg = 0.4m, StockingDate = DateTime.UtcNow.AddDays(-100), VolumeCubicMeters = 500, IsActive = true, CurrentAnomaly = AnomalyType.DiseaseSuspected, CurrentStatus = DisposalStatus.Pending, CurrentAnomalyNote = "发现异常死亡，已提交兽医复核", AnomalyReportedAt = DateTime.UtcNow.AddHours(-36) },
            new() { Code = "C-001", SeaAreaId = seaAreas[2].Id, FishSpeciesId = species[2].Id, FishCount = 3000, AverageWeightKg = 0.8m, StockingDate = DateTime.UtcNow.AddDays(-150), VolumeCubicMeters = 800, IsActive = true, CurrentAnomaly = AnomalyType.None, CurrentStatus = DisposalStatus.Completed },
            new() { Code = "C-002", SeaAreaId = seaAreas[2].Id, FishSpeciesId = species[3].Id, FishCount = 5000, AverageWeightKg = 0.45m, StockingDate = DateTime.UtcNow.AddDays(-110), VolumeCubicMeters = 600, IsActive = true, CurrentAnomaly = AnomalyType.LowDissolvedOxygen, CurrentStatus = DisposalStatus.Approved, CurrentAnomalyNote = "经过曝气处理后溶氧恢复正常", AnomalyReportedAt = DateTime.UtcNow.AddDays(-2) }
        };
        await _context.Cages.AddRangeAsync(cages);
        await _context.SaveChangesAsync();

        var now = DateTime.UtcNow;

        var waterQualityRecords = new List<WaterQualityRecord>
        {
            new() { CageId = cages[0].Id, InspectorId = users[0].Id, RecordedAt = now.AddDays(-2).AddHours(-8), Temperature = 23.5m, DissolvedOxygen = 6.8m, Ph = 8.1m, Salinity = 31.5m, Turbidity = 3.2m, AnomalyType = AnomalyType.None, Remarks = "水质正常", IsHandled = true },
            new() { CageId = cages[0].Id, InspectorId = users[1].Id, RecordedAt = now.AddDays(-1).AddHours(-6), Temperature = 24.0m, DissolvedOxygen = 7.0m, Ph = 8.0m, Salinity = 31.8m, Turbidity = 3.5m, AnomalyType = AnomalyType.None, Remarks = "水质良好", IsHandled = true },
            new() { CageId = cages[0].Id, InspectorId = users[0].Id, RecordedAt = now.AddHours(-4), Temperature = 24.2m, DissolvedOxygen = 6.9m, Ph = 8.1m, Salinity = 32.0m, Turbidity = 3.0m, AnomalyType = AnomalyType.None, Remarks = "一切正常", IsHandled = true },

            new() { CageId = cages[1].Id, InspectorId = users[0].Id, RecordedAt = now.AddDays(-1).AddHours(-10), Temperature = 25.5m, DissolvedOxygen = 3.8m, Ph = 7.9m, Salinity = 32.5m, Turbidity = 8.5m, AnomalyType = AnomalyType.LowDissolvedOxygen, Remarks = "溶氧偏低，建议开启增氧设备", IsHandled = false },
            new() { CageId = cages[1].Id, InspectorId = users[1].Id, RecordedAt = now.AddHours(-8), Temperature = 26.0m, DissolvedOxygen = 3.5m, Ph = 7.8m, Salinity = 32.3m, Turbidity = 9.0m, AnomalyType = AnomalyType.LowDissolvedOxygen, Remarks = "溶氧持续偏低，已报告异常", IsHandled = false },

            new() { CageId = cages[2].Id, InspectorId = users[0].Id, RecordedAt = now.AddHours(-12), Temperature = 21.0m, DissolvedOxygen = 5.5m, Ph = 8.0m, Salinity = 30.5m, Turbidity = 4.0m, AnomalyType = AnomalyType.None, Remarks = "水质正常", IsHandled = true },

            new() { CageId = cages[3].Id, InspectorId = users[1].Id, RecordedAt = now.AddHours(-38), Temperature = 22.0m, DissolvedOxygen = 5.0m, Ph = 7.9m, Salinity = 31.0m, Turbidity = 5.0m, AnomalyType = AnomalyType.None, Remarks = "水质正常，但鱼群活动异常", IsHandled = true },

            new() { CageId = cages[4].Id, InspectorId = users[0].Id, RecordedAt = now.AddDays(-1).AddHours(-5), Temperature = 25.0m, DissolvedOxygen = 6.2m, Ph = 8.2m, Salinity = 33.0m, Turbidity = 2.5m, AnomalyType = AnomalyType.None, Remarks = "深水养殖区水质良好", IsHandled = true },

            new() { CageId = cages[5].Id, InspectorId = users[1].Id, RecordedAt = now.AddDays(-3).AddHours(-6), Temperature = 19.0m, DissolvedOxygen = 3.2m, Ph = 7.7m, Salinity = 29.5m, Turbidity = 7.5m, AnomalyType = AnomalyType.LowDissolvedOxygen, Remarks = "溶氧严重偏低", IsHandled = true },
            new() { CageId = cages[5].Id, InspectorId = users[0].Id, RecordedAt = now.AddDays(-2).AddHours(-12), Temperature = 19.5m, DissolvedOxygen = 5.8m, Ph = 7.9m, Salinity = 30.0m, Turbidity = 4.5m, AnomalyType = AnomalyType.None, Remarks = "曝气处理后溶氧恢复", IsHandled = true }
        };
        await _context.WaterQualityRecords.AddRangeAsync(waterQualityRecords);
        await _context.SaveChangesAsync();

        var feedingRecords = new List<FeedingRecord>
        {
            new() { CageId = cages[0].Id, OperatorId = users[2].Id, FeedingTime = now.AddDays(-2).AddHours(-7), FeedAmountKg = 85, FeedType = "配合饲料", Status = FeedingStatus.Normal, AnomalyType = AnomalyType.None, Remarks = "投喂正常，鱼群摄食活跃" },
            new() { CageId = cages[0].Id, OperatorId = users[3].Id, FeedingTime = now.AddDays(-1).AddHours(-7), FeedAmountKg = 88, FeedType = "配合饲料", Status = FeedingStatus.Normal, AnomalyType = AnomalyType.None, Remarks = "正常投喂" },
            new() { CageId = cages[0].Id, OperatorId = users[2].Id, FeedingTime = now.AddHours(-7), FeedAmountKg = 90, FeedType = "配合饲料", Status = FeedingStatus.Normal, AnomalyType = AnomalyType.None, Remarks = "投喂正常" },

            new() { CageId = cages[1].Id, OperatorId = users[2].Id, FeedingTime = now.AddDays(-1).AddHours(-7), FeedAmountKg = 80, FeedType = "配合饲料", Status = FeedingStatus.Abnormal, AnomalyType = AnomalyType.LowDissolvedOxygen, Remarks = "溶氧异常，减少投喂量" },

            new() { CageId = cages[2].Id, OperatorId = users[3].Id, FeedingTime = now.AddDays(-1).AddHours(-6), FeedAmountKg = 90, FeedType = "配合饲料", Status = FeedingStatus.Abnormal, AnomalyType = AnomalyType.InsufficientFeed, Remarks = "饲料库存不足，仅投喂计划量的70%" },
            new() { CageId = cages[2].Id, OperatorId = users[2].Id, FeedingTime = now.AddHours(-6), FeedAmountKg = 85, FeedType = "配合饲料", Status = FeedingStatus.Abnormal, AnomalyType = AnomalyType.InsufficientFeed, Remarks = "继续减少投喂，等待饲料补充" },

            new() { CageId = cages[3].Id, OperatorId = users[3].Id, FeedingTime = now.AddDays(-2).AddHours(-6), FeedAmountKg = 60, FeedType = "配合饲料", Status = FeedingStatus.Normal, AnomalyType = AnomalyType.None, Remarks = "投喂正常" },

            new() { CageId = cages[4].Id, OperatorId = users[2].Id, FeedingTime = now.AddDays(-1).AddHours(-8), FeedAmountKg = 50, FeedType = "配合饲料", Status = FeedingStatus.Normal, AnomalyType = AnomalyType.None, Remarks = "石斑鱼投喂正常" },

            new() { CageId = cages[5].Id, OperatorId = users[3].Id, FeedingTime = now.AddDays(-3).AddHours(-8), FeedAmountKg = 0, FeedType = "配合饲料", Status = FeedingStatus.Cancelled, AnomalyType = AnomalyType.LowDissolvedOxygen, Remarks = "溶氧异常暂停投喂" },
            new() { CageId = cages[5].Id, OperatorId = users[2].Id, FeedingTime = now.AddDays(-2).AddHours(-8), FeedAmountKg = 55, FeedType = "配合饲料", Status = FeedingStatus.Normal, AnomalyType = AnomalyType.None, Remarks = "溶氧恢复正常投喂" }
        };
        await _context.FeedingRecords.AddRangeAsync(feedingRecords);
        await _context.SaveChangesAsync();

        var diseaseReports = new List<DiseaseReport>
        {
            new() { CageId = cages[3].Id, ReporterId = users[2].Id, VeterinarianId = null, ReportedAt = now.AddHours(-36), Symptoms = "鱼群游动异常，体表有白点，今日死亡约50尾，异常约200尾表现异常", DeadFishCount = 50, AbnormalFishCount = 200, PhotoUrl = "/images/disease_placeholder.jpg", Status = DiseaseStatus.Reported, VeterinaryOpinion = null, DiagnosedDisease = null, RecommendedTreatment = null, ManagerNote = null }
        };
        await _context.DiseaseReports.AddRangeAsync(diseaseReports);
        await _context.SaveChangesAsync();

        var workflowNodes = new List<WorkflowNode>
        {
            new() { CageId = cages[0].Id, OperatorId = users[0].Id, NodeType = "水质巡检", Timestamp = now.AddDays(-2).AddHours(-8), Description = "巡检完成，水质各项指标正常", RelatedAnomaly = AnomalyType.None, StatusAfter = DisposalStatus.Completed, RelatedRecordId = waterQualityRecords[0].Id, RelatedRecordType = "WaterQuality" },
            new() { CageId = cages[0].Id, OperatorId = users[2].Id, NodeType = "正常投喂", Timestamp = now.AddDays(-2).AddHours(-7), Description = "完成正常投喂 85kg", RelatedAnomaly = AnomalyType.None, StatusAfter = DisposalStatus.Completed, RelatedRecordId = feedingRecords[0].Id, RelatedRecordType = "Feeding" },

            new() { CageId = cages[1].Id, OperatorId = users[0].Id, NodeType = "水质巡检-异常", Timestamp = now.AddDays(-1).AddHours(-10), Description = "检测到溶氧异常：3.8mg/L，低于阈值5.0mg/L", RelatedAnomaly = AnomalyType.LowDissolvedOxygen, StatusAfter = DisposalStatus.Pending, RelatedRecordId = waterQualityRecords[3].Id, RelatedRecordType = "WaterQuality" },
            new() { CageId = cages[1].Id, OperatorId = users[0].Id, NodeType = "水质巡检-异常确认", Timestamp = now.AddHours(-8), Description = "复检溶氧持续偏低：3.5mg/L，报告场长处理", RelatedAnomaly = AnomalyType.LowDissolvedOxygen, StatusAfter = DisposalStatus.Pending, RelatedRecordId = waterQualityRecords[4].Id, RelatedRecordType = "WaterQuality" },

            new() { CageId = cages[2].Id, OperatorId = users[3].Id, NodeType = "投喂异常", Timestamp = now.AddDays(-1).AddHours(-6), Description = "饲料库存不足，仅投喂90kg（计划125kg），已申请补充", RelatedAnomaly = AnomalyType.InsufficientFeed, StatusAfter = DisposalStatus.Approved, RelatedRecordId = feedingRecords[4].Id, RelatedRecordType = "Feeding" },
            new() { CageId = cages[2].Id, OperatorId = users[6].Id, NodeType = "场长确认", Timestamp = now.AddHours(-15), Description = "已安排饲料调拨，预计明日到货", RelatedAnomaly = AnomalyType.InsufficientFeed, StatusAfter = DisposalStatus.Approved, RelatedRecordType = "ManagerApproval" },

            new() { CageId = cages[3].Id, OperatorId = users[2].Id, NodeType = "病害报告", Timestamp = now.AddHours(-36), Description = "发现鱼群异常死亡，已提交病害报告", RelatedAnomaly = AnomalyType.DiseaseSuspected, StatusAfter = DisposalStatus.Pending, RelatedRecordId = diseaseReports[0].Id, RelatedRecordType = "DiseaseReport" },

            new() { CageId = cages[5].Id, OperatorId = users[1].Id, NodeType = "水质巡检-异常", Timestamp = now.AddDays(-3).AddHours(-6), Description = "检测到溶氧严重偏低：3.2mg/L", RelatedAnomaly = AnomalyType.LowDissolvedOxygen, StatusAfter = DisposalStatus.Pending, RelatedRecordId = waterQualityRecords[8].Id, RelatedRecordType = "WaterQuality" },
            new() { CageId = cages[5].Id, OperatorId = users[6].Id, NodeType = "场长确认处置", Timestamp = now.AddDays(-3).AddHours(-5), Description = "批准开启曝气设备，暂停投喂", RelatedAnomaly = AnomalyType.LowDissolvedOxygen, StatusAfter = DisposalStatus.Approved, RelatedRecordType = "ManagerApproval" },
            new() { CageId = cages[5].Id, OperatorId = users[0].Id, NodeType = "水质巡检-恢复", Timestamp = now.AddDays(-2).AddHours(-12), Description = "曝气处理后溶氧恢复至5.8mg/L", RelatedAnomaly = AnomalyType.None, StatusAfter = DisposalStatus.Approved, RelatedRecordId = waterQualityRecords[9].Id, RelatedRecordType = "WaterQuality" },
            new() { CageId = cages[5].Id, OperatorId = users[2].Id, NodeType = "恢复投喂", Timestamp = now.AddDays(-2).AddHours(-8), Description = "溶氧恢复正常，恢复正常投喂55kg", RelatedAnomaly = AnomalyType.None, StatusAfter = DisposalStatus.Completed, RelatedRecordId = feedingRecords[9].Id, RelatedRecordType = "Feeding" },
            new() { CageId = cages[5].Id, OperatorId = users[6].Id, NodeType = "处置完成", Timestamp = now.AddDays(-2).AddHours(-1), Description = "溶氧异常处置完成，网箱恢复正常生产", RelatedAnomaly = AnomalyType.None, StatusAfter = DisposalStatus.Completed, RelatedRecordType = "ManagerApproval" }
        };
        await _context.WorkflowNodes.AddRangeAsync(workflowNodes);
        await _context.SaveChangesAsync();
    }
}
