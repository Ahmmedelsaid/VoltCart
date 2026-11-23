namespace VoltCart.Api.Dtos;

/// <summary>
/// ProductCount counts active products in the category and its direct children,
/// matching what the products endpoint returns for ?categoryId=.
/// </summary>
public record CategoryDto(
    int Id,
    string Name,
    string Slug,
    string? Description,
    string? ImageUrl,
    int? ParentId,
    int ProductCount
);
