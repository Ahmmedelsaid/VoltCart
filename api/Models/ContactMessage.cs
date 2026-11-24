namespace VoltCart.Api.Models;

/// <summary>A message sent from the public "Contact us" form. Nobody is emailed yet: the team reads these from the database.</summary>
public class ContactMessage
{
    public int Id { get; set; }

    public required string Name { get; set; }
    public required string Email { get; set; }
    public string? Phone { get; set; }
    public required string Subject { get; set; }
    public required string Message { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
