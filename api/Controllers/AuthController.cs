using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VoltCart.Api.Data;
using VoltCart.Api.Dtos;
using VoltCart.Api.Models;
using VoltCart.Api.Services;

namespace VoltCart.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(
    AppDbContext db,
    IPasswordHasher<User> hasher,
    TokenService tokens,
    ILogger<AuthController> logger
) : ControllerBase
{
    // بنقارن الباسورد بـ hash وهمي لما الإيميل مش موجود، عشان وقت الرد ما يكشفش
    // هل الإيميل مسجّل ولا لأ.
    private static readonly Lazy<string> DummyHash = new(() =>
        new PasswordHasher<User>().HashPassword(
            new User
            {
                Email = "dummy@invalid",
                FullName = "dummy",
                PasswordHash = string.Empty,
            },
            "dummy-password-1"
        )
    );

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterDto dto)
    {
        var email = NormalizeEmail(dto.Email);

        if (await db.Users.AnyAsync(u => u.Email == email))
            return Problem(
                detail: "An account with this email already exists.",
                statusCode: StatusCodes.Status409Conflict
            );

        // الـ Role دايمًا Customer. العميل مالوش أي طريقة يطلب Admin من هنا.
        var user = new User
        {
            Email = email,
            FullName = dto.FullName.Trim(),
            PasswordHash = string.Empty,
        };
        user.PasswordHash = hasher.HashPassword(user, dto.Password);

        db.Users.Add(user);
        await db.SaveChangesAsync();

        logger.LogInformation("New customer registered: user {UserId}", user.Id);
        return StatusCode(StatusCodes.Status201Created, CreateResponse(user));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginDto dto)
    {
        var email = NormalizeEmail(dto.Email);
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email);

        if (user is null)
        {
            hasher.VerifyHashedPassword(
                new User
                {
                    Email = email,
                    FullName = string.Empty,
                    PasswordHash = string.Empty,
                },
                DummyHash.Value,
                dto.Password
            );
            return InvalidCredentials();
        }

        var result = hasher.VerifyHashedPassword(user, user.PasswordHash, dto.Password);
        if (result == PasswordVerificationResult.Failed || !user.IsActive)
            return InvalidCredentials();

        if (result == PasswordVerificationResult.SuccessRehashNeeded)
        {
            // خوارزمية التشفير اتحدّثت: بنخزّن الـ hash الجديد
            user.PasswordHash = hasher.HashPassword(user, dto.Password);
            await db.SaveChangesAsync();
        }

        return CreateResponse(user);
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UserDto>> Me()
    {
        var idClaim = User.FindFirstValue("sub");
        if (!int.TryParse(idClaim, out var id))
            return Unauthorized();

        var user = await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id);
        return user is null || !user.IsActive ? Unauthorized() : UserDto.From(user);
    }

    private AuthResponse CreateResponse(User user)
    {
        var (token, expiresAtUtc) = tokens.CreateAccessToken(user);
        return new AuthResponse(token, expiresAtUtc, UserDto.From(user));
    }

    // نفس الرسالة للإيميل الغلط والباسورد الغلط، عشان ما نكشفش أي الإيميلات مسجّلة
    private ActionResult InvalidCredentials() =>
        Problem(
            detail: "Invalid email or password.",
            statusCode: StatusCodes.Status401Unauthorized
        );

    private static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();
}
