using SurgicalInstrumentTracking.Models;

namespace SurgicalInstrumentTracking.ViewModels;

public class InstrumentSetDetailViewModel
{
    public InstrumentSet InstrumentSet { get; set; } = null!;
    public List<InstrumentSetItem> Items { get; set; } = new();
    public SterilizationBatch? SterilizationBatch { get; set; }
    public Department Department { get; set; } = null!;
    public User? ReceivedByUser { get; set; }
    public List<AnomalyRecord> AnomalyRecords { get; set; } = new();
    public List<TrackingRecord> TrackingRecords { get; set; } = new();
    public bool IsSterilizationExpired { get; set; }
}

public class InstrumentSetListViewModel
{
    public List<InstrumentSet> InstrumentSets { get; set; } = new();
    public string? StatusFilter { get; set; }
    public string? DepartmentFilter { get; set; }
    public string? SearchTerm { get; set; }
    public List<Department> Departments { get; set; } = new();
    public int TotalCount { get; set; }
}
