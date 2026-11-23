using System.ComponentModel.DataAnnotations;

namespace VoltCart.Api.Dtos;

public record RegisterDto(
    [Required, EmailAddress, StringLength(254)] string Email,
    [
        Required,
        StringLength(100, MinimumLength = 8),
        RegularExpression(
            ValidationPatterns.Password,
            ErrorMessage = ValidationPatterns.PasswordMessage
        )
    ]
        string Password,
    [Required, StringLength(100, MinimumLength = 2)] string FullName
);
