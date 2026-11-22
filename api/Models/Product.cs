namespace VoltCart.Api.Models;

public class Product
{
    public int Id { get; set; }
    public required string Name { get; set; }

    public required string Sku { get; set; }

    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public required string Slug { get; set; }

    public decimal Price { get; set; }
    public int StockQuantity { get; set; }
    public int CategoryId { get; set; }
    public int BrandId { get; set; }

    public Category? Category { get; set; }
    public Brand? Brand { get; set; }

    public bool IsActive { get; set; }

    public Dictionary<string, string> Specs { get; set; } = new();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
