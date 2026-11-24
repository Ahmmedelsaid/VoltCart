namespace VoltCart.Api.Services;

/// <summary>
/// SMTP settings (section "Email"). Keep the password in user-secrets or environment variables, never in git.
/// When <see cref="Host"/> is empty, email is simply switched off.
/// </summary>
public class EmailOptions
{
    public const string SectionName = "Email";

    public string? Host { get; set; }
    public int Port { get; set; } = 587;

    /// <summary>STARTTLS on the connection (Gmail, Outlook, most providers). Turn off only for a local test server.</summary>
    public bool UseStartTls { get; set; } = true;

    /// <summary>Writes the SMTP conversation to the console (passwords are redacted). For troubleshooting only.</summary>
    public bool LogProtocol { get; set; }

    public string? UserName { get; set; }
    public string? Password { get; set; }

    /// <summary>Sender address. Defaults to <see cref="UserName"/> (Gmail only lets you send as yourself).</summary>
    public string? From { get; set; }

    /// <summary>Where "Contact us" messages are delivered.</summary>
    public string? ContactRecipient { get; set; }

    /// <summary>Where "new order" alerts go. Defaults to <see cref="ContactRecipient"/>.</summary>
    public string? OrderRecipient { get; set; }

    /// <summary>Public address of the website, used for links inside emails (for example the order page).</summary>
    public string WebUrl { get; set; } = "http://localhost:4200";

    public string? ShopRecipient => OrderRecipient ?? ContactRecipient;

    public string SenderAddress => From ?? UserName ?? "";

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(Host) && !string.IsNullOrWhiteSpace(SenderAddress);
}
