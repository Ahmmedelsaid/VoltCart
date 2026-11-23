using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using VoltCart.Api.Models;

namespace VoltCart.Api.Data;

/// <summary>
/// Creates the first admin from configuration (Seed:AdminEmail / Seed:AdminPassword).
/// Nothing is hard-coded: with no configuration, no admin is created. The password
/// belongs in user-secrets or an environment variable.
/// </summary>
public static class AdminSeeder
{
    public static async Task SeedAsync(
        AppDbContext db,
        IPasswordHasher<User> hasher,
        IConfiguration configuration,
        ILogger logger
    )
    {
        var email = configuration["Seed:AdminEmail"]?.Trim().ToLowerInvariant();
        var password = configuration["Seed:AdminPassword"];

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrEmpty(password))
            return;

        if (await db.Users.AnyAsync(u => u.Role == UserRole.Admin))
            return;

        var admin = new User
        {
            Email = email,
            FullName = configuration["Seed:AdminName"] ?? "Administrator",
            PasswordHash = string.Empty,
            Role = UserRole.Admin,
        };
        admin.PasswordHash = hasher.HashPassword(admin, password);

        db.Users.Add(admin);
        await db.SaveChangesAsync();

        logger.LogInformation("Seeded the admin account {Email}", email);
    }
}
