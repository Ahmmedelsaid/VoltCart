using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using VoltCart.Api.Data;
using VoltCart.Api.Infrastructure;
using VoltCart.Api.Models;
using VoltCart.Api.Services;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();

// أي خطأ غير متوقع يرجع بنفس الشكل (ProblemDetails) بدل stack trace
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
var connectionString = builder.Configuration.GetConnectionString("Default");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(connectionString, new MySqlServerVersion(new Version(8, 0, 0)))
);

builder.Services.AddOpenApi();

// CORS: المتصفح بيمنع الـ Angular (localhost:4200) يكلّم الـ API (localhost:5034)
// لأن الـ origin مختلف. هنا بنسمح بالـ origins اللي في appsettings بس.
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];

builder.Services.AddCors(options =>
    options.AddPolicy("Frontend", policy =>
        policy
            .WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .WithExposedHeaders("Location")
    )
);

// ---------- Auth (JWT) ----------
// الإعدادات بتتقري وتتفحص عند التشغيل: لو Jwt:Key ناقص أو قصير، التطبيق مش بيشتغل
// ويقولك السبب (أحسن من إنه يشتغل بمفتاح ضعيف).
builder
    .Services.AddOptions<JwtOptions>()
    .BindConfiguration(JwtOptions.SectionName)
    .ValidateDataAnnotations()
    .ValidateOnStart();

builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddSingleton<IPasswordHasher<User>, PasswordHasher<User>>();
builder.Services.AddSingleton<TokenService>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer();
builder
    .Services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
    .Configure<IOptions<JwtOptions>>(
        (options, jwtOptions) =>
        {
            var jwt = jwtOptions.Value;

            // بنقرا أسماء الـ claims زي ما هي في التوكن (sub, role, name) من غير تحويل
            options.MapInboundClaims = false;
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = jwt.Issuer,
                ValidateAudience = true,
                ValidAudience = jwt.Audience,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Key)),
                ValidateLifetime = true,
                ClockSkew = TimeSpan.FromSeconds(30),
                NameClaimType = "name",
                RoleClaimType = "role",
            };
        }
    );
builder.Services.AddAuthorization();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();

    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await DbSeeder.SeedAsync(db);
}

// أول Admin بيتعمل من الإعدادات (Seed:AdminEmail / Seed:AdminPassword) لو موجودة بس
using (var scope = app.Services.CreateScope())
{
    await AdminSeeder.SeedAsync(
        scope.ServiceProvider.GetRequiredService<AppDbContext>(),
        scope.ServiceProvider.GetRequiredService<IPasswordHasher<User>>(),
        app.Configuration,
        app.Logger
    );
}

// لازم أول حاجة في الـ pipeline عشان يمسك أي exception بعده
app.UseExceptionHandler();

// بيحوّل الـ 404 و 405 و 415 الفاضية لـ ProblemDetails
app.UseStatusCodePages();

app.UseHttpsRedirection();

// الترتيب مهم: CORS ثم Authentication (مين انت؟) ثم Authorization (مسموح لك؟)
app.UseCors("Frontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
