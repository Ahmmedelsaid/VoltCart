using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using VoltCart.Api.Data;
using VoltCart.Api.Dtos;
using VoltCart.Api.Infrastructure;
using VoltCart.Api.Models;
using VoltCart.Api.Services;

namespace VoltCart.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(
    AppDbContext db,
    IPasswordHasher<User> hasher,
    TokenService tokens,
    IOptions<JwtOptions> jwtOptions,
    TimeProvider clock,
    IWebHostEnvironment environment,
    ILogger<AuthController> logger
) : ControllerBase
{
    public const string RefreshCookieName = "vc_refresh";

    private readonly JwtOptions jwt = jwtOptions.Value;

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

    [EnableRateLimiting("auth")]
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
        return StatusCode(StatusCodes.Status201Created, await StartSessionAsync(user));
    }

    [EnableRateLimiting("auth")]
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

        return await StartSessionAsync(user);
    }

    /// <summary>
    /// Trades the refresh cookie for a new access token (and a new refresh cookie).
    /// The browser sends the cookie by itself; JavaScript never sees it.
    /// </summary>
    [EnableRateLimiting("auth")]
    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponse>> Refresh()
    {
        var rawToken = Request.Cookies[RefreshCookieName];
        if (string.IsNullOrEmpty(rawToken))
            return SessionExpired();

        var now = clock.GetUtcNow().UtcDateTime;
        var hash = TokenService.Hash(rawToken);
        var stored = await db
            .RefreshTokens.Include(t => t.User)
            .FirstOrDefaultAsync(t => t.TokenHash == hash);

        if (stored?.User is null)
            return SessionExpired(clearCookie: true);

        if (stored.RevokedAt is { } revokedAt)
        {
            var isRace =
                stored.ReplacedByHash is not null
                && now - revokedAt <= TimeSpan.FromSeconds(jwt.RefreshReuseGraceSeconds);

            if (isRace && stored.User.IsActive)
                // طلبين اتبعتوا مع بعض: الـ cookie الجديدة وصلت للمتصفح من الطلب الأول،
                // فبنديه access token جديد من غير ما نلف الـ refresh token تاني
                return CreateResponse(stored.User);

            // توكن قديم (اتبدّل قبل كده) رجع تاني: غالبًا اتسرق. بننهي الجلسة كلها.
            await RevokeFamilyAsync(stored.FamilyId, now);
            logger.LogWarning(
                "Refresh token reuse detected for user {UserId}; the session was revoked",
                stored.UserId
            );
            return SessionExpired(clearCookie: true);
        }

        if (stored.ExpiresAt <= now || !stored.User.IsActive)
            return SessionExpired(clearCookie: true);

        // Rotation: القديم يتلغي والجديد يحل مكانه. التحديث الشرطي بيضمن إن طلبين متزامنين
        // ما يعملوش توكنين جداد من نفس القديم.
        var (newRawToken, newHash) = tokens.GenerateRefreshToken();
        var rotated = await db
            .RefreshTokens.Where(t => t.Id == stored.Id && t.RevokedAt == null)
            .ExecuteUpdateAsync(s =>
                s.SetProperty(t => t.RevokedAt, now).SetProperty(t => t.ReplacedByHash, newHash)
            );

        if (rotated == 0)
            return CreateResponse(stored.User);

        var expires = now.AddDays(jwt.RefreshTokenDays);
        db.RefreshTokens.Add(
            new RefreshToken
            {
                UserId = stored.UserId,
                TokenHash = newHash,
                FamilyId = stored.FamilyId,
                CreatedAt = now,
                ExpiresAt = expires,
            }
        );
        await db.SaveChangesAsync();

        SetRefreshCookie(newRawToken, expires);
        return CreateResponse(stored.User);
    }

    /// <summary>Ends this browser's session: revokes its refresh tokens and clears the cookie.</summary>
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        var rawToken = Request.Cookies[RefreshCookieName];
        if (!string.IsNullOrEmpty(rawToken))
        {
            var hash = TokenService.Hash(rawToken);
            var familyId = await db
                .RefreshTokens.Where(t => t.TokenHash == hash)
                .Select(t => (Guid?)t.FamilyId)
                .FirstOrDefaultAsync();

            if (familyId is { } id)
                await RevokeFamilyAsync(id, clock.GetUtcNow().UtcDateTime);
        }

        ClearRefreshCookie();
        return NoContent();
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

    /// <summary>Creates a refresh token for a new login and sets it as an HttpOnly cookie.</summary>
    private async Task<AuthResponse> StartSessionAsync(User user)
    {
        var now = clock.GetUtcNow().UtcDateTime;
        var expires = now.AddDays(jwt.RefreshTokenDays);
        var (rawToken, hash) = tokens.GenerateRefreshToken();

        db.RefreshTokens.Add(
            new RefreshToken
            {
                UserId = user.Id,
                TokenHash = hash,
                FamilyId = Guid.NewGuid(),
                CreatedAt = now,
                ExpiresAt = expires,
            }
        );
        await db.SaveChangesAsync();

        SetRefreshCookie(rawToken, expires);
        return CreateResponse(user);
    }

    private AuthResponse CreateResponse(User user)
    {
        var (token, expiresAtUtc) = tokens.CreateAccessToken(user);
        return new AuthResponse(token, expiresAtUtc, UserDto.From(user));
    }

    private Task<int> RevokeFamilyAsync(Guid familyId, DateTime now) =>
        db
            .RefreshTokens.Where(t => t.FamilyId == familyId && t.RevokedAt == null)
            .ExecuteUpdateAsync(s => s.SetProperty(t => t.RevokedAt, now));

    private void SetRefreshCookie(string value, DateTime expiresUtc) =>
        Response.Cookies.Append(RefreshCookieName, value, CookieOptionsFor(expiresUtc));

    private void ClearRefreshCookie() =>
        Response.Cookies.Delete(RefreshCookieName, CookieOptionsFor(null));

    // HttpOnly: الـ JavaScript ما يقدرش يقراها (حماية من XSS). SameSite=Strict: ما تتبعتش
    // من موقع تاني (حماية من CSRF). Path: بتتبعت لمسارات الـ auth بس.
    private CookieOptions CookieOptionsFor(DateTime? expiresUtc) =>
        new()
        {
            HttpOnly = true,
            Secure = !environment.IsDevelopment(),
            SameSite = SameSiteMode.Strict,
            Path = "/api/auth",
            IsEssential = true,
            Expires = expiresUtc is null
                ? null
                : new DateTimeOffset(expiresUtc.Value, TimeSpan.Zero),
        };

    // نفس الرسالة للإيميل الغلط والباسورد الغلط، عشان ما نكشفش أي الإيميلات مسجّلة
    private ActionResult InvalidCredentials() =>
        Problem(
            detail: "Invalid email or password.",
            statusCode: StatusCodes.Status401Unauthorized
        );

    private ActionResult SessionExpired(bool clearCookie = false)
    {
        if (clearCookie)
            ClearRefreshCookie();

        return Problem(
            detail: "Your session has expired. Please sign in again.",
            statusCode: StatusCodes.Status401Unauthorized
        );
    }

    private static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();
}
