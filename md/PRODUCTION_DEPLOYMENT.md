# 🚀 Production Deployment Guide

## ❓ Vấn đề: Không thể chạy `npm run create-admin` trên server

Khi deploy lên web hosting (Vercel, Railway, Heroku, VPS, etc.), bạn **KHÔNG THỂ** chạy interactive script `npm run create-admin` vì:
- ❌ Không có terminal/console để nhập input
- ❌ Không có keyboard để gõ password
- ❌ Deployment là automated process

---

## ✅ Giải pháp: 3 cách tạo admin user trên production

### **Cách 1: Environment Variables (Khuyến nghị ⭐)**

Set environment variables trên hosting platform, sau đó chạy script tự động.

#### **Bước 1: Set Environment Variables**

**Trên Vercel:**
```
Project Settings → Environment Variables:
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password-here
ADMIN_EMAIL=admin@yoursite.com
ADMIN_DISPLAY_NAME=Administrator
```

**Trên Railway/Render:**
```
Settings → Environment:
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password-here
ADMIN_EMAIL=admin@yoursite.com
ADMIN_DISPLAY_NAME=Administrator
```

**Trên VPS (Linux):**
```bash
# Add to .env
echo "ADMIN_USERNAME=admin" >> .env
echo "ADMIN_PASSWORD=your-secure-password-here" >> .env
echo "ADMIN_EMAIL=admin@yoursite.com" >> .env
echo "ADMIN_DISPLAY_NAME=Administrator" >> .env
```

#### **Bước 2: Run Setup Script**

**Option A: Automated deployment script**
```bash
# Linux/Mac
npm run deploy:setup

# Windows
npm run deploy:setup:win
```

Script sẽ:
1. ✅ Install dependencies
2. ✅ Run migrations
3. ✅ Create admin user (using env vars)
4. ✅ Build application

**Option B: Manual steps**
```bash
# 1. Run migration
npm run migrate:auth:unix

# 2. Create user with env vars
npm run create-user:cli
# Reads ADMIN_USERNAME, ADMIN_PASSWORD from environment

# 3. Build
npm run build

# 4. Start
npm start
```

---

### **Cách 2: Command Line Arguments**

Chạy script với arguments (không cần env vars).

```bash
npx tsx database/create-user-cli.ts \
  --username=admin \
  --password=SecurePass123! \
  --email=admin@example.com \
  --display-name="Administrator"
```

**⚠️ Lưu ý:** Password sẽ visible trong command history!

---

### **Cách 3: Registration API (Khi đã deploy xong)**

Enable registration endpoint tạm thời để tự register admin user.

#### **Bước 1: Enable Registration**

Add to `.env`:
```env
REGISTRATION_ENABLED=true
REQUIRE_INVITE_CODE=true
INVITE_CODE=your-secret-invite-code-here
```

#### **Bước 2: Deploy**

Deploy app lên hosting platform.

#### **Bước 3: Register via API**

```bash
curl -X POST https://yoursite.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "SecurePass123!",
    "email": "admin@example.com",
    "displayName": "Administrator",
    "inviteCode": "your-secret-invite-code-here"
  }'
```

**Hoặc dùng Postman/Insomnia:**
```
POST https://yoursite.com/api/auth/register

Body (JSON):
{
  "username": "admin",
  "password": "SecurePass123!",
  "email": "admin@example.com",
  "displayName": "Administrator",
  "inviteCode": "your-secret-invite-code-here"
}
```

#### **Bước 4: Disable Registration**

Sau khi tạo admin xong, **TẮT NGAY** registration:

```env
REGISTRATION_ENABLED=false
```

Redeploy để apply changes.

---

## 🌐 Platform-Specific Guides

### **Vercel**

**1. Setup Database:**
```bash
# Create PostgreSQL on Vercel Postgres or external provider
# Get DATABASE_URL
```

**2. Set Environment Variables:**
```
Project → Settings → Environment Variables:
DATABASE_URL=postgresql://...
NODE_ENV=production
ADMIN_USERNAME=admin
ADMIN_PASSWORD=SecurePass123!
ADMIN_EMAIL=admin@example.com
```

**3. Add Build Command:**
```json
// package.json
{
  "scripts": {
    "vercel-build": "npm run migrate:auth:unix && npm run create-user:cli && next build"
  }
}
```

**4. Deploy:**
```bash
vercel --prod
```

---

### **Railway**

**1. Create PostgreSQL Database:**
- Add PostgreSQL service
- Copy DATABASE_URL

**2. Set Environment Variables:**
```
Settings → Variables:
DATABASE_URL=${{Postgres.DATABASE_URL}}
ADMIN_USERNAME=admin
ADMIN_PASSWORD=SecurePass123!
ADMIN_EMAIL=admin@example.com
```

**3. Add Deploy Script:**

Create `railway.json`:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run deploy:setup && npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**4. Deploy:**
- Push to GitHub
- Connect Railway to repo
- Deploy automatically

---

### **Render**

**1. Create PostgreSQL Database:**
- New PostgreSQL service
- Copy Internal Database URL

**2. Set Environment Variables:**
```
Environment → Environment Variables:
DATABASE_URL=postgresql://...
ADMIN_USERNAME=admin
ADMIN_PASSWORD=SecurePass123!
```

**3. Add Build Command:**
```
Build Command: npm run deploy:setup
Start Command: npm start
```

**4. Deploy:**
- Connect GitHub repo
- Click "Create Web Service"

---

### **VPS (Ubuntu/Debian)**

**1. SSH to server:**
```bash
ssh user@your-server-ip
```

**2. Clone repo:**
```bash
git clone https://github.com/your-repo/zalo-bot.git
cd zalo-bot
```

**3. Setup environment:**
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# Create database
sudo -u postgres psql
CREATE DATABASE zalo_bot;
CREATE USER zalo_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE zalo_bot TO zalo_user;
\q
```

**4. Configure .env:**
```bash
cat > .env << EOF
DATABASE_URL=postgresql://zalo_user:secure_password@localhost:5432/zalo_bot
NODE_ENV=production
ADMIN_USERNAME=admin
ADMIN_PASSWORD=SecurePass123!
ADMIN_EMAIL=admin@example.com
EOF
```

**5. Run setup:**
```bash
npm run deploy:setup
```

**6. Start with PM2:**
```bash
# Install PM2
npm install -g pm2

# Start app
pm2 start npm --name "zalo-bot" -- start

# Save PM2 config
pm2 save

# Auto-start on boot
pm2 startup
```

---

### **Docker**

**1. Create Dockerfile:**
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source
COPY . .

# Run setup (migrations + create user)
RUN npm run build

# Expose port
EXPOSE 3000

# Start command
CMD ["npm", "start"]
```

**2. Create docker-compose.yml:**
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: zalo_bot
      POSTGRES_USER: zalo_user
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://zalo_user:secure_password@postgres:5432/zalo_bot
      NODE_ENV: production
      ADMIN_USERNAME: admin
      ADMIN_PASSWORD: SecurePass123!
      ADMIN_EMAIL: admin@example.com
    depends_on:
      - postgres
    command: >
      sh -c "
        npx tsx database/create-user-cli.ts &&
        npm start
      "

volumes:
  postgres_data:
```

**3. Deploy:**
```bash
docker-compose up -d
```

---

## 🔒 Security Best Practices

### **1. Password Management**

❌ **NEVER:**
```bash
# Don't commit to Git
git add .env
git commit -m "Added admin password"  # BAD!

# Don't hardcode in Dockerfile
ENV ADMIN_PASSWORD=changeme  # BAD!

# Don't log password
console.log('Password:', password)  # BAD!
```

✅ **ALWAYS:**
```bash
# Use environment variables
export ADMIN_PASSWORD='SecurePass123!'

# Use secrets manager (AWS, GCP, Azure)
aws ssm put-parameter --name /prod/admin-password --value 'SecurePass123!' --type SecureString

# Rotate passwords regularly
# Use password manager (1Password, LastPass)
```

### **2. .env File Security**

```bash
# Add to .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.production" >> .gitignore

# Set proper permissions on VPS
chmod 600 .env
```

### **3. After First Login**

```bash
# 1. Change admin password immediately
# 2. Disable ADMIN_PASSWORD env var
# 3. Delete from secrets/env vars
# 4. Create additional users with limited privileges
```

---

## 📋 Deployment Checklist

### Pre-Deployment:
- [ ] Set DATABASE_URL in environment
- [ ] Set ADMIN_PASSWORD securely
- [ ] Set NODE_ENV=production
- [ ] Test migrations locally
- [ ] Test user creation locally
- [ ] Build successfully

### Deployment:
- [ ] Run migrations on production DB
- [ ] Create admin user
- [ ] Build application
- [ ] Start server
- [ ] Check logs for errors

### Post-Deployment:
- [ ] Test login with admin credentials
- [ ] Change admin password
- [ ] Delete ADMIN_PASSWORD from env vars
- [ ] Setup HTTPS/SSL
- [ ] Configure firewall
- [ ] Setup monitoring
- [ ] Setup backups
- [ ] Disable registration API (if enabled)

---

## 🆘 Troubleshooting

### "Cannot connect to database"
```bash
# Check DATABASE_URL format
echo $DATABASE_URL

# Test connection
psql "$DATABASE_URL" -c "SELECT NOW();"
```

### "Admin user already exists"
```bash
# Update password instead
npx tsx database/create-user-cli.ts --username=admin --password=NewPassword123!
```

### "Permission denied on VPS"
```bash
# Fix permissions
sudo chown -R $USER:$USER /path/to/app
chmod +x scripts/deploy-setup.sh
```

### "Build fails on Vercel"
```bash
# Add to package.json
"engines": {
  "node": ">=18.0.0"
}
```

---

## 📚 Resources

- **Vercel Docs:** https://vercel.com/docs
- **Railway Docs:** https://docs.railway.app
- **Render Docs:** https://render.com/docs
- **PM2 Docs:** https://pm2.keymetrics.io/docs
- **Docker Docs:** https://docs.docker.com

---

**Status:** ✅ READY FOR PRODUCTION
**Last Updated:** 2026-08-15
