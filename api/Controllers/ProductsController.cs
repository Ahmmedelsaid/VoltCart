using System.Linq.Expressions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VoltCart.Api.Data;
using VoltCart.Api.Dtos;
using VoltCart.Api.Models;

namespace VoltCart.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController(AppDbContext db) : ControllerBase
{
    // نفس التحويل بيتستخدم في GET و POST، فكتبناه مرة واحدة
    private static readonly Expression<Func<Product, ProductDetailsDto>> ToDetails =
        p => new ProductDetailsDto(
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
        );

    [HttpGet]
    public async Task<ActionResult<PagedResult<ProductListDto>>> GetAll(
        [FromQuery] ProductQuery query
    )
    {
        if (query.MinPrice > query.MaxPrice)
        {
            ModelState.AddModelError(
                nameof(query.MinPrice),
                "MinPrice cannot be greater than MaxPrice."
            );
            return ValidationProblem(ModelState);
        }

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
        IOrderedQueryable<Product> ordered = query.Sort switch
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
            .Select(ToDetails)
            .FirstOrDefaultAsync();

        return product is null ? NotFound() : product;
    }

    [HttpPost]
    public async Task<ActionResult<ProductDetailsDto>> Create(CreateProductDto dto)
    {
        if (!await CategoryAndBrandExistAsync(dto.CategoryId, dto.BrandId))
            return ValidationProblem(ModelState);

        var conflict = await FindConflictAsync(dto.Slug, dto.Sku);
        if (conflict is not null)
            return Problem(detail: conflict, statusCode: StatusCodes.Status409Conflict);

        var product = new Product
        {
            Name = dto.Name,
            Slug = dto.Slug,
            Sku = dto.Sku,
            Description = dto.Description,
            ImageUrl = dto.ImageUrl,
            Price = dto.Price,
            StockQuantity = dto.StockQuantity,
            CategoryId = dto.CategoryId,
            BrandId = dto.BrandId,
            IsActive = dto.IsActive,
            Specs = dto.Specs ?? new(),
        };

        db.Products.Add(product);
        await db.SaveChangesAsync();

        var created = await db
            .Products.Where(p => p.Id == product.Id)
            .Select(ToDetails)
            .FirstAsync();

        // 201 Created + Location: /api/products/{id}
        return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UpdateProductDto dto)
    {
        // FindAsync هنا مناسب: محتاجين الـ entity نفسه عشان نعدّله ونحفظه
        var product = await db.Products.FindAsync(id);
        if (product is null)
            return NotFound();

        if (!await CategoryAndBrandExistAsync(dto.CategoryId, dto.BrandId))
            return ValidationProblem(ModelState);

        var conflict = await FindConflictAsync(dto.Slug, dto.Sku, excludeId: id);
        if (conflict is not null)
            return Problem(detail: conflict, statusCode: StatusCodes.Status409Conflict);

        product.Name = dto.Name;
        product.Slug = dto.Slug;
        product.Sku = dto.Sku;
        product.Description = dto.Description;
        product.ImageUrl = dto.ImageUrl;
        product.Price = dto.Price;
        product.StockQuantity = dto.StockQuantity;
        product.CategoryId = dto.CategoryId;
        product.BrandId = dto.BrandId;
        product.IsActive = dto.IsActive;
        product.Specs = dto.Specs ?? new();
        product.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return NoContent();
    }

    // Soft delete: بنخفي المنتج بدل ما نمسحه، عشان الطلبات القديمة (Orders) تفضل شايفاه
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var product = await db.Products.FindAsync(id);
        if (product is null)
            return NotFound();

        product.IsActive = false;
        product.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return NoContent();
    }

    private async Task<bool> CategoryAndBrandExistAsync(int categoryId, int brandId)
    {
        if (!await db.Categories.AnyAsync(c => c.Id == categoryId))
            ModelState.AddModelError("CategoryId", "Category does not exist.");

        if (!await db.Brands.AnyAsync(b => b.Id == brandId))
            ModelState.AddModelError("BrandId", "Brand does not exist.");

        return ModelState.IsValid;
    }

    private async Task<string?> FindConflictAsync(string slug, string sku, int? excludeId = null)
    {
        if (await db.Products.AnyAsync(p => p.Slug == slug && p.Id != excludeId))
            return $"Slug '{slug}' is already used by another product.";

        if (await db.Products.AnyAsync(p => p.Sku == sku && p.Id != excludeId))
            return $"SKU '{sku}' is already used by another product.";

        return null;
    }
}
