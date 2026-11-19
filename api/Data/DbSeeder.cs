using Microsoft.EntityFrameworkCore;
using VoltCart.Api.Models;

namespace VoltCart.Api.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        if (await db.Brands.AnyAsync())
            return;

        var samsung = new Brand { Name = "Samsung", Slug = "samsung" };
        var apple = new Brand { Name = "Apple", Slug = "apple" };
        var sony = new Brand { Name = "Sony", Slug = "sony" };
        var logitech = new Brand { Name = "Logitech", Slug = "logitech" };

        var electronics = new Category { Name = "Electronics", Slug = "electronics" };
        var phones = new Category
        {
            Name = "Phones",
            Slug = "phones",
            Parent = electronics,
        };
        var laptops = new Category
        {
            Name = "Laptops",
            Slug = "laptops",
            Parent = electronics,
        };
        var audio = new Category
        {
            Name = "Audio",
            Slug = "audio",
            Parent = electronics,
        };
        var accessories = new Category
        {
            Name = "Accessories",
            Slug = "accessories",
            Parent = electronics,
        };

        db.Brands.AddRange(samsung, apple, sony, logitech);
        db.Categories.AddRange(electronics, phones, laptops, audio, accessories);

        db.Products.AddRange(
            new Product
            {
                Name = "Samsung Galaxy S24",
                Sku = "SAM-S24-128",
                Slug = "samsung-galaxy-s24",
                Description = "Flagship Android phone with a 6.2-inch AMOLED display.",
                Price = 35000m,
                StockQuantity = 20,
                IsActive = true,
                Category = phones,
                Brand = samsung,
                Specs = new()
                {
                    ["ram"] = "8GB",
                    ["storage"] = "128GB",
                    ["screen"] = "6.2 inch",
                },
            },
            new Product
            {
                Name = "iPhone 15",
                Sku = "APL-IP15-128",
                Slug = "iphone-15",
                Description = "Apple iPhone 15 with the A16 Bionic chip.",
                Price = 42000m,
                StockQuantity = 15,
                IsActive = true,
                Category = phones,
                Brand = apple,
                Specs = new()
                {
                    ["ram"] = "6GB",
                    ["storage"] = "128GB",
                    ["screen"] = "6.1 inch",
                },
            },
            new Product
            {
                Name = "MacBook Air M2",
                Sku = "APL-MBA-M2-256",
                Slug = "macbook-air-m2",
                Description = "Thin and light laptop powered by the Apple M2 chip.",
                Price = 58000m,
                StockQuantity = 8,
                IsActive = true,
                Category = laptops,
                Brand = apple,
                Specs = new()
                {
                    ["ram"] = "8GB",
                    ["storage"] = "256GB SSD",
                    ["screen"] = "13.6 inch",
                },
            },
            new Product
            {
                Name = "Samsung Galaxy Book3",
                Sku = "SAM-BOOK3-512",
                Slug = "samsung-galaxy-book3",
                Description = "Everyday laptop with a 15.6-inch Full HD display.",
                Price = 29000m,
                StockQuantity = 12,
                IsActive = true,
                Category = laptops,
                Brand = samsung,
                Specs = new()
                {
                    ["ram"] = "16GB",
                    ["storage"] = "512GB SSD",
                    ["screen"] = "15.6 inch",
                },
            },
            new Product
            {
                Name = "Sony WH-1000XM5",
                Sku = "SNY-WH1000XM5",
                Slug = "sony-wh-1000xm5",
                Description =
                    "Wireless over-ear headphones with industry-leading noise cancelling.",
                Price = 14500m,
                StockQuantity = 25,
                IsActive = true,
                Category = audio,
                Brand = sony,
                Specs = new()
                {
                    ["type"] = "Over-ear",
                    ["battery"] = "30 hours",
                    ["noise_cancelling"] = "Yes",
                },
            },
            new Product
            {
                Name = "Sony WF-1000XM5",
                Sku = "SNY-WF1000XM5",
                Slug = "sony-wf-1000xm5",
                Description = "True wireless earbuds with active noise cancelling.",
                Price = 11000m,
                StockQuantity = 30,
                IsActive = true,
                Category = audio,
                Brand = sony,
                Specs = new()
                {
                    ["type"] = "In-ear",
                    ["battery"] = "8 hours",
                    ["noise_cancelling"] = "Yes",
                },
            },
            new Product
            {
                Name = "Logitech MX Master 3S",
                Sku = "LOG-MXM3S",
                Slug = "logitech-mx-master-3s",
                Description = "Ergonomic wireless mouse for productivity.",
                Price = 4200m,
                StockQuantity = 40,
                IsActive = true,
                Category = accessories,
                Brand = logitech,
                Specs = new() { ["connection"] = "Bluetooth / USB receiver", ["dpi"] = "8000" },
            },
            new Product
            {
                Name = "Logitech MX Keys",
                Sku = "LOG-MXKEYS",
                Slug = "logitech-mx-keys",
                Description = "Illuminated wireless keyboard with smart backlighting.",
                Price = 4800m,
                StockQuantity = 0,
                IsActive = false,
                Category = accessories,
                Brand = logitech,
                Specs = new() { ["connection"] = "Bluetooth / USB receiver", ["layout"] = "Full" },
            }
        );

        await db.SaveChangesAsync();
    }
}
