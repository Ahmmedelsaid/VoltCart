namespace VoltCart.Api.Dtos;

public record ProductListDto(
    int Id,
    string Name,
    string Slug,
    decimal Price,
    string? ImageUrl,
    string BrandName,
    string CategoryName
);
