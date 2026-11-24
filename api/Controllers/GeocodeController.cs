using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Caching.Memory;
using VoltCart.Api.Dtos;

namespace VoltCart.Api.Controllers;

/// <summary>
/// Turns a map pin into an address suggestion. It goes through the API (not the browser) so we send a proper
/// User-Agent, cache answers and cap the rate, as the Nominatim usage policy asks.
/// </summary>
[ApiController]
[Authorize]
[Route("api/[controller]")]
public class GeocodeController(
    IHttpClientFactory httpClientFactory,
    IMemoryCache cache,
    ILogger<GeocodeController> logger
) : ControllerBase
{
    public const string ClientName = "nominatim";

    [HttpGet("reverse")]
    [EnableRateLimiting("geocode")]
    public async Task<ActionResult<ReverseGeocodeDto>> Reverse(
        [FromQuery, Range(-90, 90)] double lat,
        [FromQuery, Range(-180, 180)] double lng,
        [FromQuery] string lang = "en",
        CancellationToken cancellationToken = default
    )
    {
        lang = lang == "ar" ? "ar" : "en";

        // تقريب لـ 4 خانات (~11 متر) عشان نفس المكان يتخزّن في الـ cache مرة واحدة
        var key = $"geocode:{lat:F4}:{lng:F4}:{lang}";
        if (cache.TryGetValue(key, out ReverseGeocodeDto? cached) && cached is not null)
            return cached;

        try
        {
            var url = FormattableString.Invariant(
                $"reverse?format=jsonv2&addressdetails=1&zoom=18&lat={lat:F6}&lon={lng:F6}&accept-language={lang}"
            );
            var client = httpClientFactory.CreateClient(ClientName);
            using var json = await client.GetFromJsonAsync<JsonDocument>(url, cancellationToken);

            var result = Parse(json?.RootElement);
            cache.Set(key, result, TimeSpan.FromHours(6));
            return result;
        }
        catch (Exception ex)
            when (ex is HttpRequestException or TaskCanceledException or JsonException)
        {
            // الاقتراح اختياري: لو الخدمة وقعت العميل يكمّل ويكتب العنوان بإيده
            logger.LogWarning(ex, "Reverse geocoding failed");
            return new ReverseGeocodeDto(null, null, null);
        }
    }

    private static ReverseGeocodeDto Parse(JsonElement? root)
    {
        if (
            root is not { ValueKind: JsonValueKind.Object } r
            || !r.TryGetProperty("address", out var address)
            || address.ValueKind != JsonValueKind.Object
        )
            return new ReverseGeocodeDto(null, null, null);

        string? Get(string name) =>
            address.TryGetProperty(name, out var v) && v.ValueKind == JsonValueKind.String
                ? v.GetString()
                : null;

        var street = string.Join(
            " ",
            new[] { Get("house_number"), Get("road") }.Where(s => !string.IsNullOrWhiteSpace(s))
        );
        var parts = new[] { street, Get("neighbourhood"), Get("suburb"), Get("city_district") }
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .Distinct();

        var text = string.Join(", ", parts);
        return new ReverseGeocodeDto(
            text.Length == 0 ? null : text,
            Get("state"),
            Get("ISO3166-2-lvl4")
        );
    }
}
