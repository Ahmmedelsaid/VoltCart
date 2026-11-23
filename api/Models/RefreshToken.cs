namespace VoltCart.Api.Models;

/// <summary>
/// A long-lived credential used only to get new access tokens. The browser keeps it in an
/// HttpOnly cookie; the database keeps only its SHA-256 hash, so a leaked table is useless.
/// Every use rotates it (the old one is revoked and replaced). Tokens issued from the same
/// login share a FamilyId, so one stolen-and-replayed token can end the whole session.
/// </summary>
public class RefreshToken
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public User? User { get; set; }

    /// <summary>SHA-256 of the token, as 64 hex characters.</summary>
    public required string TokenHash { get; set; }

    public Guid FamilyId { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime ExpiresAt { get; set; }

    public DateTime? RevokedAt { get; set; }

    /// <summary>Hash of the token that replaced this one when it was rotated.</summary>
    public string? ReplacedByHash { get; set; }
}
