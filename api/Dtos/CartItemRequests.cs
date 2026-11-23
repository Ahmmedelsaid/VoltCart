using System.ComponentModel.DataAnnotations;

namespace VoltCart.Api.Dtos;

public static class CartRules
{
    /// <summary>Most units of one product a customer can hold in the cart.</summary>
    public const int MaxQuantityPerItem = 10;
}

public record AddCartItemDto(
    [Range(1, int.MaxValue)] int ProductId,
    [Range(1, CartRules.MaxQuantityPerItem)] int Quantity = 1
);

public record UpdateCartItemDto([Range(1, CartRules.MaxQuantityPerItem)] int Quantity);
