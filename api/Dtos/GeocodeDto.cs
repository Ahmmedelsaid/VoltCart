namespace VoltCart.Api.Dtos;

/// <summary>What the map pin points at. Both are null when nothing useful was found.</summary>
public record ReverseGeocodeDto(string? Address, string? State, string? IsoCode);
