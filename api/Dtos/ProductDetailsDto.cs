namespace VoltCart.Api.Dtos;

public record ProductDetailsDto(
    int Id,
    string Name,
    string Slug,
    string Sku,
    string? Description,
    string? ImageUrl,
    decimal Price,
    int StockQuantity,
    bool IsActive,
    Dictionary<string, string> Specs,
    string CategoryName,
    string BrandName,
    DateTime CreatedAt,
    DateTime UpdatedAt
);
