using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using VoltCart.Api.Data;
using VoltCart.Api.Dtos;
using VoltCart.Api.Models;

namespace VoltCart.Api.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/[controller]")]
public class ContactController(AppDbContext db, TimeProvider clock) : ControllerBase
{
    [HttpPost]
    [EnableRateLimiting("contact")]
    public async Task<IActionResult> Send(CreateContactMessageDto dto)
    {
        // بوت: نرد بنجاح عشان ما يعرفش إننا اكتشفناه، بس ما نحفظش حاجة
        if (!string.IsNullOrWhiteSpace(dto.Website))
            return NoContent();

        db.ContactMessages.Add(
            new ContactMessage
            {
                Name = dto.Name.Trim(),
                Email = dto.Email.Trim(),
                Phone = string.IsNullOrWhiteSpace(dto.Phone) ? null : dto.Phone.Trim(),
                Subject = dto.Subject.Trim(),
                Message = dto.Message.Trim(),
                CreatedAt = clock.GetUtcNow().UtcDateTime,
            }
        );
        await db.SaveChangesAsync();

        return NoContent();
    }
}
