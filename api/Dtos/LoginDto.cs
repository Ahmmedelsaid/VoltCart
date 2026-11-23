using System.ComponentModel.DataAnnotations;

namespace VoltCart.Api.Dtos;

public record LoginDto(
    [Required, EmailAddress, StringLength(254)] string Email,
    [Required, StringLength(100)] string Password
);
