namespace backend.Modules.Issuers.Contracts;

/// <summary>
/// Public API of the Issuers module: how an issuing member is presented on documents.
/// </summary>
public interface IIssuerDirectory
{
    /// <summary>Institution name, falling back to the member's first/last name. Missing ids map to null.</summary>
    Task<IReadOnlyDictionary<int, string?>> ResolveDisplayNamesAsync(IEnumerable<int> memberIds);

    Task<string?> ResolveDisplayNameAsync(int? memberId);

    /// <summary>Institution logo, falling back to the member's avatar. Every requested id is present (null when none).</summary>
    Task<IReadOnlyDictionary<int, string?>> ResolveLogoUrlsAsync(IEnumerable<int> memberIds);

    Task<string?> ResolveLogoUrlAsync(int? memberId);
}
