namespace VoltCart.Api.Dtos;

public record CartItemDto(
    int ProductId,
    string Name,
    string? ImageUrl,
    string BrandName,
    decimal UnitPrice,
    int Quantity,
    int StockQuantity,
    decimal LineTotal,
    // false لو المنتج اتخفى أو المخزون أقل من الكمية: بنعرضه بس مش بنحسبه في الإجمالي
    bool IsAvailable
);

public record CartDto(IReadOnlyList<CartItemDto> Items, int ItemCount, decimal Subtotal);
