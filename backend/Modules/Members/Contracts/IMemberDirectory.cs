namespace backend.Modules.Members.Contracts;

/// <summary>Read-only view of a member for other modules.</summary>
public sealed record MemberAccount(
    int Id,
    string? Email,
    string? EthereumAddress,
    string? FirstName,
    string? LastName,
    string? AvatarUrl,
    int MemberRoleId,
    string RoleName,
    DateTime CreatedAt);

public sealed record NewMemberAccount
{
    public string? Email { get; init; }
    public string? PasswordHash { get; init; }
    public string? EthereumAddress { get; init; }
    public string? GoogleSub { get; init; }
    public string? FirstName { get; init; }
    public string? LastName { get; init; }
}

/// <summary>
/// Public API of the Members module. Other modules must use this instead of querying <c>Members</c> directly.
/// </summary>
public interface IMemberDirectory
{
    Task<MemberAccount?> FindByIdAsync(int memberId);

    /// <summary>Case-insensitive match on the stored email.</summary>
    Task<MemberAccount?> FindByEmailAsync(string email);

    /// <summary>Same as <see cref="FindByEmailAsync"/> plus the stored password hash (null for Web3/Google-only accounts).</summary>
    Task<(MemberAccount Account, string? PasswordHash)?> FindWithPasswordHashByEmailAsync(string email);

    /// <summary>Case-insensitive match on the stored Ethereum address.</summary>
    Task<MemberAccount?> FindByEthereumAddressAsync(string ethereumAddress);

    Task<MemberAccount?> FindByGoogleSubAsync(string googleSub);

    Task<IReadOnlyDictionary<int, MemberAccount>> GetByIdsAsync(IEnumerable<int> memberIds);

    /// <summary>Creates a member with the default <c>user</c> role. Unique-constraint violations surface as <c>DbUpdateException</c>.</summary>
    Task<MemberAccount> CreateAsync(NewMemberAccount account);

    /// <summary>Changes the member role and saves the shared unit of work. Returns false when the member does not exist.</summary>
    Task<bool> SetRoleAsync(int memberId, int memberRoleId);
}
