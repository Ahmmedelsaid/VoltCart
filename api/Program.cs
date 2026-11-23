using Microsoft.EntityFrameworkCore;
using VoltCart.Api.Data;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
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

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();

    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await DbSeeder.SeedAsync(db);
}

app.UseHttpsRedirection();

// لازم يجي قبل UseAuthorization
app.UseCors("Frontend");

app.UseAuthorization();

app.MapControllers();

app.Run();
