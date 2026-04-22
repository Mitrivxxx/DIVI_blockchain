using System.Security.Cryptography;
using System.Text;
using Konscious.Security.Cryptography;

namespace backend.Utils;

public static class PasswordHasher
{
    private const int SaltSize = 16;
    private const int HashSize = 32;
    private const int Iterations = 4;
    private const int MemorySize = 65536;
    private const int DegreeOfParallelism = 2;

    public static string HashPassword(string password)
    {
        if (string.IsNullOrWhiteSpace(password))
        {
            throw new ArgumentException("Password is required", nameof(password));
        }

        var salt = RandomNumberGenerator.GetBytes(SaltSize);
        var hash = DeriveHash(password, salt);

        return $"argon2id$v=19$m={MemorySize},t={Iterations},p={DegreeOfParallelism}${Convert.ToBase64String(salt)}${Convert.ToBase64String(hash)}";
    }

    public static bool VerifyPassword(string password, string storedHash)
    {
        if (string.IsNullOrWhiteSpace(password) || string.IsNullOrWhiteSpace(storedHash))
        {
            return false;
        }

        // Backward-compatible fallback for records created before hashing was introduced.
        if (!storedHash.StartsWith("argon2id$", StringComparison.Ordinal))
        {
            return password == storedHash;
        }

        var parts = storedHash.Split('$');
        if (parts.Length != 5)
        {
            return false;
        }

        var parameters = ParseParameters(parts[2]);
        if (!parameters.TryGetValue("m", out var memorySize)
            || !parameters.TryGetValue("t", out var iterations)
            || !parameters.TryGetValue("p", out var degreeOfParallelism))
        {
            return false;
        }

        byte[] salt;
        byte[] expectedHash;

        try
        {
            salt = Convert.FromBase64String(parts[3]);
            expectedHash = Convert.FromBase64String(parts[4]);
        }
        catch (FormatException)
        {
            return false;
        }

        var actualHash = DeriveHash(password, salt, expectedHash.Length, iterations, memorySize, degreeOfParallelism);
        return CryptographicOperations.FixedTimeEquals(actualHash, expectedHash);
    }

    private static byte[] DeriveHash(
        string password,
        byte[] salt,
        int hashSize = HashSize,
        int iterations = Iterations,
        int memorySize = MemorySize,
        int degreeOfParallelism = DegreeOfParallelism)
    {
        using var argon2 = new Argon2id(Encoding.UTF8.GetBytes(password))
        {
            Salt = salt,
            Iterations = iterations,
            MemorySize = memorySize,
            DegreeOfParallelism = degreeOfParallelism
        };

        return argon2.GetBytes(hashSize);
    }

    private static Dictionary<string, int> ParseParameters(string rawParameters)
    {
        var result = new Dictionary<string, int>(StringComparer.Ordinal);
        var parts = rawParameters.Split(',', StringSplitOptions.RemoveEmptyEntries);

        foreach (var part in parts)
        {
            var pair = part.Split('=', 2);
            if (pair.Length == 2 && int.TryParse(pair[1], out var value))
            {
                result[pair[0]] = value;
            }
        }

        return result;
    }
}