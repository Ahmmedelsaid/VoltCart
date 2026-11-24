using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using VoltCart.Api.Data;
using VoltCart.Api.Dtos;
using VoltCart.Api.Models;
using VoltCart.Api.Services;

namespace VoltCart.Api.Controllers;

/// <summary>The signed-in customer's orders. Payment is cash on delivery, so placing an order needs no payment step.</summary>
[ApiController]
[Authorize]
[Route("api/[controller]")]
public class OrdersController(
    AppDbContext db,
    TimeProvider clock,
    IEmailQueue emails,
    IOptions<EmailOptions> emailOptions,
    ILogger<OrdersController> logger
) : ControllerBase
{
    private const int ThumbnailsPerOrder = 3;

    [HttpGet]
    public async Task<ActionResult<List<OrderSummaryDto>>> List()
    {
        if (UserId is not { } userId)
            return Unauthorized();

        var orders = await db
            .Orders.AsNoTracking()
            .Where(o => o.UserId == userId)
            .OrderByDescending(o => o.CreatedAt)
            .ThenByDescending(o => o.Id)
            .Select(o => new
            {
                o.Id,
                o.Status,
                o.Total,
                o.CreatedAt,
                ItemCount = o.Items.Sum(i => i.Quantity),
                ImageUrls = o
                    .Items.OrderBy(i => i.Id)
                    .Where(i => i.ImageUrl != null)
                    .Select(i => i.ImageUrl!)
                    .Take(ThumbnailsPerOrder)
                    .ToList(),
            })
            .ToListAsync();

        return orders
            .Select(o => new OrderSummaryDto(
                o.Id,
                o.Status.ToString(),
                o.Total,
                o.ItemCount,
                o.CreatedAt,
                o.ImageUrls
            ))
            .ToList();
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<OrderDto>> Get(int id)
    {
        if (UserId is not { } userId)
            return Unauthorized();

        // طلب عميل تاني بيرجّع 404 زي الطلب غير الموجود: ما نكشفش إنه موجود
        var order = await db
            .Orders.AsNoTracking()
            .Include(o => o.Items.OrderBy(i => i.Id))
            .FirstOrDefaultAsync(o => o.Id == id && o.UserId == userId);

        return order is null ? NotFoundOrder() : OrderDto.From(order);
    }

    /// <summary>Turns the caller's cart into an order, takes the items out of stock and empties the cart, all or nothing.</summary>
    [HttpPost]
    public async Task<ActionResult<OrderDto>> Place(PlaceOrderDto dto)
    {
        if (UserId is not { } userId)
            return Unauthorized();

        // الدبوس إما إحداثيتين مع بعض أو مفيش
        if (dto.Latitude.HasValue != dto.Longitude.HasValue)
            return Problem(
                detail: "Send both latitude and longitude, or neither.",
                statusCode: StatusCodes.Status400BadRequest
            );

        var cart = await db
            .CartItems.Include(c => c.Product)
            .Where(c => c.UserId == userId)
            .OrderBy(c => c.Id)
            .ToListAsync();

        if (cart.Count == 0)
            return Problem(
                detail: "Your cart is empty.",
                statusCode: StatusCodes.Status400BadRequest
            );

        foreach (var item in cart)
        {
            if (item.Product is not { IsActive: true })
                return ConflictProblem($"\"{item.Product?.Name}\" is no longer available.");
            if (item.Quantity > item.Product.StockQuantity)
                return ConflictProblem(StockMessage(item.Product.Name, item.Product.StockQuantity));
        }

        var now = clock.GetUtcNow().UtcDateTime;
        await using var transaction = await db.Database.BeginTransactionAsync();

        foreach (var item in cart)
        {
            // الخصم شرطي في الـ database نفسه: لو عميلين طلبوا آخر قطعة، واحد بس ينجح
            var quantity = item.Quantity;
            var updated = await db
                .Products.Where(p =>
                    p.Id == item.ProductId && p.IsActive && p.StockQuantity >= quantity
                )
                .ExecuteUpdateAsync(set =>
                    set.SetProperty(p => p.StockQuantity, p => p.StockQuantity - quantity)
                        .SetProperty(p => p.UpdatedAt, now)
                );

            if (updated == 0)
            {
                await transaction.RollbackAsync();
                return ConflictProblem(
                    $"\"{item.Product!.Name}\" just sold out or its stock changed. Please review your cart."
                );
            }
        }

        var order = new Order
        {
            UserId = userId,
            ShippingName = dto.ShippingName.Trim(),
            Phone = dto.Phone.Trim(),
            Address = dto.Address.Trim(),
            City = dto.City.Trim(),
            Latitude = dto.Latitude,
            Longitude = dto.Longitude,
            Notes = string.IsNullOrWhiteSpace(dto.Notes) ? null : dto.Notes.Trim(),
            CreatedAt = now,
            // السعر بيتاخد من الـ database دلوقتي، مش من اللي العميل شافه في السلة
            Items =
            [
                .. cart.Select(c => new OrderItem
                {
                    ProductId = c.ProductId,
                    ProductName = c.Product!.Name,
                    ImageUrl = c.Product.ImageUrl,
                    UnitPrice = c.Product.Price,
                    Quantity = c.Quantity,
                }),
            ],
        };
        order.Total = order.Items.Sum(i => i.UnitPrice * i.Quantity);

        db.Orders.Add(order);
        db.CartItems.RemoveRange(cart);
        await db.SaveChangesAsync();
        await transaction.CommitAsync();

        await NotifyAsync(order);

        return CreatedAtAction(nameof(Get), new { id = order.Id }, OrderDto.From(order));
    }

    /// <summary>
    /// Emails a confirmation to the customer and an alert to the shop. The order is already saved, so a problem
    /// here is only logged: it must never turn a successful order into an error.
    /// </summary>
    private async Task NotifyAsync(Order order)
    {
        if (!emails.Enabled)
            return;

        try
        {
            var settings = emailOptions.Value;
            var customer = await db
                .Users.AsNoTracking()
                .Where(u => u.Id == order.UserId)
                .Select(u => new { u.Email, u.FullName })
                .FirstOrDefaultAsync();
            if (customer is null)
                return;

            await emails.EnqueueAsync(
                OrderEmails.ForCustomer(order, customer.Email, customer.FullName, settings.WebUrl)
            );

            if (settings.ShopRecipient is { Length: > 0 } shop)
                await emails.EnqueueAsync(OrderEmails.ForShop(order, shop, customer.Email));
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Could not queue the emails for order {OrderId}", order.Id);
        }
    }

    /// <summary>Cancels an order that has not been handled yet and puts its items back in stock.</summary>
    [HttpPost("{id:int}/cancel")]
    public async Task<ActionResult<OrderDto>> Cancel(int id)
    {
        if (UserId is not { } userId)
            return Unauthorized();

        var order = await db
            .Orders.AsNoTracking()
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id && o.UserId == userId);
        if (order is null)
            return NotFoundOrder();

        var now = clock.GetUtcNow().UtcDateTime;
        await using var transaction = await db.Database.BeginTransactionAsync();

        // التغيير شرطي على الحالة: لو الإلغاء اتبعت مرتين، المخزون يرجع مرة واحدة بس
        var cancelled = await db
            .Orders.Where(o => o.Id == id && o.UserId == userId && o.Status == OrderStatus.Placed)
            .ExecuteUpdateAsync(set =>
                set.SetProperty(o => o.Status, OrderStatus.Cancelled)
                    .SetProperty(o => o.CancelledAt, now)
            );
        if (cancelled == 0)
        {
            await transaction.RollbackAsync();
            return ConflictProblem("This order can no longer be cancelled.");
        }

        foreach (var item in order.Items)
        {
            var quantity = item.Quantity;
            await db
                .Products.Where(p => p.Id == item.ProductId)
                .ExecuteUpdateAsync(set =>
                    set.SetProperty(p => p.StockQuantity, p => p.StockQuantity + quantity)
                        .SetProperty(p => p.UpdatedAt, now)
                );
        }

        await transaction.CommitAsync();

        order.Status = OrderStatus.Cancelled;
        order.CancelledAt = now;
        return OrderDto.From(order);
    }

    private int? UserId => int.TryParse(User.FindFirst("sub")?.Value, out var id) ? id : null;

    private ObjectResult ConflictProblem(string detail) =>
        Problem(detail: detail, statusCode: StatusCodes.Status409Conflict);

    private ObjectResult NotFoundOrder() =>
        Problem(detail: "Order not found.", statusCode: StatusCodes.Status404NotFound);

    private static string StockMessage(string name, int available) =>
        available == 0
            ? $"\"{name}\" is out of stock."
            : $"Only {available} of \"{name}\" left in stock.";
}
