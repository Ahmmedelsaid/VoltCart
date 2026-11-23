using System.ComponentModel.DataAnnotations;

namespace VoltCart.Api.Dtos;

/// <summary>Full replacement of the editable fields (PUT semantics).</summary>
public record UpdateProductDto(
    [Required, StringLength(200, MinimumLength = 3)] string Name,
    [
        Required,
        StringLength(220, MinimumLength = 3),
        RegularExpression(ValidationPatterns.Slug, ErrorMessage = ValidationPatterns.SlugMessage)
    ]
        string Slug,
    [Required, StringLength(50, MinimumLength = 3)] string Sku,
    [StringLength(2000)] string? Description,
    [StringLength(500)] string? ImageUrl,
    [Range(typeof(decimal), "0.01", "1000000")] decimal Price,
    [Range(0, int.MaxValue)] int StockQuantity,
    [Range(1, int.MaxValue)] int CategoryId,
    [Range(1, int.MaxValue)] int BrandId,
    bool IsActive,
    Dictionary<string, string>? Specs
);
