using System.Globalization;
using System.Net;
using System.Text;

namespace VoltCart.Api.Services;

/// <summary>
/// Small helpers for the HTML emails. Mail clients ignore most CSS, so everything is table based with inline styles.
/// Every piece of user text goes through <see cref="Encode"/> first.
/// </summary>
internal static class EmailHtml
{
    public const string Blue = "#2563eb";
    private const string Font = "'Segoe UI',Tahoma,Arial,sans-serif";

    public static string Encode(string? text) => WebUtility.HtmlEncode(text ?? "");

    /// <summary>Encodes and keeps line breaks.</summary>
    public static string EncodeMultiline(string? text) =>
        Encode(text).ReplaceLineEndings("\n").Replace("\n", "<br>");

    public static string Money(decimal amount) =>
        string.Create(CultureInfo.InvariantCulture, $"EGP {amount:N0}");

    /// <summary>The shared frame: logo line, white card with a blue top edge, small footer.</summary>
    public static string Layout(string title, string preheader, string content)
    {
        var html = new StringBuilder();
        html.Append("<!doctype html><html><head><meta charset=\"utf-8\">");
        html.Append("<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">");
        html.Append($"<title>{Encode(title)}</title></head>");
        html.Append("<body style=\"margin:0;padding:0;background:#f4f6fa;\">");
        // سطر المعاينة اللي بيظهر جنب الـ subject في صندوق الوارد
        html.Append(
            $"<span style=\"display:none;max-height:0;overflow:hidden;opacity:0;\">{Encode(preheader)}</span>"
        );
        html.Append(
            "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"background:#f4f6fa;padding:24px 12px;\"><tr><td align=\"center\">"
        );
        html.Append(
            "<table role=\"presentation\" width=\"600\" cellspacing=\"0\" cellpadding=\"0\" style=\"max-width:600px;width:100%;\">"
        );
        html.Append(
            $"<tr><td style=\"padding:0 4px 14px;font-family:{Font};font-size:24px;font-weight:700;color:#0f172a;\">Volt<span style=\"color:{Blue};\">Cart</span></td></tr>"
        );
        html.Append(
            $"<tr><td style=\"background:#ffffff;border:1px solid #e1e6ef;border-top:4px solid {Blue};border-radius:14px;padding:28px;font-family:{Font};font-size:15px;line-height:1.65;color:#0f172a;\">{content}</td></tr>"
        );
        html.Append(
            $"<tr><td style=\"padding:16px 4px;font-family:{Font};font-size:12px;color:#5b6678;\">VoltCart &middot; Electronics store</td></tr>"
        );
        html.Append("</table></td></tr></table></body></html>");
        return html.ToString();
    }

    public static string Heading(string text, bool rtl = false) =>
        $"<h1{(rtl ? " dir=\"rtl\"" : "")} style=\"margin:0 0 12px;font-size:20px;line-height:1.3;color:#0f172a;{(rtl ? "text-align:right;" : "")}\">{Encode(text)}</h1>";

    public static string Paragraph(string html, bool rtl = false) =>
        $"<p{(rtl ? " dir=\"rtl\"" : "")} style=\"margin:0 0 14px;color:#334155;{(rtl ? "text-align:right;" : "")}\">{html}</p>";

    /// <summary>Label / value rows. Values are already HTML (so they can be links).</summary>
    public static string Details(
        IEnumerable<(string Label, string ValueHtml)> rows,
        bool rtl = false
    )
    {
        var html = new StringBuilder();
        html.Append(
            "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"margin:4px 0 18px;border-top:1px solid #e1e6ef;\">"
        );
        foreach (var (label, value) in rows)
        {
            html.Append(
                $"<tr><td valign=\"top\" style=\"width:34%;padding:9px 12px 9px 0;border-bottom:1px solid #e1e6ef;font-size:13px;color:#5b6678;{(rtl ? "text-align:right;" : "")}\">{Encode(label)}</td>"
            );
            html.Append(
                $"<td valign=\"top\" style=\"padding:9px 0;border-bottom:1px solid #e1e6ef;font-size:14px;color:#0f172a;{(rtl ? "text-align:right;" : "")}\">{value}</td></tr>"
            );
        }
        html.Append("</table>");
        return html.ToString();
    }

    public static string Button(string url, string label) =>
        $"<table role=\"presentation\" cellspacing=\"0\" cellpadding=\"0\" style=\"margin:8px 0 6px;\"><tr><td style=\"background:{Blue};border-radius:10px;\"><a href=\"{Encode(url)}\" style=\"display:inline-block;padding:12px 22px;font-family:{Font};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;\">{Encode(label)}</a></td></tr></table>";

    /// <summary>Grey box for free text (a customer's message).</summary>
    public static string Quote(string text) =>
        $"<div style=\"margin:4px 0 16px;padding:14px 16px;background:#f4f6fa;border-left:4px solid {Blue};border-radius:8px;color:#0f172a;font-size:15px;\">{EncodeMultiline(text)}</div>";

    public static string Divider() =>
        "<hr style=\"border:0;border-top:1px solid #e1e6ef;margin:22px 0;\">";
}

/// <summary>Cairo local time for emails (the server runs on UTC, the shop and customers do not).</summary>
internal static class CairoTime
{
    private static readonly TimeZoneInfo Zone = Find();

    private static TimeZoneInfo Find()
    {
        foreach (var id in new[] { "Africa/Cairo", "Egypt Standard Time" })
        {
            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById(id);
            }
            catch (TimeZoneNotFoundException) { }
            catch (InvalidTimeZoneException) { }
        }
        return TimeZoneInfo.Utc;
    }

    /// <summary>"24 Nov 2026, 2:23 PM (Cairo)", or "(UTC)" if the zone is not available on this machine.</summary>
    public static string Format(DateTime utc)
    {
        var local = TimeZoneInfo.ConvertTimeFromUtc(
            DateTime.SpecifyKind(utc, DateTimeKind.Utc),
            Zone
        );
        var label = Zone == TimeZoneInfo.Utc ? "UTC" : "Cairo";
        return string.Create(
            CultureInfo.InvariantCulture,
            $"{local:d MMM yyyy, h:mm tt} ({label})"
        );
    }
}
