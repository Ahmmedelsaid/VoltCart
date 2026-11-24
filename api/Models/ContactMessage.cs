namespace VoltCart.Api.Models;

/// <summary>A message sent from the public "Contact us" form. They are also emailed to the shop when SMTP is configured.</summary>
public class ContactMessage
{
    public int Id { get; set; }

    public required string Name { get; set; }
    public required string Email { get; set; }
    public string? Phone { get; set; }
    public required string Subject { get; set; }
    public required string Message { get; set; }

    /// <summary>What the message is about: product, order, complaint or other.</summary>
    public string Topic { get; set; } = "other";

    /// <summary>An order number the customer mentioned (not checked against the orders table).</summary>
    public int? OrderNumber { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
