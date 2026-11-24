using System.Globalization;
using System.Text;
using VoltCart.Api.Models;
using static VoltCart.Api.Services.EmailHtml;

namespace VoltCart.Api.Services;

/// <summary>Emails sent when an order is placed: a confirmation for the customer and an alert for the shop (HTML with a plain-text twin).</summary>
public static class OrderEmails
{
    /// <summary>Confirmation to the customer. Arabic first, then English (we do not know which language they use).</summary>
    public static EmailMessage ForCustomer(
        Order order,
        string customerEmail,
        string customerName,
        string webUrl
    )
    {
        var orderUrl = $"{webUrl.TrimEnd('/')}/orders/{order.Id}";
        var name = OneLine(customerName);

        // ---- نص عادي (للإيميلات اللي ما بتعرضش HTML)
        var text = new StringBuilder();
        text.AppendLine($"أهلاً {name}،");
        text.AppendLine(
            $"استلمنا طلبك رقم {order.Id}. هنكلمك بالتليفون عشان نتفق على ميعاد التوصيل، والدفع عند الاستلام."
        );
        text.AppendLine();
        text.AppendLine($"Hello {name},");
        text.AppendLine(
            $"We received your order #{order.Id}. We will call you to arrange delivery, and you pay in cash when it arrives."
        );
        text.AppendLine();
        AppendTextItems(text, order);
        text.AppendLine();
        text.AppendLine("التوصيل / Delivery");
        text.AppendLine($"{OneLine(order.ShippingName)} - {order.Phone}");
        text.AppendLine($"{OneLine(order.Address)}, {OneLine(order.City)}");
        text.AppendLine();
        text.AppendLine($"تابع طلبك / Track your order: {orderUrl}");

        // ---- HTML
        var html = new StringBuilder();
        html.Append(Heading($"تم استلام طلبك رقم {order.Id}", rtl: true));
        html.Append(
            Paragraph(
                $"أهلاً {Encode(name)}، استلمنا طلبك. هنكلمك بالتليفون عشان نتفق على ميعاد التوصيل، والدفع عند الاستلام.",
                rtl: true
            )
        );
        html.Append(Divider());
        html.Append(Heading($"We received your order #{order.Id}"));
        html.Append(
            Paragraph(
                $"Hello {Encode(name)}, thank you for shopping with us. We will call you to arrange delivery, and you pay in cash when it arrives."
            )
        );
        html.Append(ItemsTable(order));
        html.Append(
            Details([
                ("التوصيل / Delivery", $"{Encode(order.ShippingName)}<br>{Encode(order.Phone)}"),
                ("العنوان / Address", $"{Encode(order.Address)}, {Encode(order.City)}"),
                ("الدفع / Payment", "الدفع عند الاستلام / Cash on delivery"),
            ])
        );
        html.Append(Button(orderUrl, "تابع طلبك / Track your order"));

        return new EmailMessage(
            To: customerEmail,
            Subject: $"VoltCart | تم استلام طلبك #{order.Id} / Order #{order.Id} received",
            Body: text.ToString(),
            Html: Layout(
                $"Order #{order.Id}",
                $"طلبك رقم {order.Id} / Your order #{order.Id}: {Money(order.Total)}",
                html.ToString()
            )
        );
    }

    /// <summary>Alert to the shop with everything needed to call the customer and deliver.</summary>
    public static EmailMessage ForShop(Order order, string recipient, string customerEmail)
    {
        var placed = CairoTime.Format(order.CreatedAt);
        var map =
            order.Latitude is { } lat && order.Longitude is { } lng
                ? string.Create(
                    CultureInfo.InvariantCulture,
                    $"https://www.openstreetmap.org/?mlat={lat}&mlon={lng}#map=17/{lat}/{lng}"
                )
                : null;

        // ---- نص عادي
        var text = new StringBuilder();
        text.AppendLine($"New order #{order.Id} (cash on delivery)");
        text.AppendLine();
        text.AppendLine($"Placed:   {placed}");
        text.AppendLine($"Customer: {OneLine(order.ShippingName)}");
        text.AppendLine($"Phone:    {order.Phone}");
        text.AppendLine($"Email:    {customerEmail}");
        text.AppendLine($"Address:  {OneLine(order.Address)}, {OneLine(order.City)}");
        if (map is not null)
            text.AppendLine($"Map pin:  {map}");
        if (!string.IsNullOrWhiteSpace(order.Notes))
            text.AppendLine($"Notes:    {OneLine(order.Notes)}");
        text.AppendLine();
        AppendTextItems(text, order);

        // ---- HTML
        var rows = new List<(string, string)>
        {
            ("Placed", Encode(placed)),
            ("Customer", Encode(order.ShippingName)),
            (
                "Phone",
                $"<a href=\"tel:{Encode(order.Phone)}\" style=\"color:{Blue};\">{Encode(order.Phone)}</a>"
            ),
            (
                "Email",
                $"<a href=\"mailto:{Encode(customerEmail)}\" style=\"color:{Blue};\">{Encode(customerEmail)}</a>"
            ),
            ("Address", $"{Encode(order.Address)}, {Encode(order.City)}"),
        };
        if (map is not null)
            rows.Add(
                (
                    "Map pin",
                    $"<a href=\"{Encode(map)}\" style=\"color:{Blue};\">Open on the map</a>"
                )
            );
        if (!string.IsNullOrWhiteSpace(order.Notes))
            rows.Add(("Notes", EncodeMultiline(order.Notes)));

        var html = new StringBuilder();
        html.Append(Heading($"New order #{order.Id}"));
        html.Append(Paragraph($"Cash on delivery &middot; <strong>{Money(order.Total)}</strong>"));
        html.Append(Details(rows));
        html.Append(ItemsTable(order, bilingual: false));
        html.Append(Paragraph("Reply to this email to write to the customer directly."));

        return new EmailMessage(
            To: recipient,
            Subject: $"[VoltCart] New order #{order.Id} - {Money(order.Total)} - {OneLine(order.City)}",
            Body: text.ToString(),
            // الرد على الإيميل يروح للعميل
            ReplyTo: customerEmail,
            Html: Layout(
                $"New order #{order.Id}",
                $"{OneLine(order.ShippingName)} · {Money(order.Total)} · {OneLine(order.City)}",
                html.ToString()
            )
        );
    }

    private static string ItemsTable(Order order, bool bilingual = true)
    {
        var (product, qty, price, total) = bilingual
            ? ("المنتج / Product", "الكمية / Qty", "السعر / Price", "الإجمالي / Total")
            : ("Product", "Qty", "Price", "Total");

        var html = new StringBuilder();
        html.Append(
            "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" dir=\"ltr\" style=\"margin:6px 0 18px;border:1px solid #e1e6ef;border-radius:10px;\">"
        );
        html.Append(
            $"<tr style=\"background:#f4f6fa;\"><td style=\"padding:10px 12px;font-size:12px;color:#5b6678;\">{product}</td><td align=\"center\" style=\"padding:10px 12px;font-size:12px;color:#5b6678;\">{qty}</td><td align=\"right\" style=\"padding:10px 12px;font-size:12px;color:#5b6678;\">{price}</td></tr>"
        );
        foreach (var item in order.Items)
            html.Append(
                $"<tr><td style=\"padding:10px 12px;border-top:1px solid #e1e6ef;font-size:14px;\">{Encode(item.ProductName)}</td><td align=\"center\" style=\"padding:10px 12px;border-top:1px solid #e1e6ef;font-size:14px;\">{item.Quantity}</td><td align=\"right\" style=\"padding:10px 12px;border-top:1px solid #e1e6ef;font-size:14px;white-space:nowrap;\">{Money(item.UnitPrice * item.Quantity)}</td></tr>"
            );
        html.Append(
            $"<tr style=\"background:#f4f6fa;\"><td colspan=\"2\" style=\"padding:12px;border-top:1px solid #e1e6ef;font-size:14px;font-weight:700;\">{total}</td><td align=\"right\" style=\"padding:12px;border-top:1px solid #e1e6ef;font-size:15px;font-weight:700;color:{Blue};white-space:nowrap;\">{Money(order.Total)}</td></tr>"
        );
        html.Append("</table>");
        return html.ToString();
    }

    private static void AppendTextItems(StringBuilder body, Order order)
    {
        body.AppendLine("المنتجات / Items");
        foreach (var item in order.Items)
            body.AppendLine(
                $"- {OneLine(item.ProductName)} x{item.Quantity}  {Money(item.UnitPrice * item.Quantity)}"
            );
        body.AppendLine($"الإجمالي / Total: {Money(order.Total)}");
    }

    // أي سطر جديد في نص من العميل ممكن يبوّظ الـ subject أو شكل الإيميل
    private static string OneLine(string text) => text.ReplaceLineEndings(" ");
}
