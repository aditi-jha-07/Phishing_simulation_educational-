# Phishing Hunter — GoDaddy Deployment Guide

## Architecture Overview

```
GoDaddy Server
├── /public_html/                ← React frontend (static files)
│   ├── index.html
│   ├── static/
│   └── .htaccess               ← React Router support
│
└── /home/yourusername/          ← Node.js backend (outside web root)
    └── phishing-hunter-api/
        ├── server.js
        ├── .env
        └── ...
```

The React frontend is served as static files via Apache.
The Node.js API runs as a background process on a separate port.
Apache proxies `/api/*` requests to the Node.js server.

---

## Prerequisites

- GoDaddy **VPS** or **Dedicated** hosting (NOT shared hosting — Node.js requires VPS)
- Ubuntu 20.04 or 22.04 VPS
- SSH access to your server
- A domain pointing to your server
- MySQL database (GoDaddy cPanel provides this)

> ⚠️ If you only have GoDaddy Shared hosting, Node.js is NOT supported.
> You must upgrade to a VPS plan.

---

## Step 1 — Initial Server Setup (SSH)

```bash
# Connect to your GoDaddy VPS
ssh root@YOUR_SERVER_IP

# Update system
apt update && apt upgrade -y

# Install Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# Verify
node --version   # should be v18.x.x
npm --version

# Install PM2 (process manager — keeps Node running 24/7)
npm install -g pm2

# Install Apache (if not already installed)
apt install -y apache2

# Enable Apache modules for proxying
a2enmod proxy proxy_http rewrite headers
systemctl restart apache2
```

---

## Step 2 — MySQL Database Setup

### Via GoDaddy cPanel (Recommended):
1. Log in to your GoDaddy hosting account
2. Go to **cPanel → MySQL Databases**
3. Create a new database: `phishing_hunter`
4. Create a database user with a strong password
5. Add the user to the database with **ALL PRIVILEGES**
6. Note your credentials:
   - Host: `localhost`
   - Database: `phishing_hunter`
   - Username: your cPanel MySQL user
   - Password: your chosen password

### Via SSH (VPS without cPanel):
```bash
# Install MySQL
apt install -y mysql-server
mysql_secure_installation

# Create database and user
mysql -u root -p
```
```sql
CREATE DATABASE phishing_hunter CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'phuser'@'localhost' IDENTIFIED BY 'YourStrongPassword123!';
GRANT ALL PRIVILEGES ON phishing_hunter.* TO 'phuser'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

> The backend **auto-creates all tables** and **seeds 10 sample scenarios** on first run.
> No manual SQL import is needed.

---

## Step 3 — Deploy the Backend

```bash
# Create app directory
mkdir -p /home/phishing-hunter-api
cd /home/phishing-hunter-api

# Upload your backend files via SCP (from your local machine):
# scp -r ./backend/* root@YOUR_SERVER_IP:/home/phishing-hunter-api/

# OR clone from git (if using version control):
# git clone YOUR_REPO_URL .

# Install dependencies
npm install --production

# Create environment file
cp .env.example .env
nano .env
```

Edit `.env` with your real values:
```env
DB_HOST=localhost
DB_USER=phuser
DB_PASSWORD=YourStrongPassword123!
DB_NAME=phishing_hunter
JWT_SECRET=generate_a_64_char_random_string_here_use_openssl_rand_hex_32
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
```

Generate a secure JWT secret:
```bash
openssl rand -hex 32
# Copy the output into JWT_SECRET in .env
```

```bash
# Test the server manually first
node server.js
# Should see: "Database initialized" and "API running on port 3001"
# Press Ctrl+C to stop

# Start with PM2 (runs forever, survives reboots)
pm2 start server.js --name "phishing-hunter-api"

# Save PM2 config so it restarts on server reboot
pm2 save
pm2 startup
# Run the command PM2 outputs (starts with "sudo env PATH=...")

# Check status
pm2 status
pm2 logs phishing-hunter-api
```

---

## Step 4 — Build and Deploy the Frontend

On your **local machine**:
```bash
cd frontend

# Create production env file
cp .env.example .env
# Edit .env:
# REACT_APP_API_URL=https://yourdomain.com/api

npm install
npm run build
# This creates a "build/" folder with optimized static files
```

Upload to your server:
```bash
# From local machine:
scp -r ./build/* root@YOUR_SERVER_IP:/var/www/html/

# OR if your GoDaddy public root is different:
scp -r ./build/* root@YOUR_SERVER_IP:/home/yourusername/public_html/
```

Create the `.htaccess` file for React Router (single-page app support):
```bash
nano /var/www/html/.htaccess
```
```apache
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_URI} !^/api
RewriteRule ^ index.html [QSA,L]
```

---

## Step 5 — Configure Apache Virtual Host

```bash
nano /etc/apache2/sites-available/phishing-hunter.conf
```

```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    ServerAlias www.yourdomain.com
    DocumentRoot /var/www/html

    # Serve React frontend
    <Directory /var/www/html>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # Proxy /api/* to Node.js backend
    ProxyRequests Off
    ProxyPreserveHost On

    <Location /api>
        ProxyPass http://localhost:3001/api
        ProxyPassReverse http://localhost:3001/api
    </Location>

    # Security headers
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-Frame-Options "DENY"
    Header always set X-XSS-Protection "1; mode=block"

    ErrorLog ${APACHE_LOG_DIR}/phishing-hunter-error.log
    CustomLog ${APACHE_LOG_DIR}/phishing-hunter-access.log combined
</VirtualHost>
```

```bash
# Enable the site
a2ensite phishing-hunter.conf
a2dissite 000-default.conf
apache2ctl configtest
systemctl reload apache2
```

---

## Step 6 — SSL Certificate (HTTPS)

```bash
# Install Certbot for free Let's Encrypt SSL
apt install -y certbot python3-certbot-apache

# Get certificate (replace with your domain)
certbot --apache -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is set up automatically. Verify:
certbot renew --dry-run
```

---

## Step 7 — Firewall Configuration

```bash
ufw allow 'Apache Full'
ufw allow ssh
ufw enable
ufw status

# Block direct access to Node port from internet
# (all traffic goes through Apache proxy)
ufw deny 3001
```

---

## Step 8 — Verify the Deployment

```bash
# Check Node.js API is running
pm2 status
curl http://localhost:3001/api/health
# Should return: {"status":"ok","timestamp":"..."}

# Check through Apache proxy
curl https://yourdomain.com/api/health

# Check database tables were created
mysql -u phuser -p phishing_hunter -e "SHOW TABLES;"
# Should show: scenarios, simulation_answers, simulations, users

# Check scenarios were seeded
mysql -u phuser -p phishing_hunter -e "SELECT COUNT(*) FROM scenarios;"
# Should return: 10
```

---

## Step 9 — Create Your First Admin Account

Register via the web UI using an email ending in `.admin.edu`:
- Example: `admin@university.admin.edu`

Or create one directly in MySQL:
```bash
# First generate a bcrypt hash for your password
node -e "const b=require('bcryptjs');b.hash('YourAdminPassword123!',12).then(h=>console.log(h));"

# Then insert into database
mysql -u phuser -p phishing_hunter
```
```sql
INSERT INTO users (email, password_hash, role)
VALUES ('admin@university.admin.edu', 'PASTE_HASH_HERE', 'admin');
```

---

## Maintenance Commands

```bash
# View backend logs
pm2 logs phishing-hunter-api

# Restart backend after code changes
pm2 restart phishing-hunter-api

# Update backend code
cd /home/phishing-hunter-api
git pull  # or re-upload files
npm install --production
pm2 restart phishing-hunter-api

# Update frontend (rebuild locally, re-upload build/ folder)
# local: npm run build
# scp -r ./build/* root@SERVER:/var/www/html/

# Monitor server resources
pm2 monit

# Backup database
mysqldump -u phuser -p phishing_hunter > backup_$(date +%Y%m%d).sql
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| API returns 502 Bad Gateway | PM2 not running: `pm2 restart phishing-hunter-api` |
| Can't login / register | Check `.env` has correct DB credentials |
| Pages return 404 on refresh | Check `.htaccess` is in `/var/www/html/` |
| DB connection refused | Check DB_HOST, DB_USER, DB_PASSWORD in `.env` |
| JWT errors | Ensure JWT_SECRET is set and consistent |
| Port 3001 refused | Node crashed: check `pm2 logs phishing-hunter-api` |

---

## Security Checklist

- [x] JWT secret is long (64+ chars) and random
- [x] Database user has ONLY privileges on phishing_hunter db
- [x] `.env` file is NOT in web root or version control
- [x] HTTPS enabled with valid SSL certificate
- [x] Direct port 3001 blocked by firewall
- [x] Rate limiting active on auth endpoints
- [x] All passwords hashed with bcrypt (cost factor 12)
- [x] Input validation on all API endpoints
- [x] Parameterized SQL queries (no SQL injection)
