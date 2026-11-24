# Deploying VoltCart

The repo builds into **one Docker image**: the .NET API also serves the Angular site, so there is one address, no CORS
and the refresh-token cookie stays first-party. The only other thing you need is a **MySQL 8** database.

> Heads-up: free managed MySQL tiers have mostly disappeared (Aiven retired theirs). Plan on roughly **5 USD/month**
> for the app and database together, and delete the project when you no longer need the demo.

## Try it locally first (Docker)

```bash
docker compose up --build        # site + API + MySQL, demo data included
# open http://localhost:8080
```

The values in `docker-compose.yml` are for local use only. Copy `.env.example` to `.env` to change them.

## Option A: Railway (recommended, simplest)

Railway builds from the `Dockerfile` (see `railway.toml`) and runs MySQL next to the app in one project.

1. Sign in at railway.com with GitHub, then **New Project > Deploy from GitHub repo** and pick this repository.
2. In the same project: **New > Database > MySQL**.
3. Open the app service, **Variables**, and add:

   | Variable | Value |
   | --- | --- |
   | `ConnectionStrings__Default` | `Server=${{MySQL.MYSQLHOST}};Port=${{MySQL.MYSQLPORT}};Database=${{MySQL.MYSQLDATABASE}};User=${{MySQL.MYSQLUSER}};Password=${{MySQL.MYSQLPASSWORD}}` |
   | `Jwt__Key` | a random string of 32+ characters (`openssl rand -base64 48`) |
   | `Database__MigrateOnStartup` | `true` (creates the tables on start) |
   | `Seed__DemoData` | `true` (loads the demo catalogue; adds only what is missing) |
   | `Email__WebUrl` | your public address, for example `https://voltcart-production.up.railway.app` |

   `${{MySQL.*}}` are Railway reference variables. If your database service has another name or the variable names
   differ, check the **Variables** tab of the MySQL service.
4. App service > **Settings > Networking > Generate Domain**. That is your link.
5. Open `<your link>/api/health`. It should answer `{"status":"ok"}`. Then open the site.

Optional variables: `Seed__AdminEmail` + `Seed__AdminPassword` (first admin), and the `Email__*` settings from the README
(use `Email__Host`, `Email__Port`, `Email__UserName`, `Email__Password`, `Email__ContactRecipient`).

## Option B: Render (app) + any MySQL

Render has no MySQL. Run the app there and point it at a MySQL from somewhere else (Railway, a VPS, Aiven Developer...).

1. **New > Web Service**, connect the repo, **Runtime: Docker**.
2. Set the same environment variables as above. The connection string needs `SslMode=Required` for most hosted MySQL
   services, for example `Server=...;Port=...;Database=...;User=...;Password=...;SslMode=Required`.
3. Health check path: `/api/health`.

Render's free web instances sleep after ~15 minutes without traffic, and the first request afterwards is slow. For a
demo you want recruiters to open, use a paid instance or an uptime monitor that pings `/api/health` every 10 minutes.

## Option C: any VPS

```bash
git clone https://github.com/Ahmmedelsaid/VoltCart && cd VoltCart
cp .env.example .env            # set DB_PASSWORD, JWT_KEY, PUBLIC_URL
docker compose up -d --build
```

Put a reverse proxy with HTTPS in front (Caddy or nginx) and forward to port 8080. The image already trusts
`X-Forwarded-*` headers (`Proxy__TrustForwardedHeaders=true`).

## What the deployment settings do

| Setting | Purpose |
| --- | --- |
| `PORT` | Port to listen on (set by Railway and Render). Defaults to 8080 in the image. |
| `Database__MigrateOnStartup` | Applies EF Core migrations at start, retrying while the database boots. |
| `Seed__DemoData` | Loads the demo catalogue in Production (always on in Development). |
| `Proxy__TrustForwardedHeaders` | Trust `X-Forwarded-For/Proto` from the platform's proxy (real client IP for rate limits, correct HTTPS). On in the image. |
| `/api/health` | Returns 200 when the database is reachable. |

Cookies are `Secure; HttpOnly; SameSite=Strict`, so the site must be served over HTTPS (all platforms do this for you).
