using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VoltCart.Api.Data;
using VoltCart.Api.Dtos;

namespace VoltCart.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<CategoryDto>>> GetAll()
    {
        return await db
            .Categories.Where(c => c.IsActive)
            .OrderBy(c => c.Name)
            .Select(c => new CategoryDto(
                c.Id,
                c.Name,
                c.Slug,
                c.Description,
                c.ImageUrl,
                c.ParentId,
                c.Products.Count(p => p.IsActive)
                    + c.Children.SelectMany(child => child.Products).Count(p => p.IsActive)
            ))
            .ToListAsync();
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<CategoryDto>> GetCategory(int id)
    {
        var category = await db
            .Categories.Where(c => c.Id == id && c.IsActive)
            .Select(c => new CategoryDto(
                c.Id,
                c.Name,
                c.Slug,
                c.Description,
                c.ImageUrl,
                c.ParentId,
                c.Products.Count(p => p.IsActive)
                    + c.Children.SelectMany(child => child.Products).Count(p => p.IsActive)
            ))
            .FirstOrDefaultAsync();

        return category is null ? NotFound() : category;
    }
}
