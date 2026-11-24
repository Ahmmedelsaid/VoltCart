using System.ComponentModel.DataAnnotations;

namespace VoltCart.Api.Dtos;

public record CreateContactMessageDto(
    [Required, StringLength(100, MinimumLength = 2)] string Name,
    [Required, EmailAddress, StringLength(254)] string Email,
    [RegularExpression(ValidationPatterns.Phone, ErrorMessage = ValidationPatterns.PhoneMessage)]
        string? Phone,
    [Required, StringLength(150, MinimumLength = 3)] string Subject,
    [Required, StringLength(2000, MinimumLength = 10)] string Message,
    // خانة مخفية في الفورم: الناس ما بتملاهاش، فلو اتملت يبقى بوت
    string? Website = null
);
