using MeetingRoomEquipment.Models;
using Microsoft.Extensions.Options;

namespace MeetingRoomEquipment.Services;

public interface ICurrentUserService
{
    string UserId { get; }
    string UserName { get; }
    UserRole Role { get; }
    bool IsFieldStaff { get; }
    bool IsReviewer { get; }
    bool IsAdmin { get; }
    void SwitchUser(string userId, string userName, string role);
}

public class CurrentUserService : ICurrentUserService
{
    private static CurrentUserOptions _current = new();
    private readonly IOptions<CurrentUserOptions> _options;

    public CurrentUserService(IOptions<CurrentUserOptions> options)
    {
        _options = options;
        if (string.IsNullOrEmpty(_current.UserId))
        {
            _current = new CurrentUserOptions
            {
                UserId = options.Value.UserId,
                UserName = options.Value.UserName,
                Role = options.Value.Role
            };
        }
    }

    public string UserId => _current.UserId;
    public string UserName => _current.UserName;
    public UserRole Role => ParseRole(_current.Role);

    public bool IsFieldStaff => Role == UserRole.FieldStaff;
    public bool IsReviewer => Role == UserRole.Reviewer;
    public bool IsAdmin => Role == UserRole.Admin;

    public void SwitchUser(string userId, string userName, string role)
    {
        _current = new CurrentUserOptions { UserId = userId, UserName = userName, Role = role };
    }

    private static UserRole ParseRole(string role) => role.ToLower() switch
    {
        "fieldstaff" or "1" => UserRole.FieldStaff,
        "reviewer" or "2" => UserRole.Reviewer,
        "admin" or "3" => UserRole.Admin,
        _ => UserRole.FieldStaff
    };
}
