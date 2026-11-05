namespace backend.BuildingBlocks;

/// <summary>Seeded <c>MemberRoles</c> ids and the lowercase names used in JWT role claims.</summary>
public static class MemberRoles
{
    public const int AdminId = 1;
    public const int IssuerId = 2;
    public const int UserId = 3;
    public const int OwnerId = 4;

    public const string Admin = "admin";
    public const string Issuer = "issuer";
    public const string User = "user";
    public const string Owner = "owner";
}
