using System;
using System.Linq;

public static class Utils
{
    public static byte[] StringToBytes32(string str, bool isHex = false)
    {
        if (string.IsNullOrWhiteSpace(str))
            throw new ArgumentException("String is empty");

        if (isHex)
        {
            if (str.StartsWith("0x")) str = str.Substring(2);
            if (str.Length != 64)
                throw new ArgumentException("Hex string must be 32 bytes (64 hex chars)");

            return Enumerable.Range(0, str.Length / 2)
                .Select(x => Convert.ToByte(str.Substring(x * 2, 2), 16))
                .ToArray();
        }
        else
        {
            str = str.Trim();
            var bytes = System.Text.Encoding.UTF8.GetBytes(str);

            if (bytes.Length > 32)
                throw new ArgumentException($"String too long for bytes32: {bytes.Length} bytes");

            var bytes32 = new byte[32];
            Array.Copy(bytes, bytes32, bytes.Length);
            return bytes32;
        }
    }
}
