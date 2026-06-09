namespace LiquorCreditSystem.Models;

public enum DealerLevel
{
    A,
    B,
    C,
    D
}

public enum OrderStatus
{
    Draft,
    Submitted,
    CreditFrozen,
    Shipped,
    Completed,
    Rejected,
    Exception
}

public enum ExceptionType
{
    None,
    InsufficientCredit,
    OverdueDebt,
    PricePolicyConflict
}

public enum ReviewStatus
{
    Pending,
    Approved,
    Rejected
}

public enum OperationRole
{
    Sales,
    Finance,
    Warehouse,
    RiskControl
}
