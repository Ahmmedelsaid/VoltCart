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
    public async Task<ActionResult<PagedResult<ProductListDto>>> GetAll(
        [FromQuery] ProductQuery query
    )
    {
        if (query.MinPrice > query.MaxPrice)
            return BadRequest("minPrice cannot be greater than maxPrice.");

        // 1) الفلاتر: كل شرط بيتضاف بس لو العميل بعته
        var products = db.Products.Where(p => p.IsActive);

        if (!string.IsNullOrWhiteSpace(query.Search))
            products = products.Where(p => p.Name.Contains(query.Search));

        if (query.CategoryId is not null)
            // التصنيف نفسه أو أي فرع مباشر تحته (Electronics -> Phones)
            products = products.Where(p =>
                p.CategoryId == query.CategoryId || p.Category!.ParentId == query.CategoryId
            );

        if (query.BrandId is not null)
            products = products.Where(p => p.BrandId == query.BrandId);

        if (query.MinPrice is not null)
            products = products.Where(p => p.Price >= query.MinPrice);

        if (query.MaxPrice is not null)
            products = products.Where(p => p.Price <= query.MaxPrice);

        // 2) العدد الكلي (بعد الفلاتر وقبل الـ pagination)
        var totalCount = await products.CountAsync();

        // 3) الترتيب. الـ ThenBy(Id) بيثبّت الترتيب عشان الصفحات ما تتلخبطش
        IOrderedQueryable<Models.Product> ordered = query.Sort switch
        {
            "price_asc" => products.OrderBy(p => p.Price),
            "price_desc" => products.OrderByDescending(p => p.Price),
            "name" => products.OrderBy(p => p.Name),
            "newest" => products.OrderByDescending(p => p.CreatedAt),
            _ => products.OrderBy(p => p.Id),
        };

        // 4) الصفحة المطلوبة بس، محوّلة لـ DTO
        var items = await ordered
            .ThenBy(p => p.Id)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
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

        return new PagedResult<ProductListDto>(items, totalCount, query.Page, query.PageSize);
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
