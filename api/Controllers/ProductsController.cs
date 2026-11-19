using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VoltCart.Api.Data;
using VoltCart.Api.Dtos;

namespace VoltCart.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<ProductListDto>>> GetAll()
    {
        return await db
            .Products.Where(p => p.IsActive)
            .Select(p => new ProductListDto(
                p.Id,
                p.Name,
                p.Slug,
                p.Price,
                p.ImageUrl,
                p.Brand!.Name,
                p.Category!.Name
            ))
            .ToListAsync();
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ProductDetailsDto>> GetProduct(int id)
    {
        var product = await db
            .Products.Where(p => p.Id == id && p.IsActive)
            .Select(p => new ProductDetailsDto(
                p.Id,
                p.Name,
                p.Slug,
                p.Sku,
                p.Description,
                p.ImageUrl,
                p.Price,
                p.StockQuantity,
                p.IsActive,
                p.Specs,
                p.Category!.Name,
                p.Brand!.Name,
                p.CreatedAt,
                p.UpdatedAt
            ))
            .FirstOrDefaultAsync();

        return product is null ? NotFound() : product;
    }
}
