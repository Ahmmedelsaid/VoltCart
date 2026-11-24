using System.Text;
using VoltCart.Api.Models;
using static VoltCart.Api.Services.EmailHtml;

namespace VoltCart.Api.Services;

/// <summary>The email the shop receives for a "Contact us" message (HTML with a plain-text twin).</summary>
public static class ContactEmails
{
    /// <summary>Topics the form offers. Anything else is stored as "other".</summary>
    public static readonly string[] Topics = ["product", "order", "complaint", "other"];

    public static string TopicLabel(string topic) =>
        topic switch
        {
            "product" => "Product question",
            "order" => "Order",
            "complaint" => "Complaint",
            _ => "Other",
        };

    public static EmailMessage ForShop(ContactMessage m, string recipient)
    {
        var topic = TopicLabel(m.Topic);
        var sent = CairoTime.Format(m.CreatedAt);
        var subject = m.Subject.ReplaceLineEndings(" ");

        // ---- نص عادي
        var text = new StringBuilder();
        text.AppendLine("New message from the Contact us form");
        text.AppendLine();
        text.AppendLine($"Topic: {topic}");
        text.AppendLine($"Name:  {m.Name.ReplaceLineEndings(" ")}");
        text.AppendLine($"Email: {m.Email}");
        text.AppendLine($"Phone: {m.Phone ?? "(not given)"}");
        if (m.OrderNumber is { } order)
            text.AppendLine($"Order: #{order}");
        text.AppendLine($"Sent:  {sent}");
        text.AppendLine();
        text.AppendLine(m.Message);

        // ---- HTML
        var rows = new List<(string, string)>
        {
            ("Topic", Encode(topic)),
            ("Name", Encode(m.Name)),
            (
                "Email",
                $"<a href=\"mailto:{Encode(m.Email)}\" style=\"color:{Blue};\">{Encode(m.Email)}</a>"
            ),
            (
                "Phone",
                m.Phone is null
                    ? "<span style=\"color:#5b6678;\">(not given)</span>"
                    : $"<a href=\"tel:{Encode(m.Phone)}\" style=\"color:{Blue};\">{Encode(m.Phone)}</a>"
            ),
        };
        if (m.OrderNumber is { } orderNumber)
            rows.Add(("Order", $"#{orderNumber}"));
        rows.Add(("Sent", Encode(sent)));

        var html = new StringBuilder();
        html.Append(Heading(subject));
        html.Append(Details(rows));
        html.Append(Quote(m.Message));
        html.Append(Paragraph($"Reply to this email to answer {Encode(m.Name)} directly."));

        return new EmailMessage(
            To: recipient,
            Subject: $"[VoltCart] {topic}: {subject}",
            Body: text.ToString(),
            // الرد على الإيميل يروح للعميل مباشرة
            ReplyTo: m.Email,
            Html: Layout(
                subject,
                $"{m.Name.ReplaceLineEndings(" ")}: {Preview(m.Message)}",
                html.ToString()
            )
        );
    }

    private static string Preview(string message)
    {
        var one = message.ReplaceLineEndings(" ");
        return one.Length <= 90 ? one : one[..90] + "…";
    }
}
