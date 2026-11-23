using System.ComponentModel.DataAnnotations;

namespace VoltCart.Api.Infrastructure;

/// <summary>
/// Bound from the "Jwt" configuration section. The signing key is a secret:
/// keep it in user-secrets (development) or an environment variable (production),
/// never in appsettings.json.
/// </summary>
public class JwtOptions
{
    public const string SectionName = "Jwt";

    [Required]
    public string Issuer { get; set; } = string.Empty;

    [Required]
    public string Audience { get; set; } = string.Empty;

    /// <summary>At least 32 characters (256 bits) for HMAC-SHA256.</summary>
    [Required, MinLength(32)]
    public string Key { get; set; } = string.Empty;

    [Range(1, 1440)]
    public int AccessTokenMinutes { get; set; } = 60;
}
