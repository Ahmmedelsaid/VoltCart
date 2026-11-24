using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;
using VoltCart.Api.Data;
using VoltCart.Api.Dtos;
using VoltCart.Api.Models;
using VoltCart.Api.Services;

namespace VoltCart.Api.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/[controller]")]
public class ContactController(
    AppDbContext db,
    TimeProvider clock,
    IEmailQueue emails,
    IOptions<EmailOptions> emailOptions
) : ControllerBase
{
    [HttpPost]
    [EnableRateLimiting("contact")]
    public async Task<IActionResult> Send(CreateContactMessageDto dto)
    {
        // بوت: نرد بنجاح عشان ما يعرفش إننا اكتشفناه، بس ما نحفظش حاجة
        if (!string.IsNullOrWhiteSpace(dto.Website))
            return NoContent();

        var message = new ContactMessage
        {
            Name = dto.Name.Trim(),
            Email = dto.Email.Trim(),
            Phone = string.IsNullOrWhiteSpace(dto.Phone) ? null : dto.Phone.Trim(),
            Subject = dto.Subject.Trim(),
            Message = dto.Message.Trim(),
            CreatedAt = clock.GetUtcNow().UtcDateTime,
        };
        db.ContactMessages.Add(message);
        await db.SaveChangesAsync();

        // الرسالة اتحفظت، وبعدين نبعتها على الإيميل في الخلفية (لو الإيميل متظبط)
        if (emails.Enabled && emailOptions.Value.ContactRecipient is { Length: > 0 } recipient)
            await emails.EnqueueAsync(
                new EmailMessage(
                    To: recipient,
                    Subject: $"[VoltCart] {OneLine(message.Subject)}",
                    Body: BuildBody(message),
                    // الرد على الإيميل يروح للعميل مباشرة
                    ReplyTo: message.Email
                )
            );

        return NoContent();
    }

    private static string OneLine(string text) => text.ReplaceLineEndings(" ");

    private static string BuildBody(ContactMessage m) =>
        $"""
            New message from the Contact us form

            Name:  {OneLine(m.Name)}
            Email: {m.Email}
            Phone: {m.Phone ?? "(not given)"}
            Sent:  {m.CreatedAt:yyyy-MM-dd HH:mm} UTC

            {m.Message}
            """;
}
