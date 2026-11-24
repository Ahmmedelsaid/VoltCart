namespace VoltCart.Api.Data;

/// <summary>One row of the demo catalogue, before it becomes a <c>Product</c>.</summary>
internal sealed record SeedProduct(
    string CategorySlug,
    string Brand,
    string Name,
    decimal Price,
    int Stock,
    string? ImageUrl,
    string Sku,
    string Slug,
    string Description,
    Dictionary<string, string> Specs,
    bool IsActive
);

/// <summary>
/// Demo catalogue (prices in EGP are made up but realistic). One product per line:
/// Category | Brand | Name | Price | Stock | Image | SKU | Description | Specs (k=v;k=v) | Flags.
/// Image is a file under /images/products (has a dot) or a generated illustration like "phone-blue".
/// SKU may be empty (it is then derived from the name). Flags: "inactive".
/// </summary>
internal static class SeedCatalog
{
    public static readonly (string Name, string Slug)[] Categories =
    [
        ("Phones", "phones"),
        ("Laptops", "laptops"),
        ("Tablets", "tablets"),
        ("Audio", "audio"),
        ("Wearables", "wearables"),
        ("Gaming", "gaming"),
        ("TVs & Displays", "tvs-displays"),
        ("Accessories", "accessories"),
        ("Cameras", "cameras"),
    ];

    public static List<SeedProduct> Products() => [.. Parse(Table)];

    private static IEnumerable<SeedProduct> Parse(string table)
    {
        foreach (
            var line in table.Split(
                '\n',
                StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries
            )
        )
        {
            if (line.StartsWith('#'))
                continue;

            var c = line.Split('|', StringSplitOptions.TrimEntries);
            var name = c[2];
            var slug = Slugify(name);

            var image = c[5];
            var imageUrl =
                image.Length == 0 ? null
                : image.Contains('.') ? $"/images/products/{image}"
                : $"/images/products/generated/{image}.svg";

            // صورة حقيقية (SeedPhotos) أحسن من الرسمة، بس ما تغطيش صورة محددة بالاسم في الجدول
            if (
                (imageUrl is null || imageUrl.Contains("/generated/"))
                && SeedPhotos.Files.TryGetValue(slug, out var photo)
            )
                imageUrl = $"/images/products/real/{photo}";

            var sku = c[6].Length > 0 ? c[6] : slug.ToUpperInvariant();
            if (sku.Length > 50)
                sku = sku[..50].TrimEnd('-');

            var specs = c[8]
                .Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(pair => pair.Split('=', 2))
                .ToDictionary(pair => pair[0], pair => pair[1]);

            yield return new SeedProduct(
                CategorySlug: c[0],
                Brand: c[1],
                Name: name,
                Price: decimal.Parse(c[3], System.Globalization.CultureInfo.InvariantCulture),
                Stock: int.Parse(c[4]),
                ImageUrl: imageUrl,
                Sku: sku,
                Slug: slug,
                Description: c[7],
                Specs: specs,
                IsActive: !(c.Length > 9 && c[9] == "inactive")
            );
        }
    }

    public static string Slugify(string text)
    {
        var chars = text.ToLowerInvariant()
            .Select(ch => char.IsAsciiLetterOrDigit(ch) ? ch : '-')
            .ToArray();
        return string.Join(
            '-',
            new string(chars).Split('-', StringSplitOptions.RemoveEmptyEntries)
        );
    }

    private const string Table = """
        # ---------- Phones ----------
        phones|Samsung|Samsung Galaxy S24|35000|20|samsung-galaxy-s24.jpg|SAM-S24-128|Flagship Android phone with a 6.2-inch AMOLED display.|ram=8GB;storage=128GB;screen=6.2 inch
        phones|Apple|iPhone 15|42000|15|iphone-15.webp|APL-IP15-128|Apple iPhone 15 with the A16 Bionic chip.|ram=6GB;storage=128GB;screen=6.1 inch
        phones|Samsung|Samsung Galaxy S24 Ultra|68000|10|phone-silver||Top Samsung phone with a built-in S Pen and a 200MP camera.|ram=12GB;storage=256GB;screen=6.8 inch
        phones|Samsung|Samsung Galaxy S24 FE|32000|18|phone-blue||Fan Edition flagship with a bright 120Hz AMOLED display.|ram=8GB;storage=128GB;screen=6.7 inch
        phones|Samsung|Samsung Galaxy A55|19500|35|phone-purple||Mid-range phone with a metal frame and a great camera.|ram=8GB;storage=256GB;screen=6.6 inch
        phones|Samsung|Samsung Galaxy A35|15500|40|phone-blue||Reliable everyday phone with long software support.|ram=8GB;storage=128GB;screen=6.6 inch
        phones|Samsung|Samsung Galaxy A15|8200|60|phone-black||Affordable phone with a big display and a 5000mAh battery.|ram=4GB;storage=128GB;screen=6.5 inch
        phones|Samsung|Samsung Galaxy Z Flip5|41000|6|phone-purple||Pocket-sized foldable with a flexible 6.7-inch screen.|ram=8GB;storage=256GB;screen=6.7 inch
        phones|Apple|iPhone 15 Pro|62000|9|phone-silver||Titanium design with the A17 Pro chip.|ram=8GB;storage=256GB;screen=6.1 inch
        phones|Apple|iPhone 15 Pro Max|72000|7|phone-black||The biggest iPhone with a 5x telephoto camera.|ram=8GB;storage=256GB;screen=6.7 inch
        phones|Apple|iPhone 14|36000|12|phone-blue||Dependable iPhone with a dual camera system.|ram=6GB;storage=128GB;screen=6.1 inch
        phones|Apple|iPhone 13|29000|14|phone-black||Still a great iPhone with the A15 Bionic chip.|ram=4GB;storage=128GB;screen=6.1 inch
        phones|Xiaomi|Xiaomi 14|38000|11|phone-black||Compact flagship with Leica optics.|ram=12GB;storage=256GB;screen=6.36 inch
        phones|Xiaomi|Xiaomi Redmi Note 13 Pro|13500|45|phone-blue||200MP camera and 67W fast charging.|ram=8GB;storage=256GB;screen=6.67 inch
        phones|Xiaomi|Xiaomi Redmi Note 13|9800|55|phone-green||Big AMOLED display at an easy price.|ram=6GB;storage=128GB;screen=6.67 inch
        phones|Xiaomi|Xiaomi Redmi 13C|5200|70|phone-black||Budget phone with a large battery.|ram=4GB;storage=128GB;screen=6.74 inch
        phones|Xiaomi|POCO X6 Pro|14500|30|phone-gold||Performance phone with a Dimensity 8300 chip.|ram=8GB;storage=256GB;screen=6.67 inch
        phones|Xiaomi|POCO F6|18900|25|phone-green||Gaming-ready phone with a Snapdragon 8s Gen 3.|ram=12GB;storage=256GB;screen=6.67 inch
        phones|Oppo|Oppo Reno11|17500|22|phone-green||Slim phone with a portrait-focused camera.|ram=8GB;storage=256GB;screen=6.7 inch
        phones|Oppo|Oppo A78|8900|38|phone-black||Smooth 90Hz display and 33W charging.|ram=8GB;storage=128GB;screen=6.43 inch
        phones|Oppo|Oppo Find X7 Ultra|52000|4|phone-black||Flagship with two periscope cameras.|ram=16GB;storage=512GB;screen=6.82 inch
        phones|Realme|Realme 12 Pro+|16800|26|phone-gold||Luxury watch-inspired design with a periscope lens.|ram=8GB;storage=256GB;screen=6.7 inch
        phones|Realme|Realme C67|6300|50|phone-green||108MP camera on a budget.|ram=6GB;storage=128GB;screen=6.72 inch
        phones|Realme|Realme GT 6|27500|13|phone-silver||Flagship-killer with 120W charging.|ram=12GB;storage=256GB;screen=6.78 inch
        phones|Infinix|Infinix Note 40 Pro|9700|42|phone-green||Wireless charging and a 108MP camera.|ram=8GB;storage=256GB;screen=6.78 inch
        phones|Infinix|Infinix Hot 40i|4400|80|phone-black||Simple, affordable and long-lasting.|ram=4GB;storage=128GB;screen=6.56 inch
        phones|Infinix|Infinix Zero 30|10400|28|phone-purple||Curved AMOLED screen and a 50MP selfie camera.|ram=12GB;storage=256GB;screen=6.78 inch
        phones|Honor|Honor 200|17900|20|phone-blue||Studio-style portraits with a 50MP main camera.|ram=12GB;storage=256GB;screen=6.7 inch
        phones|Honor|Honor X8b|7600|44|phone-silver||Ultra-slim phone with a 90Hz display.|ram=8GB;storage=256GB;screen=6.7 inch
        phones|Huawei|Huawei Nova 12i|7900|0|phone-gold||Stylish phone with a 50MP camera.|ram=8GB;storage=128GB;screen=6.7 inch
        phones|Huawei|Huawei Pura 70 Pro|49000|5|phone-silver||Premium camera phone with an ultra-bright display.|ram=12GB;storage=512GB;screen=6.8 inch
        # ---------- Laptops ----------
        laptops|Apple|MacBook Air M2|58000|8|macbook-air-m2.webp|APL-MBA-M2-256|Thin and light laptop powered by the Apple M2 chip.|ram=8GB;storage=256GB SSD;screen=13.6 inch
        laptops|Samsung|Samsung Galaxy Book3|29000|12|samsung-galaxy-book3.jpg|SAM-BOOK3-512|Everyday laptop with a 15.6-inch Full HD display.|ram=16GB;storage=512GB SSD;screen=15.6 inch
        laptops|Apple|MacBook Air M3 13-inch|62000|10|laptop-silver||Fanless design with the Apple M3 chip.|ram=8GB;storage=256GB SSD;screen=13.6 inch
        laptops|Apple|MacBook Pro 14-inch M3|95000|5|laptop-gray||Pro performance with a Liquid Retina XDR display.|ram=8GB;storage=512GB SSD;screen=14.2 inch
        laptops|Apple|MacBook Pro 16-inch M3 Pro|145000|3|laptop-black||The most powerful MacBook for creators.|ram=18GB;storage=512GB SSD;screen=16.2 inch
        laptops|Dell|Dell XPS 13|78000|6|laptop-silver||Premium ultraportable with an edge-to-edge display.|ram=16GB;storage=512GB SSD;screen=13.4 inch
        laptops|Dell|Dell Inspiron 15|28500|18|laptop-silver||Dependable laptop for study and work.|ram=8GB;storage=512GB SSD;screen=15.6 inch
        laptops|Dell|Dell Latitude 5440|45000|9|laptop-gray||Business laptop with strong security features.|ram=16GB;storage=512GB SSD;screen=14 inch
        laptops|HP|HP Pavilion 15|31000|16|laptop-silver||Everyday laptop with a sleek design.|ram=16GB;storage=512GB SSD;screen=15.6 inch
        laptops|HP|HP Victus 16|49000|8|laptop-black||Entry gaming laptop with a dedicated GPU.|ram=16GB;storage=512GB SSD;screen=16.1 inch
        laptops|HP|HP EliteBook 840|62000|5|laptop-gray||Lightweight business laptop with a long battery life.|ram=16GB;storage=512GB SSD;screen=14 inch
        laptops|HP|HP Envy x360|44000|7|laptop-blue||Convertible 2-in-1 with a touch screen.|ram=16GB;storage=512GB SSD;screen=15.6 inch
        laptops|Lenovo|Lenovo IdeaPad Slim 3|24500|22|laptop-gray||Slim and affordable laptop for everyday tasks.|ram=8GB;storage=256GB SSD;screen=15.6 inch
        laptops|Lenovo|Lenovo ThinkPad E14|38000|11|laptop-black||Classic ThinkPad keyboard and rugged build.|ram=16GB;storage=512GB SSD;screen=14 inch
        laptops|Lenovo|Lenovo Legion 5|66000|6|laptop-gray||Gaming laptop with a fast 165Hz display.|ram=16GB;storage=1TB SSD;screen=15.6 inch
        laptops|Lenovo|Lenovo Yoga Slim 7|54000|7|laptop-blue||Premium slim laptop with an OLED display.|ram=16GB;storage=512GB SSD;screen=14 inch
        laptops|Asus|Asus Vivobook 15|26500|20|laptop-silver||Colourful everyday laptop with a numeric keypad.|ram=8GB;storage=512GB SSD;screen=15.6 inch
        laptops|Asus|Asus ROG Strix G16|89000|4|laptop-black||High-end gaming laptop with an RTX GPU.|ram=16GB;storage=1TB SSD;screen=16 inch
        laptops|Asus|Asus Zenbook 14 OLED|57000|8|laptop-blue||Light OLED laptop for work on the go.|ram=16GB;storage=512GB SSD;screen=14 inch
        laptops|Acer|Acer Aspire 5|25500|19|laptop-silver||Good value laptop with a fast SSD.|ram=8GB;storage=512GB SSD;screen=15.6 inch
        laptops|Acer|Acer Nitro V 15|46000|10|laptop-black||Gaming laptop with a strong cooling system.|ram=16GB;storage=512GB SSD;screen=15.6 inch
        laptops|MSI|MSI Thin GF63|36000|12|laptop-black||Portable gaming laptop at a fair price.|ram=8GB;storage=512GB SSD;screen=15.6 inch
        laptops|MSI|MSI Katana 15|52000|7|laptop-gray||Gaming laptop with a 144Hz display.|ram=16GB;storage=1TB SSD;screen=15.6 inch
        laptops|Samsung|Samsung Galaxy Book4 Pro|61000|6|laptop-silver||Slim laptop with a 3K AMOLED display.|ram=16GB;storage=512GB SSD;screen=14 inch
        # ---------- Tablets ----------
        tablets|Apple|iPad 10th Generation|17500|20|tablet-blue||Colourful iPad with a 10.9-inch Liquid Retina display.|storage=64GB;screen=10.9 inch;chip=A14 Bionic
        tablets|Apple|iPad Air M2|33000|9|tablet-purple||Thin and powerful tablet with the M2 chip.|storage=128GB;screen=11 inch;chip=M2
        tablets|Apple|iPad Pro 11-inch M4|58000|5|tablet-gray||Ultra-thin tablet with a tandem OLED display.|storage=256GB;screen=11 inch;chip=M4
        tablets|Apple|iPad mini 6|24500|8|tablet-silver||Compact iPad that fits in one hand.|storage=64GB;screen=8.3 inch;chip=A15 Bionic
        tablets|Samsung|Samsung Galaxy Tab S9 FE|17500|15|tablet-blue||Tablet with an S Pen and water resistance.|storage=128GB;screen=10.9 inch;ram=6GB
        tablets|Samsung|Samsung Galaxy Tab S9 Ultra|55000|4|tablet-gray||Huge 14.6-inch AMOLED tablet.|storage=256GB;screen=14.6 inch;ram=12GB
        tablets|Samsung|Samsung Galaxy Tab A9+|8800|30|tablet-silver||Affordable tablet for the whole family.|storage=64GB;screen=11 inch;ram=4GB
        tablets|Xiaomi|Xiaomi Pad 6|14500|14|tablet-gray||144Hz display and fast charging.|storage=128GB;screen=11 inch;ram=6GB
        tablets|Lenovo|Lenovo Tab P12|13800|11|tablet-blue||Big screen tablet with a quad speaker system.|storage=128GB;screen=12.7 inch;ram=8GB
        tablets|Huawei|Huawei MatePad 11.5|11900|13|tablet-silver||Paper-like matte display.|storage=128GB;screen=11.5 inch;ram=6GB
        # ---------- Audio ----------
        audio|Sony|Sony WH-1000XM5|14500|25|sony-wh-1000xm5.webp|SNY-WH1000XM5|Wireless over-ear headphones with industry-leading noise cancelling.|type=Over-ear;battery=30 hours;noise_cancelling=Yes
        audio|Sony|Sony WF-1000XM5|11000|30|sony-wf-1000xm5.webp|SNY-WF1000XM5|True wireless earbuds with active noise cancelling.|type=In-ear;battery=8 hours;noise_cancelling=Yes
        audio|Sony|Sony WH-CH720N|5200|28|headphones-blue||Light noise-cancelling headphones.|type=Over-ear;battery=35 hours;noise_cancelling=Yes
        audio|Sony|Sony WF-C700N|4300|32|earbuds-black||Small noise-cancelling earbuds.|type=In-ear;battery=7.5 hours;noise_cancelling=Yes
        audio|Sony|Sony SRS-XB100 Speaker|2200|45|speaker-blue||Pocket Bluetooth speaker with strong bass.|type=Portable;battery=16 hours;waterproof=IP67
        audio|Sony|Sony SRS-XG300 Speaker|9800|10|speaker-black||Large party speaker with light effects.|type=Portable;battery=25 hours;waterproof=IP67
        audio|Apple|AirPods Pro 2|11500|20|earbuds-white||Active noise cancelling with USB-C charging.|type=In-ear;battery=6 hours;noise_cancelling=Yes
        audio|Apple|AirPods 4|7400|25|earbuds-white||Open-fit earbuds with a comfortable design.|type=In-ear;battery=5 hours;noise_cancelling=No
        audio|Apple|AirPods Max|24000|6|headphones-silver||Over-ear headphones with high-fidelity sound.|type=Over-ear;battery=20 hours;noise_cancelling=Yes
        audio|Apple|Beats Studio Pro|14500|9|headphones-black||Personalised spatial audio and ANC.|type=Over-ear;battery=40 hours;noise_cancelling=Yes
        audio|Apple|Beats Solo 4|7900|14|headphones-blue||On-ear headphones with 50 hours of battery.|type=On-ear;battery=50 hours;noise_cancelling=No
        audio|Samsung|Samsung Galaxy Buds2 Pro|6200|22|earbuds-white||Hi-Fi 24-bit audio and noise cancelling.|type=In-ear;battery=5 hours;noise_cancelling=Yes
        audio|Samsung|Samsung Galaxy Buds FE|3100|30|earbuds-black||Comfortable earbuds with ANC.|type=In-ear;battery=6 hours;noise_cancelling=Yes
        audio|JBL|JBL Tune 520BT|1500|50|headphones-black||Lightweight wireless on-ear headphones.|type=On-ear;battery=57 hours;noise_cancelling=No
        audio|JBL|JBL Tune 770NC|3200|26|headphones-blue||Adaptive noise-cancelling headphones.|type=Over-ear;battery=70 hours;noise_cancelling=Yes
        audio|JBL|JBL Live 670NC|4100|18|headphones-white||Smart ambient headphones with ANC.|type=On-ear;battery=65 hours;noise_cancelling=Yes
        audio|JBL|JBL Flip 6|4900|35|speaker-red||Waterproof portable speaker with loud sound.|type=Portable;battery=12 hours;waterproof=IP67
        audio|JBL|JBL Charge 5|6800|24|speaker-blue||Speaker that doubles as a power bank.|type=Portable;battery=20 hours;waterproof=IP67
        audio|JBL|JBL PartyBox 110|15500|7|speaker-black||Party speaker with a light show.|type=Party;battery=12 hours;waterproof=IPX4
        audio|JBL|JBL Go 4|1300|60|speaker-gray||Small speaker that fits in your pocket.|type=Portable;battery=7 hours;waterproof=IP67
        audio|Bose|Bose QuietComfort Ultra Headphones|19500|8|headphones-white||World-class noise cancelling with spatial audio.|type=Over-ear;battery=24 hours;noise_cancelling=Yes
        audio|Bose|Bose QuietComfort Earbuds II|11900|12|earbuds-black||Custom-tuned noise cancelling earbuds.|type=In-ear;battery=6 hours;noise_cancelling=Yes
        audio|Bose|Bose SoundLink Flex|5900|16|speaker-gray||Rugged Bluetooth speaker with clear sound.|type=Portable;battery=12 hours;waterproof=IP67
        audio|Anker|Anker Soundcore Q30|2400|34|headphones-black||Hybrid active noise-cancelling headphones.|type=Over-ear;battery=40 hours;noise_cancelling=Yes
        audio|Anker|Anker Soundcore Liberty 4 NC|3400|27|earbuds-blue||Earbuds with heart-rate sensing and ANC.|type=In-ear;battery=10 hours;noise_cancelling=Yes
        audio|Xiaomi|Xiaomi Redmi Buds 5 Pro|1900|40|earbuds-white||Dual-driver earbuds with ANC at a low price.|type=In-ear;battery=10 hours;noise_cancelling=Yes
        audio|Huawei|Huawei FreeBuds Pro 3|7300|10|earbuds-white||Premium earbuds with an ultrasonic sensor.|type=In-ear;battery=6.5 hours;noise_cancelling=Yes
        # ---------- Wearables ----------
        wearables|Apple|Apple Watch Series 9|19500|12|watch-pink||Bright display with a double-tap gesture.|size=41mm;battery=18 hours;gps=Yes
        wearables|Apple|Apple Watch Ultra 2|39000|5|watch-black||Rugged titanium watch for adventures.|size=49mm;battery=36 hours;gps=Dual-frequency
        wearables|Apple|Apple Watch SE|11500|16|watch-silver||Essential features at a friendly price.|size=40mm;battery=18 hours;gps=Yes
        wearables|Samsung|Samsung Galaxy Watch6|9800|18|watch-black||Slim smartwatch with advanced sleep coaching.|size=40mm;battery=40 hours;gps=Yes
        wearables|Samsung|Samsung Galaxy Watch6 Classic|12900|9|watch-silver||Rotating bezel and a premium look.|size=43mm;battery=40 hours;gps=Yes
        wearables|Samsung|Samsung Galaxy Fit3|2400|40|watch-black||Light fitness band with a large display.|size=1.6 inch;battery=13 days;gps=No
        wearables|Xiaomi|Xiaomi Smart Band 8|1300|70|watch-black||Fitness band with a 1.62-inch AMOLED.|size=1.62 inch;battery=16 days;gps=No
        wearables|Xiaomi|Xiaomi Watch S3|4300|22|watch-silver||Smartwatch with swappable bezels.|size=47mm;battery=15 days;gps=Yes
        wearables|Huawei|Huawei Watch GT 4|8200|14|watch-blue||Stylish watch with a 14-day battery.|size=46mm;battery=14 days;gps=Yes
        wearables|Huawei|Huawei Band 9|1500|55|watch-pink||Slim fitness band with sleep tracking.|size=1.47 inch;battery=14 days;gps=No
        wearables|Amazfit|Amazfit GTR 4|5600|19|watch-black||Dual-band GPS and 150 sports modes.|size=46mm;battery=14 days;gps=Dual-band
        wearables|Amazfit|Amazfit Bip 5|2000|33|watch-black||Large-screen smartwatch with a long battery life.|size=1.91 inch;battery=10 days;gps=Yes
        wearables|Garmin|Garmin Forerunner 265|17500|8|watch-blue||Running watch with a bright AMOLED display.|size=46mm;battery=13 days;gps=Multi-band
        wearables|Garmin|Garmin Venu 3|20500|6|watch-silver||Health smartwatch with sleep coach.|size=45mm;battery=14 days;gps=Yes
        # ---------- Gaming ----------
        gaming|Sony|PlayStation 5 Slim|24500|11|console-white||PlayStation 5 with a disc drive and 1TB SSD.|storage=1TB;resolution=4K;disc_drive=Yes
        gaming|Sony|PlayStation 5 Digital Edition|21500|9|console-white||Disc-free PlayStation 5.|storage=1TB;resolution=4K;disc_drive=No
        gaming|Sony|DualSense Wireless Controller|2900|40|gamepad-white||Controller with haptic feedback and adaptive triggers.|connection=Bluetooth;battery=12 hours
        gaming|Microsoft|Xbox Series X|25500|7|console-black||The most powerful Xbox ever.|storage=1TB;resolution=4K;disc_drive=Yes
        gaming|Microsoft|Xbox Series S|14500|13|console-white||Compact all-digital Xbox.|storage=512GB;resolution=1440p;disc_drive=No
        gaming|Microsoft|Xbox Wireless Controller|2700|38|gamepad-black||Comfortable controller with textured grips.|connection=Bluetooth;battery=40 hours
        gaming|Nintendo|Nintendo Switch OLED|14800|10|handheld-black||Handheld console with a vivid 7-inch OLED screen.|storage=64GB;screen=7 inch;modes=TV / Tabletop / Handheld
        gaming|Nintendo|Nintendo Switch Lite|8500|15|handheld-black||Compact handheld-only Switch.|storage=32GB;screen=5.5 inch;modes=Handheld
        gaming|Nintendo|Nintendo Switch Pro Controller|2900|20|gamepad-black||Console controller with motion controls.|connection=Bluetooth;battery=40 hours
        gaming|Razer|Razer DeathAdder V3 Pro|5900|16|mouse-black||Ultra-light wireless gaming mouse.|dpi=30000;connection=Wireless;weight=63g
        gaming|Razer|Razer BlackWidow V4|8800|9|keyboard-black||Mechanical gaming keyboard with RGB lighting.|switches=Green;layout=Full;lighting=RGB
        gaming|Razer|Razer Kraken V4 Headset|7500|11|headphones-black||Wireless gaming headset with spatial audio.|type=Over-ear;battery=40 hours;microphone=Detachable
        gaming|HyperX|HyperX Cloud II Headset|3400|24|headphones-black||Comfortable 7.1 surround headset.|type=Over-ear;connection=USB;microphone=Detachable
        gaming|HyperX|HyperX Alloy Origins|3900|14|keyboard-black||Compact mechanical keyboard with an aluminium body.|switches=Red;layout=Full;lighting=RGB
        gaming|Logitech|Logitech G502 X|2800|30|mouse-black||Gaming mouse with a hybrid optical-mechanical switch.|dpi=25600;connection=Wired;weight=89g
        gaming|Logitech|Logitech G Pro X Superlight 2|6900|12|mouse-white||Featherweight esports mouse.|dpi=32000;connection=Wireless;weight=60g
        gaming|Logitech|Logitech G733 Headset|4600|17|headphones-white||Lightweight wireless RGB headset.|type=Over-ear;battery=29 hours;microphone=Boom
        # ---------- TVs and Displays ----------
        tvs-displays|Samsung|Samsung 55-inch Crystal UHD 4K TV|22000|9|tv-black||4K smart TV with the Crystal Processor.|size=55 inch;resolution=4K;smart=Tizen
        tvs-displays|Samsung|Samsung 65-inch QLED Q60D|38000|5|tv-black||QLED colours and a Quantum Processor.|size=65 inch;resolution=4K;smart=Tizen
        tvs-displays|LG|LG 55-inch UHD UR80|21500|10|tv-black||4K smart TV with webOS and ThinQ AI.|size=55 inch;resolution=4K;smart=webOS
        tvs-displays|LG|LG 65-inch OLED C3|85000|3|tv-black||Self-lit OLED pixels with the a9 processor.|size=65 inch;resolution=4K;refresh_rate=120Hz
        tvs-displays|TCL|TCL 50-inch 4K Google TV|14500|14|tv-black||Affordable 4K TV with Google TV built in.|size=50 inch;resolution=4K;smart=Google TV
        tvs-displays|TCL|TCL 65-inch QLED C655|29000|6|tv-black||QLED display with Dolby Vision.|size=65 inch;resolution=4K;smart=Google TV
        tvs-displays|Hisense|Hisense 55-inch A6 4K|19500|8|tv-black||4K TV with Dolby Vision and VIDAA.|size=55 inch;resolution=4K;smart=VIDAA
        tvs-displays|Sony|Sony Bravia 55-inch X80L|33000|4|tv-black||4K HDR TV with Google TV.|size=55 inch;resolution=4K;smart=Google TV
        tvs-displays|LG|LG UltraGear 27GP850 Monitor|11500|12|monitor-black||27-inch QHD Nano IPS gaming monitor.|size=27 inch;resolution=QHD;refresh_rate=180Hz
        tvs-displays|Samsung|Samsung Odyssey G5 Monitor|10500|13|monitor-black||27-inch curved QHD gaming monitor.|size=27 inch;resolution=QHD;refresh_rate=144Hz
        tvs-displays|Dell|Dell S2425H Monitor|5400|21|monitor-black||24-inch Full HD monitor with built-in speakers.|size=24 inch;resolution=Full HD;refresh_rate=100Hz
        tvs-displays|Philips|Philips 242V8 Monitor|4300|25|monitor-black||24-inch Full HD IPS monitor.|size=24 inch;resolution=Full HD;refresh_rate=75Hz
        # ---------- Accessories ----------
        accessories|Logitech|Logitech MX Master 3S|4200|40|logitech-mx-master-3s.jpg|LOG-MXM3S|Ergonomic wireless mouse for productivity.|connection=Bluetooth / USB receiver;dpi=8000
        accessories|Logitech|Logitech MX Keys|4800|0||LOG-MXKEYS|Illuminated wireless keyboard with smart backlighting.|connection=Bluetooth / USB receiver;layout=Full|inactive
        accessories|Logitech|Logitech MX Keys S|5300|18|keyboard-black||Smart backlit keyboard with a quiet typing feel.|connection=Bluetooth / USB receiver;layout=Full
        accessories|Logitech|Logitech MX Anywhere 3S|3600|22|mouse-white||Compact mouse that works on any surface.|connection=Bluetooth / USB receiver;dpi=8000
        accessories|Logitech|Logitech M330 Silent Plus|750|60|mouse-black||Quiet wireless mouse with a long battery life.|connection=USB receiver;battery=24 months
        accessories|Logitech|Logitech K380 Keyboard|1500|35|keyboard-white||Slim Bluetooth keyboard for any device.|connection=Bluetooth;layout=Compact
        accessories|Logitech|Logitech C920 Webcam|3600|20|||Full HD webcam with stereo microphones.|resolution=1080p;fov=78 degrees
        accessories|Logitech|Logitech Brio 4K Webcam|6100|9|||4K webcam with HDR and auto-focus.|resolution=4K;fov=90 degrees
        accessories|Anker|Anker PowerCore 20000|1900|45|powerbank-black||High-capacity power bank for several charges.|capacity=20000mAh;output=22.5W
        accessories|Anker|Anker 735 GaNPrime 65W Charger|1700|30|charger-black||Three-port fast charger for laptop and phones.|output=65W;ports=3
        accessories|Anker|Anker USB-C Cable 1.8m|450|90|cable-white||Durable braided USB-C cable.|length=1.8m;power=60W
        accessories|Baseus|Baseus 65W GaN Charger|1100|50|charger-white||Compact GaN fast charger.|output=65W;ports=3
        accessories|Baseus|Baseus 20000mAh Power Bank|1300|42|powerbank-blue||Fast-charging power bank with a digital display.|capacity=20000mAh;output=65W
        accessories|Baseus|Baseus USB-C Cable 100W|350|110|cable-black||100W USB-C to USB-C cable.|length=1m;power=100W
        accessories|Apple|Apple 20W USB-C Power Adapter|1200|60|charger-white||Fast charging for iPhone and iPad.|output=20W;ports=1
        accessories|Apple|Apple MagSafe Charger|2300|26|charger-white||Wireless charging that snaps on magnetically.|output=15W;type=Wireless
        accessories|Apple|Apple USB-C Charge Cable 1m|800|75|cable-white||Official USB-C charge cable.|length=1m;power=60W
        accessories|Apple|Apple AirTag|1900|44|||Keep track of your keys and bags.|battery=1 year;connection=U1 chip
        accessories|Samsung|Samsung 25W Super Fast Charger|650|85|charger-white||Super fast charging for Galaxy phones.|output=25W;ports=1
        accessories|Samsung|Samsung 45W Charger|1100|40|charger-black||Super fast charging 2.0 for Galaxy devices.|output=45W;ports=1
        accessories|Samsung|Samsung Galaxy SmartTag2|1500|31|||Smart tracker for Galaxy users.|battery=500 days;connection=Bluetooth
        accessories|Xiaomi|Xiaomi 33W Charger|450|95|charger-white||Fast wall charger for Xiaomi phones.|output=33W;ports=1
        accessories|Xiaomi|Xiaomi 20000mAh Power Bank|1100|48|powerbank-white||Slim 20000mAh power bank.|capacity=20000mAh;output=22.5W
        accessories|Huawei|Huawei 66W SuperCharge Charger|900|36|charger-white||Fast charger with the SuperCharge protocol.|output=66W;ports=1
        # ---------- Cameras ----------
        cameras|Canon|Canon EOS R50|38500|7|camera-black||Compact mirrorless camera for creators.|sensor=APS-C;resolution=24.2MP;video=4K
        cameras|Canon|Canon EOS R8|78000|4|camera-black||Light full-frame mirrorless camera.|sensor=Full-frame;resolution=24.2MP;video=4K
        cameras|Canon|Canon EOS 2000D|14000|10|camera-black||Beginner DSLR with an 18-55mm lens.|sensor=APS-C;resolution=24.1MP;video=Full HD
        cameras|Nikon|Nikon Z50 II|39000|6|camera-black||Mirrorless camera with a fast autofocus.|sensor=APS-C;resolution=20.9MP;video=4K
        cameras|Nikon|Nikon Z fc|36000|5|camera-black||Retro-styled mirrorless camera.|sensor=APS-C;resolution=20.9MP;video=4K
        cameras|Sony|Sony Alpha a6400|36000|8|camera-black||Mirrorless camera with real-time tracking.|sensor=APS-C;resolution=24.2MP;video=4K
        cameras|Sony|Sony ZV-E10 II|38500|6|camera-black||Vlogging camera with a flip-out screen.|sensor=APS-C;resolution=26MP;video=4K
        cameras|Sony|Sony ZV-1F|21000|9|camera-black||Pocket vlogging camera with a wide lens.|sensor=1-inch;resolution=20MP;video=4K
        cameras|GoPro|GoPro HERO12 Black|17500|12|camera-black||Waterproof action camera with HDR video.|sensor=1/1.9-inch;resolution=27MP;video=5.3K
        """;
}
