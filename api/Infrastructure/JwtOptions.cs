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

    /// <summary>Short on purpose: an access token cannot be revoked, so it should expire fast.</summary>
    [Range(1, 1440)]
    public int AccessTokenMinutes { get; set; } = 15;

    /// <summary>How long a refresh token (and so a login session) lasts without being used.</summary>
    [Range(1, 90)]
    public int RefreshTokenDays { get; set; } = 7;

    /// <summary>
    /// A just-rotated refresh token that shows up again within this many seconds is treated as a
    /// harmless race (two tabs refreshing at once), not as theft.
    /// </summary>
    [Range(0, 60)]
    public int RefreshReuseGraceSeconds { get; set; } = 10;
}
