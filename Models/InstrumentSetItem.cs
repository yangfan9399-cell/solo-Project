namespace SurgicalInstrumentTracking.Models;

public class InstrumentSetItem
{
    public int Id { get; set; }

    public int InstrumentSetId { get; set; }
    public InstrumentSet InstrumentSet { get; set; } = null!;

    public int InstrumentId { get; set; }
    public Instrument Instrument { get; set; } = null!;

    public int ExpectedQuantity { get; set; }

    public int ActualQuantity { get; set; }

    public bool IsMissing => ActualQuantity < ExpectedQuantity;
}
