namespace backend.Services.GetProfile;

internal static class AvatarObjectKeys
{
    /// <summary>Prefix ending with '.' so member 1 does not match avatars/10.jpg.</summary>
    public static string Prefix(int memberId) => $"avatars/{memberId}.";

    public static string ForMember(int memberId, string contentType)
    {
        var ext = contentType.Trim().ToLowerInvariant() switch
        {
            "image/png" => ".png",
            "image/webp" => ".webp",
            _ => ".jpg",
        };

        return $"{Prefix(memberId)}{ext}";
    }
}
