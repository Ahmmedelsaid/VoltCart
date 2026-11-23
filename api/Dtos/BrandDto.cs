namespace VoltCart.Api.Dtos;

public record BrandDto(
    int Id,
    string Name,
    string Slug,
    string? Description,
    string? ImageUrl,
    int ProductCount
);
