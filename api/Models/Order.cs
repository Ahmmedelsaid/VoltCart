namespace VoltCart.Api.Models;

public enum OrderStatus
{
    /// <summary>The customer placed the order and it is waiting to be handled (pay on delivery).</summary>
    Placed,
    Cancelled,
}

public class Order
{
    public int Id { get; set; }

    public int UserId { get; set; }
    public User? User { get; set; }

    public OrderStatus Status { get; set; } = OrderStatus.Placed;

    // بيانات التوصيل بتتخزن مع الطلب (مش مربوطة بالـ User) عشان تفضل زي ما كانت وقت الطلب
    public required string ShippingName { get; set; }
    public required string Phone { get; set; }
    public required string Address { get; set; }
    public required string City { get; set; }
    public string? Notes { get; set; }

    public decimal Total { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CancelledAt { get; set; }

    public List<OrderItem> Items { get; set; } = [];
}

/// <summary>A product line of an order. Name and price are copied, so later catalog edits do not change old orders.</summary>
public class OrderItem
{
    public int Id { get; set; }

    public int OrderId { get; set; }
    public Order? Order { get; set; }

    public int ProductId { get; set; }
    public Product? Product { get; set; }

    public required string ProductName { get; set; }
    public string? ImageUrl { get; set; }
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
}
