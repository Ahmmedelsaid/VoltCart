namespace VoltCart.Api.Data;

/// <summary>
/// Real product photos (from Wikimedia Commons, used under free licences; authors and licences are listed in
/// web/public/images/products/real/credits.json and on the site's "Photo credits" page).
/// Products not listed here use a generated illustration.
/// </summary>
internal static class SeedPhotos
{
    public static readonly Dictionary<string, string> Files = new()
    {
        ["iphone-15-pro"] = "iphone-15-pro.jpg",
        ["oppo-find-x7-ultra"] = "oppo-find-x7-ultra.jpg",
        ["dell-xps-13"] = "dell-xps-13.jpg",
        ["hp-pavilion-15"] = "hp-pavilion-15.jpg",
        ["hp-elitebook-840"] = "hp-elitebook-840.jpg",
        ["airpods-pro-2"] = "airpods-pro-2.jpg",
        ["apple-watch-ultra-2"] = "apple-watch-ultra-2.jpg",
        ["garmin-forerunner-265"] = "garmin-forerunner-265.jpg",
        ["garmin-venu-3"] = "garmin-venu-3.jpg",
        ["nintendo-switch-oled"] = "nintendo-switch-oled.jpg",
        ["nintendo-switch-lite"] = "nintendo-switch-lite.jpg",
        ["samsung-45w-charger"] = "samsung-45w-charger.jpg",
        ["samsung-galaxy-smarttag2"] = "samsung-galaxy-smarttag2.jpg",
    };
}
