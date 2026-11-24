using MailKit;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;

namespace VoltCart.Api.Services;

/// <summary>Sends queued emails over SMTP (MailKit). Failures are logged, never thrown into a request.</summary>
public sealed class EmailSenderService(
    EmailQueue queue,
    IOptions<EmailOptions> options,
    ILogger<EmailSenderService> logger
) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!options.Value.IsConfigured)
            logger.LogInformation(
                "Email is not configured (Email:Host and Email:UserName), so no emails will be sent."
            );

        await foreach (var message in queue.Reader.ReadAllAsync(stoppingToken))
        {
            try
            {
                await SendAsync(message, stoppingToken);
            }
            catch (AuthenticationException ex)
            {
                logger.LogError(
                    ex,
                    "SMTP login was refused, so the email {Subject} was not sent. For Gmail, Email:Password must be an App password (needs 2-Step Verification), not the account password: https://support.google.com/accounts/answer/185833",
                    message.Subject
                );
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                // الرسالة محفوظة في الـ database أصلاً، فالفشل هنا مش بيضيّع حاجة
                logger.LogError(
                    ex,
                    "Could not send an email with subject {Subject}",
                    message.Subject
                );
            }
        }
    }

    /// <summary>Port 465 is SMTP over SSL from the first byte (Gmail's other port); 587 upgrades with STARTTLS.</summary>
    private static SecureSocketOptions SocketOptionsFor(EmailOptions settings) =>
        settings.Port == 465 ? SecureSocketOptions.SslOnConnect
        : settings.UseStartTls ? SecureSocketOptions.StartTls
        : SecureSocketOptions.None;

    private async Task SendAsync(EmailMessage message, CancellationToken cancellationToken)
    {
        var settings = options.Value;

        var mime = new MimeMessage();
        mime.From.Add(MailboxAddress.Parse(settings.SenderAddress));
        mime.To.Add(MailboxAddress.Parse(message.To));
        if (message.ReplyTo is not null)
            mime.ReplyTo.Add(MailboxAddress.Parse(message.ReplyTo));
        mime.Subject = message.Subject;
        mime.Body = new TextPart("plain") { Text = message.Body };

        using var client = settings.LogProtocol
            ? new SmtpClient(new ProtocolLogger(Console.OpenStandardError())) { Timeout = 20_000 }
            : new SmtpClient { Timeout = 20_000 };
        await client.ConnectAsync(
            settings.Host!,
            settings.Port,
            SocketOptionsFor(settings),
            cancellationToken
        );
        // MailKit بيجرّب كل الطرق بالترتيب، وGmail بيقفل الاتصال بعد أول رفض، فالخطأ الحقيقي بيضيع.
        // PLAIN وحدها كفاية، وبكده رسالة الرفض الأصلية هي اللي بتظهر.
        if (client.AuthenticationMechanisms.Contains("PLAIN"))
            foreach (
                var mechanism in client.AuthenticationMechanisms.Where(m => m != "PLAIN").ToList()
            )
                client.AuthenticationMechanisms.Remove(mechanism);

        if (!string.IsNullOrEmpty(settings.UserName))
            await client.AuthenticateAsync(
                settings.UserName,
                settings.Password ?? "",
                cancellationToken
            );

        await client.SendAsync(mime, cancellationToken);
        await client.DisconnectAsync(true, cancellationToken);

        logger.LogInformation("Email sent: {Subject}", message.Subject);
    }
}
