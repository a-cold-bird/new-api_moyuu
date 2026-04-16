# Docker Compose with Host PostgreSQL and Apache2

This guide targets a production-style single server deployment:

- Cloudflare handles the public DNS and edge network.
- Apache2 runs on the host and is the only public entry point.
- `new-api` and Redis run in Docker Compose.
- PostgreSQL runs on the Linux host, outside Docker Compose.

## Why this layout

- The app container stays close to stateless and is easy to rebuild.
- PostgreSQL is managed independently from the application lifecycle.
- Apache2 can terminate TLS, apply request limits, and keep the app bound to `127.0.0.1`.

## 1. Install PostgreSQL on the host

Debian/Ubuntu example:

```bash
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib
sudo systemctl enable --now postgresql
```

Create the database and user:

```bash
sudo -u postgres psql <<'SQL'
CREATE USER newapi WITH ENCRYPTED PASSWORD 'replace_with_strong_password';
CREATE DATABASE newapi OWNER newapi;
GRANT ALL PRIVILEGES ON DATABASE newapi TO newapi;
SQL
```

## 2. Allow the container to reach host PostgreSQL

Edit the host PostgreSQL config. Typical Debian paths use versioned directories such as `15` or `16`.

`postgresql.conf`:

```conf
listen_addresses = '*'
port = 5432
```

`pg_hba.conf`:

```conf
local   all             postgres                                peer
local   all             all                                     peer
host    all             all             127.0.0.1/32            scram-sha-256
host    all             all             172.16.0.0/12           scram-sha-256
```

The `172.16.0.0/12` rule covers the default Docker bridge address space used on many Linux hosts. Tighten it further if your Docker bridge uses a narrower subnet, and do not expose port `5432` publicly at the firewall level.

Reload PostgreSQL after the change:

```bash
sudo systemctl restart postgresql
sudo systemctl status postgresql --no-pager
```

Test the host database locally:

```bash
PGPASSWORD='replace_with_strong_password' psql \
  -h 127.0.0.1 \
  -U newapi \
  -d newapi \
  -c 'select version();'
```

## 3. Prepare the application env file

```bash
cp .env.production.example .env
```

Important variables:

- `SQL_DSN`: PostgreSQL DSN. PostgreSQL is detected automatically because the value starts with `postgresql://`.
- `SESSION_SECRET`: session signing secret. Must be random.
- `CRYPTO_SECRET`: encryption secret used by features that rely on Redis-backed crypto.
- `REDIS_CONN_STRING`: Compose-local Redis service.

Example DSN:

```env
SQL_DSN=postgresql://newapi:replace_with_strong_password@host.docker.internal:5432/newapi?sslmode=disable
```

## 4. Start the containers

```bash
docker compose -f docker-compose.host-postgres.yml up -d --build
docker compose -f docker-compose.host-postgres.yml ps
docker compose -f docker-compose.host-postgres.yml logs -f new-api
```

The Compose file publishes the app only on `127.0.0.1:3000`, so it is not directly exposed to the internet.

## 5. Configure Apache2 reverse proxy

Enable the required modules:

```bash
sudo a2enmod proxy proxy_http proxy_wstunnel headers remoteip rewrite ssl
sudo systemctl restart apache2
```

Example vhost:

```apache
<VirtualHost *:80>
    ServerName api.example.com
    RewriteEngine On
    RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</VirtualHost>

<IfModule mod_remoteip.c>
    RemoteIPHeader CF-Connecting-IP
    RemoteIPTrustedProxy 173.245.48.0/20
    RemoteIPTrustedProxy 103.21.244.0/22
    RemoteIPTrustedProxy 103.22.200.0/22
    RemoteIPTrustedProxy 103.31.4.0/22
    RemoteIPTrustedProxy 141.101.64.0/18
    RemoteIPTrustedProxy 108.162.192.0/18
    RemoteIPTrustedProxy 190.93.240.0/20
    RemoteIPTrustedProxy 188.114.96.0/20
    RemoteIPTrustedProxy 197.234.240.0/22
    RemoteIPTrustedProxy 198.41.128.0/17
    RemoteIPTrustedProxy 162.158.0.0/15
    RemoteIPTrustedProxy 104.16.0.0/13
    RemoteIPTrustedProxy 104.24.0.0/14
    RemoteIPTrustedProxy 172.64.0.0/13
    RemoteIPTrustedProxy 131.0.72.0/22
</IfModule>

<VirtualHost *:443>
    ServerName api.example.com

    SSLEngine on
    SSLCertificateFile /path/to/fullchain.pem
    SSLCertificateKeyFile /path/to/privkey.pem

    ProxyPreserveHost On
    ProxyRequests Off
    RequestHeader set X-Forwarded-Proto "https"
    RequestHeader set X-Forwarded-Port "443"

    ProxyPass / http://127.0.0.1:3000/ retry=0 timeout=300 keepalive=On
    ProxyPassReverse / http://127.0.0.1:3000/

    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} =websocket [NC]
    RewriteRule /(.*) ws://127.0.0.1:3000/$1 [P,L]

    ErrorLog ${APACHE_LOG_DIR}/new-api-error.log
    CustomLog ${APACHE_LOG_DIR}/new-api-access.log combined
</VirtualHost>
```

Enable the site and reload Apache2:

```bash
sudo a2ensite new-api.conf
sudo apachectl configtest
sudo systemctl reload apache2
```

## 6. Cloudflare notes

- SSL/TLS mode: use `Full (strict)`.
- Keep the Docker port private. Only Apache2 should be reachable publicly.
- If Cloudflare proxies the site, `mod_remoteip` lets Apache log the real client IP from `CF-Connecting-IP`.

## PostgreSQL vs MySQL vs SQL

- `SQL` is the query language, not a database product.
- `PostgreSQL` and `MySQL` are database engines that both speak SQL with different dialects and operational behavior.
- For this project, PostgreSQL is a strong production default because transaction semantics and advanced query behavior are generally more robust.

## Host PostgreSQL vs Compose PostgreSQL

- Host PostgreSQL:
  - Database lifecycle is separate from the application container lifecycle.
  - Easier backup, upgrade, and troubleshooting.
  - Better fit for production.
- Compose PostgreSQL:
  - Faster to start on a single machine.
  - App and database are coupled in one Compose stack.
  - Simpler initially, but weaker operational isolation.

## Swap note

If the host has low memory during image builds, add swap before `docker compose -f docker-compose.host-postgres.yml up --build`. A `10G` swap file is usually enough for this stack on small servers.

```bash
sudo fallocate -l 10G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
printf '/swapfile none swap sw 0 0\n' | sudo tee -a /etc/fstab
swapon --show
free -h
```
