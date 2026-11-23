namespace VoltCart.Api.Models;

public class User
{
    public int Id { get; set; }

    /// <summary>Always stored trimmed and lowercase, so the unique index is case-insensitive.</summary>
    public required string Email { get; set; }

    /// <summary>PBKDF2 hash produced by PasswordHasher. The plain password is never stored.</summary>
    public required string PasswordHash { get; set; }

    public required string FullName { get; set; }

    public UserRole Role { get; set; } = UserRole.Customer;

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
