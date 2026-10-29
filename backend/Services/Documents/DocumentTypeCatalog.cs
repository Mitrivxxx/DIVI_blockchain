namespace backend.Services.Documents
{
    public sealed record DocumentTypeInfo(byte Id, string ApiValue, string LabelPl);

    /// <summary>
    /// Source of truth for on-chain / DB DocumentType values (0–4) and UI labels.
    /// </summary>
    public static class DocumentTypeCatalog
    {
        public static IReadOnlyList<DocumentTypeInfo> All { get; } =
        [
            new(0, "Education", "Wykształcenie"),
            new(1, "Experience", "Doświadczenie"),
            new(2, "Licenses and certificates", "Licencje i certyfikaty"),
            new(3, "Recommendation", "Rekomendacja"),
            new(4, "Honors and awards", "Wyróżnienia i nagrody"),
        ];

        public static string LabelPl(byte documentType)
        {
            foreach (var info in All)
            {
                if (info.Id == documentType)
                {
                    return info.LabelPl;
                }
            }

            return "—";
        }

        public static string AllowedValuesMessage =>
            "Invalid documentType. Allowed values: Education, Experience, Licenses and certificates, Recommendation, Honors and awards";

        /// <summary>Education (0) and Experience (1) use period dates instead of a PDF.</summary>
        public static bool IsMetadataOnly(byte documentType) => documentType is 0 or 1;

        /// <summary>
        /// Parses upload form / API documentType strings (EN + PL aliases).
        /// </summary>
        public static byte Parse(string rawDocumentType)
        {
            if (string.IsNullOrWhiteSpace(rawDocumentType))
            {
                throw new ArgumentException("documentType is required");
            }

            var normalized = rawDocumentType
                .Trim()
                .ToLowerInvariant()
                .Replace("_", " ")
                .Replace("-", " ");

            normalized = string.Join(' ', normalized.Split(' ', StringSplitOptions.RemoveEmptyEntries));

            return normalized switch
            {
                "education" or "wykształcenie" or "wyksztalcenie" => 0,
                "experience" or "doświadczenie" or "doswiadczenie" => 1,
                "licenses and certificates" or "licences and certificates"
                    or "licensesandcertificates" or "licencje i certyfikaty" => 2,
                "recommendation" or "rekomendacja" => 3,
                "honors and awards" or "honours and awards"
                    or "honorsandawards" or "wyróżnienia i nagrody" or "wyroznienia i nagrody" => 4,
                _ => throw new ArgumentException(AllowedValuesMessage),
            };
        }
    }
}
