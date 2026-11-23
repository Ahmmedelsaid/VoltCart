namespace VoltCart.Api.Dtos;

public static class ValidationPatterns
{
    /// <summary>Lowercase letters, digits and single hyphens: "samsung-galaxy-s24".</summary>
    public const string Slug = "^[a-z0-9]+(?:-[a-z0-9]+)*$";

    public const string SlugMessage =
        "Slug must contain only lowercase letters, digits and single hyphens.";

    /// <summary>At least one letter and one digit (length is checked by StringLength).</summary>
    public const string Password = @"^(?=.*[A-Za-z])(?=.*\d).+$";

    public const string PasswordMessage =
        "Password must contain at least one letter and one digit.";
}
