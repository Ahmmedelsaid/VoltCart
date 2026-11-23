using System.ComponentModel.DataAnnotations;
using VoltCart.Api.Models;

namespace VoltCart.Api.Dtos;

public record PlaceOrderDto(
    [Required, StringLength(100, MinimumLength = 2)] string ShippingName,
    [
        Required,
        RegularExpression(ValidationPatterns.Phone, ErrorMessage = ValidationPatterns.PhoneMessage)
    ]
        string Phone,
    [Required, StringLength(300, MinimumLength = 5)] string Address,
    [Required, StringLength(100, MinimumLength = 2)] string City,
    [StringLength(500)] string? Notes
);

public record OrderItemDto(
    int ProductId,
    string Name,
    string? ImageUrl,
    decimal UnitPrice,
    int Quantity,
    decimal LineTotal
);

public record OrderDto(
    int Id,
    string Status,
    decimal Total,
    int ItemCount,
    DateTime CreatedAt,
    DateTime? CancelledAt,
    string ShippingName,
    string Phone,
    string Address,
    string City,
    string? Notes,
    IReadOnlyList<OrderItemDto> Items
)
{
    public static OrderDto From(Order order) =>
        new(
            order.Id,
            order.Status.ToString(),
            order.Total,
            order.Items.Sum(i => i.Quantity),
            order.CreatedAt,
            order.CancelledAt,
            order.ShippingName,
            order.Phone,
            order.Address,
            order.City,
            order.Notes,
            order
                .Items.Select(i => new OrderItemDto(
                    i.ProductId,
                    i.ProductName,
                    i.ImageUrl,
                    i.UnitPrice,
                    i.Quantity,
                    i.UnitPrice * i.Quantity
                ))
                .ToList()
        );
}

/// <summary>A row of the order history: a few thumbnails instead of every line.</summary>
public record OrderSummaryDto(
    int Id,
    string Status,
    decimal Total,
    int ItemCount,
    DateTime CreatedAt,
    IReadOnlyList<string> ImageUrls
);
