# VoltCart

Electronics e-commerce store.

- `api/` - .NET Web API
- `web/` - Angular
- Database: MySQL

## Email (contact form notifications)

"Contact us" messages are always saved in the `ContactMessages` table. If SMTP is configured they are also emailed to
`Email:ContactRecipient` (the reply address is the customer's). With no SMTP settings email is simply off.

`appsettings.json` only holds the host and port. Keep the rest in user-secrets (never in git):

```bash
dotnet user-secrets set "Email:UserName" "you@gmail.com" --project api
dotnet user-secrets set "Email:Password" "<gmail app password>" --project api
dotnet user-secrets set "Email:ContactRecipient" "where-to-receive@example.com" --project api
```

The same setup also emails every new order: a confirmation to the customer (Arabic and English, with a link to the order page)
and an alert to the shop. The alert goes to `Email:OrderRecipient`, or to `Email:ContactRecipient` when that is not set.
Set `Email:WebUrl` to the public address of the website so the links in the emails are right.

There is no automatic WhatsApp message (that needs a WhatsApp Business API account). Instead the order page has a
"Send my order on WhatsApp" button that opens a chat with the shop; set the shop number in `web/src/app/core/site.ts`
(`whatsapp`, digits only with the country code, for example `201012345678`). Empty means the button is hidden.

Gmail needs 2-step verification and an **App password** (Google Account > Security > App passwords); your normal
password will not work. In production use environment variables (`Email__UserName`, `Email__Password`, ...).
