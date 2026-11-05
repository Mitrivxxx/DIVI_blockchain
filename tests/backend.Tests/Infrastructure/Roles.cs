namespace backend.Tests.Infrastructure;

/// <summary>MemberRole seed ids / JWT role names (see backend/AGENTS.md).</summary>
public static class Roles
{
    public const int AdminId = 1;
    public const int IssuerId = 2;
    public const int UserId = 3;
    public const int OwnerId = 4;

    public static string NameOf(int roleId) => roleId switch
    {
        AdminId => "admin",
        IssuerId => "issuer",
        OwnerId => "owner",
        _ => "user",
    };
}
