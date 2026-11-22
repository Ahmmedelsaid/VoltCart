namespace VoltCart.Api.Models;

public class Category
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public required string Slug { get; set; }
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsActive { get; set; }

    public int? ParentId { get; set; }

    public Category? Parent { get; set; }
    public ICollection<Product> Products { get; set; } = new List<Product>();

    public ICollection<Category> Children { get; set; } = new List<Category>();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
