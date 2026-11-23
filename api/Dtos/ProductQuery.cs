using System.ComponentModel.DataAnnotations;

namespace VoltCart.Api.Dtos;

/// <summary>
/// Query-string parameters for GET /api/products.
/// Example: ?search=sony&amp;categoryId=3&amp;sort=price_desc&amp;page=2&amp;pageSize=12
/// </summary>
public class ProductQuery
{
    [StringLength(100)]
    public string? Search { get; set; }

    public int? CategoryId { get; set; }

    public int? BrandId { get; set; }

    [Range(0, 1_000_000)]
    public decimal? MinPrice { get; set; }

    [Range(0, 1_000_000)]
    public decimal? MaxPrice { get; set; }

    /// <summary>price_asc | price_desc | name | newest (default: id)</summary>
    public string? Sort { get; set; }

    [Range(1, int.MaxValue)]
    public int Page { get; set; } = 1;

    [Range(1, 50)]
    public int PageSize { get; set; } = 12;
}
