using MeetingRoomEquipment.Models;

namespace MeetingRoomEquipment.Services;

public interface IPermissionService
{
    bool CanViewDetail(EquipmentBorrowRecord record);
    bool CanFieldEdit(EquipmentBorrowRecord record);
    bool CanReview(EquipmentBorrowRecord record);
    bool CanArchive(EquipmentBorrowRecord record);
    bool CanReopen(EquipmentBorrowRecord record);
    bool IsReadOnly(EquipmentBorrowRecord record);
}

public class PermissionService : IPermissionService
{
    private readonly ICurrentUserService _user;

    public PermissionService(ICurrentUserService user)
    {
        _user = user;
    }

    public bool CanViewDetail(EquipmentBorrowRecord record) => true;

    public bool CanFieldEdit(EquipmentBorrowRecord record)
    {
        if (record.IsArchived) return false;
        if (_user.IsAdmin) return true;
        if (!_user.IsFieldStaff) return false;
        return record.Status is RecordStatus.PendingAcceptance
            or RecordStatus.Processing
            or RecordStatus.ReturnedForSupplement;
    }

    public bool CanReview(EquipmentBorrowRecord record)
    {
        if (record.IsArchived) return false;
        if (_user.IsAdmin) return true;
        if (!_user.IsReviewer) return false;
        return record.Status is RecordStatus.PendingReview;
    }

    public bool CanArchive(EquipmentBorrowRecord record)
    {
        if (record.IsArchived) return false;
        if (_user.IsAdmin) return true;
        if (!_user.IsReviewer) return false;
        return record.Status == RecordStatus.PendingReview;
    }

    public bool CanReopen(EquipmentBorrowRecord record)
    {
        if (!record.IsArchived) return false;
        return _user.IsAdmin || _user.IsReviewer;
    }

    public bool IsReadOnly(EquipmentBorrowRecord record)
    {
        return record.IsArchived || !(CanFieldEdit(record) || CanReview(record));
    }
}
