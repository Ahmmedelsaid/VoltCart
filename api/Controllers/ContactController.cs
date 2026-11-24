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
            Topic = dto.Topic is { } t && ContactEmails.Topics.Contains(t) ? t : "other",
            OrderNumber = dto.OrderNumber,
            CreatedAt = clock.GetUtcNow().UtcDateTime,
        };
        db.ContactMessages.Add(message);
        await db.SaveChangesAsync();

        // الرسالة اتحفظت، وبعدين نبعتها على الإيميل في الخلفية (لو الإيميل متظبط)
        if (emails.Enabled && emailOptions.Value.ContactRecipient is { Length: > 0 } recipient)
            await emails.EnqueueAsync(ContactEmails.ForShop(message, recipient));

        return NoContent();
    }
}
