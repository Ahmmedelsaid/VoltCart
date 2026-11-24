using System.Threading.Channels;
using Microsoft.Extensions.Options;

namespace VoltCart.Api.Services;

/// <param name="Body">Plain text. Always sent, and shown by clients that do not render HTML.</param>
/// <param name="Html">Optional HTML version (sent together with the text one).</param>
public record EmailMessage(
    string To,
    string Subject,
    string Body,
    string? ReplyTo = null,
    string? Html = null
);

/// <summary>Hands emails to the background sender so a slow or failing mail server never delays or breaks a request.</summary>
public interface IEmailQueue
{
    bool Enabled { get; }

    ValueTask EnqueueAsync(EmailMessage message);
}

public sealed class EmailQueue(IOptions<EmailOptions> options) : IEmailQueue
{
    // لو السيرفر واقع ومتراكم فوق 100 رسالة، بنرمي الأقدم بدل ما الذاكرة تكبر
    private readonly Channel<EmailMessage> channel = Channel.CreateBounded<EmailMessage>(
        new BoundedChannelOptions(100)
        {
            FullMode = BoundedChannelFullMode.DropOldest,
            SingleReader = true,
        }
    );

    public bool Enabled => options.Value.IsConfigured;

    public ChannelReader<EmailMessage> Reader => channel.Reader;

    public ValueTask EnqueueAsync(EmailMessage message) => channel.Writer.WriteAsync(message);
}
