using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VoltCart.Api.Data;
using VoltCart.Api.Dtos;
using VoltCart.Api.Models;

namespace VoltCart.Api.Controllers;

/// <summary>The signed-in customer's cart. Every action works on the caller's own cart only.</summary>
[ApiController]
[Authorize]
[Route("api/[controller]")]
public class CartController(AppDbContext db, TimeProvider clock) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<CartDto>> Get() =>
        UserId is { } userId ? await BuildCartAsync(userId) : Unauthorized();

    [HttpPost("items")]
    public async Task<ActionResult<CartDto>> Add(AddCartItemDto dto)
    {
        if (UserId is not { } userId)
            return Unauthorized();

        // مرة تانية لو طلبين "أضف" متزامنين خسر التاني على الـ unique index
        for (var attempt = 0; attempt < 2; attempt++)
        {
            var product = await db
                .Products.AsNoTracking()
                .Where(p => p.Id == dto.ProductId && p.IsActive)
                .Select(p => new { p.Id, p.StockQuantity })
                .FirstOrDefaultAsync();
            if (product is null)
                return Problem(
                    detail: "This product does not exist or is no longer available.",
                    statusCode: StatusCodes.Status404NotFound
                );

            var item = await db.CartItems.FirstOrDefaultAsync(c =>
                c.UserId == userId && c.ProductId == product.Id
            );
            var quantity = Math.Min(
                (item?.Quantity ?? 0) + dto.Quantity,
                CartRules.MaxQuantityPerItem
            );
            if (quantity > product.StockQuantity)
                return NotEnoughStock(product.StockQuantity);

            var now = clock.GetUtcNow().UtcDateTime;
            if (item is null)
                db.CartItems.Add(
                    new CartItem
                    {
                        UserId = userId,
                        ProductId = product.Id,
                        Quantity = quantity,
                        CreatedAt = now,
                        UpdatedAt = now,
                    }
                );
            else
            {
                item.Quantity = quantity;
                item.UpdatedAt = now;
            }

            try
            {
                await db.SaveChangesAsync();
                break;
            }
            catch (DbUpdateException) when (attempt == 0)
            {
                db.ChangeTracker.Clear();
            }
        }

        return await BuildCartAsync(userId);
    }

    [HttpPut("items/{productId:int}")]
    public async Task<ActionResult<CartDto>> SetQuantity(int productId, UpdateCartItemDto dto)
    {
        if (UserId is not { } userId)
            return Unauthorized();

        var item = await db
            .CartItems.Include(c => c.Product)
            .FirstOrDefaultAsync(c => c.UserId == userId && c.ProductId == productId);
        if (item is null)
            return Problem(
                detail: "This product is not in your cart.",
                statusCode: StatusCodes.Status404NotFound
            );

        var stock = item.Product is { IsActive: true } ? item.Product.StockQuantity : 0;
        if (dto.Quantity > stock)
            return NotEnoughStock(stock);

        item.Quantity = dto.Quantity;
        item.UpdatedAt = clock.GetUtcNow().UtcDateTime;
        await db.SaveChangesAsync();

        return await BuildCartAsync(userId);
    }

    [HttpDelete("items/{productId:int}")]
    public async Task<ActionResult<CartDto>> Remove(int productId)
    {
        if (UserId is not { } userId)
            return Unauthorized();

        // لو المنتج مش في السلة النتيجة نفسها (idempotent)
        await db
            .CartItems.Where(c => c.UserId == userId && c.ProductId == productId)
            .ExecuteDeleteAsync();
        return await BuildCartAsync(userId);
    }

    [HttpDelete]
    public async Task<ActionResult<CartDto>> Clear()
    {
        if (UserId is not { } userId)
            return Unauthorized();

        await db.CartItems.Where(c => c.UserId == userId).ExecuteDeleteAsync();
        return await BuildCartAsync(userId);
    }

    private int? UserId => int.TryParse(User.FindFirst("sub")?.Value, out var id) ? id : null;

    private ObjectResult NotEnoughStock(int available) =>
        Problem(
            detail: available == 0
                ? "This product is out of stock."
                : $"Only {available} left in stock.",
            statusCode: StatusCodes.Status409Conflict
        );

    private async Task<CartDto> BuildCartAsync(int userId)
    {
        var items = await db
            .CartItems.AsNoTracking()
            .Where(c => c.UserId == userId)
            .OrderBy(c => c.Id)
            .Select(c => new CartItemDto(
                c.ProductId,
                c.Product!.Name,
                c.Product.ImageUrl,
                c.Product.Brand!.Name,
                c.Product.Price,
                c.Quantity,
                c.Product.StockQuantity,
                c.Product.Price * c.Quantity,
                c.Product.IsActive && c.Product.StockQuantity >= c.Quantity
            ))
            .ToListAsync();

        // بنحسب إجمالي السطر هنا مش في SQL، عشان الـ decimal ما يطلعش بكسور زيادة
        items = items.Select(i => i with { LineTotal = i.UnitPrice * i.Quantity }).ToList();

        var subtotal = items.Where(i => i.IsAvailable).Sum(i => i.LineTotal);
        return new CartDto(items, items.Sum(i => i.Quantity), subtotal);
    }
}
