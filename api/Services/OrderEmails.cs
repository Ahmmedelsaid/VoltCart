using System.Globalization;
using System.Text;
using VoltCart.Api.Models;

namespace VoltCart.Api.Services;

/// <summary>Builds the plain-text emails sent when an order is placed: a confirmation for the customer and an alert for the shop.</summary>
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
        var body = new StringBuilder();
        body.AppendLine($"أهلاً {OneLine(customerName)}،");
        body.AppendLine(
            $"استلمنا طلبك رقم {order.Id}. هنكلمك بالتليفون عشان نتفق على ميعاد التوصيل، والدفع عند الاستلام."
        );
        body.AppendLine();
        body.AppendLine($"Hello {OneLine(customerName)},");
        body.AppendLine(
            $"We received your order #{order.Id}. We will call you to arrange delivery, and you pay in cash when it arrives."
        );
        body.AppendLine();
        AppendItems(body, order);
        body.AppendLine();
        body.AppendLine("التوصيل / Delivery");
        body.AppendLine($"{OneLine(order.ShippingName)} - {order.Phone}");
        body.AppendLine($"{OneLine(order.Address)}, {OneLine(order.City)}");
        body.AppendLine();
        body.AppendLine($"تابع طلبك / Track your order: {webUrl.TrimEnd('/')}/orders/{order.Id}");

        return new EmailMessage(
            To: customerEmail,
            Subject: $"VoltCart | تم استلام طلبك #{order.Id} / Order #{order.Id} received",
            Body: body.ToString()
        );
    }

    /// <summary>Alert to the shop with everything needed to call the customer and deliver.</summary>
    public static EmailMessage ForShop(Order order, string recipient, string customerEmail)
    {
        var body = new StringBuilder();
        body.AppendLine($"New order #{order.Id} (cash on delivery)");
        body.AppendLine();
        body.AppendLine($"Customer: {OneLine(order.ShippingName)}");
        body.AppendLine($"Phone:    {order.Phone}");
        body.AppendLine($"Email:    {customerEmail}");
        body.AppendLine($"Address:  {OneLine(order.Address)}, {OneLine(order.City)}");
        if (order.Latitude is { } lat && order.Longitude is { } lng)
        {
            body.AppendLine(
                string.Create(
                    CultureInfo.InvariantCulture,
                    $"Map pin:  https://www.openstreetmap.org/?mlat={lat}&mlon={lng}#map=17/{lat}/{lng}"
                )
            );
        }
        if (!string.IsNullOrWhiteSpace(order.Notes))
            body.AppendLine($"Notes:    {OneLine(order.Notes)}");
        body.AppendLine();
        AppendItems(body, order);

        return new EmailMessage(
            To: recipient,
            Subject: $"[VoltCart] New order #{order.Id} - {Money(order.Total)} - {OneLine(order.City)}",
            Body: body.ToString(),
            // الرد على الإيميل يروح للعميل
            ReplyTo: customerEmail
        );
    }

    private static void AppendItems(StringBuilder body, Order order)
    {
        body.AppendLine("المنتجات / Items");
        foreach (var item in order.Items)
            body.AppendLine(
                $"- {OneLine(item.ProductName)} x{item.Quantity}  {Money(item.UnitPrice * item.Quantity)}"
            );
        body.AppendLine($"الإجمالي / Total: {Money(order.Total)}");
    }

    private static string Money(decimal amount) =>
        string.Create(CultureInfo.InvariantCulture, $"EGP {amount:N0}");

    // أي سطر جديد في نص من العميل ممكن يبوّظ الـ subject أو شكل الإيميل
    private static string OneLine(string text) => text.ReplaceLineEndings(" ");
}
