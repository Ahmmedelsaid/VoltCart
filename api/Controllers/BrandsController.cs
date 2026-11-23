using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VoltCart.Api.Data;
using VoltCart.Api.Dtos;

namespace VoltCart.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BrandsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<BrandDto>>> GetAll()
    {
        return await db
            .Brands.Where(b => b.IsActive)
            .OrderBy(b => b.Name)
            .Select(b => new BrandDto(
                b.Id,
                b.Name,
                b.Slug,
                b.Description,
                b.ImageUrl,
                b.Products.Count(p => p.IsActive)
            ))
            .ToListAsync();
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<BrandDto>> GetBrand(int id)
    {
        var brand = await db
            .Brands.Where(b => b.Id == id && b.IsActive)
            .Select(b => new BrandDto(
                b.Id,
                b.Name,
                b.Slug,
                b.Description,
                b.ImageUrl,
                b.Products.Count(p => p.IsActive)
            ))
            .FirstOrDefaultAsync();

        return brand is null ? NotFound() : brand;
    }
}
