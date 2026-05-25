# Deployment Guide - BNI Gold Members Romania

## Quick Start - Local Testing

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# App available at http://localhost:3000
```

## Production Build

### Build for Production

```bash
# Create optimized build
npm run build

# Test production build locally
npm run start
```

### Build Output

- `.next/` - Compiled Next.js application
- `public/` - Static assets
- `.env.local` - Environment configuration

## Deployment Options

### Option 1: Vercel (Recommended)

**Easiest option** - built for Next.js apps

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# For production
vercel --prod
```

**Benefits:**
- Automatic deployments from git
- Serverless functions
- Built-in SSL/HTTPS
- CDN included
- Preview URLs for PRs

### Option 2: Hosterion (Resize Media Server)

**Current provider:** `lyssa.hosterion.net`

#### Prerequisites
- cPanel access
- Node.js runtime enabled (contact support)
- SSH access

#### Steps

1. **Build on local machine:**
```bash
npm run build
```

2. **Create deployment directory via cPanel:**
   - New subdomain: `bnigoldmembers.resize-media.com`
   - Document root: `/home/username/public_html/bni`

3. **Upload files via FTP:**
```
.next/               → /home/username/public_html/bni/.next/
public/              → /home/username/public_html/bni/public/
node_modules/        → /home/username/public_html/bni/node_modules/
package.json         → /home/username/public_html/bni/package.json
.env.local          → /home/username/public_html/bni/.env.local
```

4. **SSH and install/start:**
```bash
ssh user@lyssa.hosterion.net
cd /home/username/public_html/bni
npm install --production
npm run start
```

5. **cPanel Node.js App Manager:**
   - Point to application directory: `/home/username/public_html/bni`
   - Application startup file: `npm start`
   - Node.js version: 18+ (or available version)
   - Click "Create"

6. **Apache Configuration (.htaccess):**
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Pass requests to Node.js backend
  RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]
  
  # Handle SPA routing
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^ /index.html [QSA,L]
</IfModule>
```

### Option 3: Docker (Advanced)

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY .next ./
COPY public ./public

EXPOSE 3000

CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t bni-gold-members .
docker run -p 3000:3000 bni-gold-members
```

## Post-Deployment

### 1. Configure DNS

Point subdomain to server:
```
bnigoldmembers.resize-media.com  →  server.ip.address
```

### 2. SSL Certificate

**Hosterion:**
- Use AutoSSL in cPanel (automatic)

**Vercel:**
- Automatic SSL included

### 3. Database Setup (When Ready)

```bash
# Install Prisma
npm install prisma @prisma/client

# Create schema
npx prisma init

# Configure MySQL in .env.local
DATABASE_URL="mysql://user:pass@localhost:3306/resizeme_ops"

# Run migrations
npx prisma migrate deploy
```

### 4. Environment Variables

Update `.env.local` on server:
```env
NEXT_PUBLIC_SITE_NAME=BNI Gold Members Romania
NEXT_PUBLIC_SUBDOMAIN=bnigoldmembers.resize-media.com
DATABASE_URL=mysql://...
ADMIN_PASSWORD=your_secure_password
NODE_ENV=production
```

### 5. Monitoring & Logs

**Hosterion:**
- Check logs in cPanel → Software → Application Manager
- Error logs: `~/.pm2/logs/`

**Vercel:**
- Dashboard at vercel.com
- Real-time logs and analytics

## Maintenance

### Updates
```bash
npm update
npm run build
# Deploy updated build
```

### Backups
- Database backups (cPanel database tools)
- Code backups (git repository)

### Monitoring
- Check application health: http://bnigoldmembers.resize-media.com
- Monitor error logs regularly
- Set up uptime monitoring (e.g., UptimeRobot)

## Troubleshooting

### Port already in use
```bash
# Kill process on port 3000
lsof -ti :3000 | xargs kill -9
```

### Node modules issues
```bash
rm -rf node_modules
npm install
```

### Build fails
```bash
npm run build --verbose
```

### Memory issues on Hosterion
- Increase Node.js memory
- Contact Hosterion support
- Consider Vercel for better resource management

## Performance Tips

1. Enable caching headers in `.env.local`
2. Use Vercel CDN for static assets
3. Optimize database queries (when DB added)
4. Monitor Core Web Vitals
5. Set up error tracking (Sentry, etc.)

## Support

- **Hosterion Support:** Contact support portal
- **Node.js Issues:** Check Node.js logs
- **App Issues:** Check `.next/` build and error logs
- **DNS Issues:** Contact domain registrar

---

Last Updated: May 2026
