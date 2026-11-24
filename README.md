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

Gmail needs 2-step verification and an **App password** (Google Account > Security > App passwords); your normal
password will not work. In production use environment variables (`Email__UserName`, `Email__Password`, ...).
