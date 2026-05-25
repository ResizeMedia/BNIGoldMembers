# BNI Gold Members - Setup Guide

## Project Overview

Next.js 14 application for BNI Gold Members Romania enabling:
- Member directory & networking
- Recommendation/referral sharing
- Free domain management for launching groups
- Executive director dashboard

## Folder Structure

```
bni/
├── app/
│   ├── api/                    # API endpoints
│   │   ├── members/route.ts    # GET members
│   │   ├── domains/route.ts    # GET domains
│   │   └── recommendations/route.ts  # GET/POST recommendations
│   ├── admin/                  # Admin dashboard
│   │   └── page.tsx
│   ├── members/                # Member directory
│   │   └── page.tsx
│   ├── recommendations/        # Recommendations form
│   │   └── page.tsx
│   ├── domains/                # Domain listings
│   │   └── page.tsx
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home page
│   ├── globals.css             # Global styles
│   └── favicon.ico
│
├── components/
│   └── Navigation.tsx          # Navigation bar
│
├── public/
│   └── [static assets]
│
├── .env.local                  # Environment config
├── .env.example                # Example env
├── tsconfig.json               # TypeScript config
├── tailwind.config.ts          # Tailwind config
├── next.config.mjs             # Next.js config
├── package.json                # Dependencies
│
├── README_BNI.md               # Project README
├── SETUP.md                    # This file
└── DEPLOYMENT.md               # Deployment guide
```

## Installation

### 1. Prerequisites
- Node.js 18+ (v20 recommended)
- npm 8+ or yarn 3+
- Git (optional)

### 2. Install Dependencies
```bash
cd C:\CLAUDE\bni
npm install
```

### 3. Environment Setup
Copy `.env.example` → `.env.local`:
```bash
cp .env.example .env.local
```

Or manually create `.env.local`:
```env
NEXT_PUBLIC_SITE_NAME=BNI Gold Members Romania
NEXT_PUBLIC_API_URL=http://localhost:3000/api
ADMIN_PASSWORD=admin2024
NODE_ENV=development
PORT=3000
```

## Development

### Start Dev Server
```bash
npm run dev
```

Server runs on **http://localhost:3000**

Hot reload enabled - changes auto-refresh in browser.

### Build for Production
```bash
npm run build
npm run start
```

## Project Pages

| Route | File | Purpose |
|-------|------|---------|
| `/` | `app/page.tsx` | Home/landing page |
| `/members` | `app/members/page.tsx` | Member directory |
| `/recommendations` | `app/recommendations/page.tsx` | Submit recommendations |
| `/domains` | `app/domains/page.tsx` | Available free domains |
| `/admin` | `app/admin/page.tsx` | Executive director dashboard |

### Admin Dashboard
- **URL:** http://localhost:3000/admin
- **Password:** `admin2024`
- Features:
  - View statistics (members, recommendations, domains)
  - Review pending recommendations
  - Approve/reject recommendations
  - Member management

## API Endpoints

Base URL: `http://localhost:3000/api`

```
GET  /api/members                 # Fetch all members
GET  /api/domains                 # Fetch available domains
GET  /api/recommendations         # Fetch all recommendations
POST /api/recommendations         # Submit new recommendation
```

### Example API Call

Submit recommendation:
```bash
curl -X POST http://localhost:3000/api/recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "recommendingMember": "John Doe",
    "recommendedMember": "Ana Popescu",
    "businessDescription": "IT Consulting Services",
    "referralDetails": "Excellent technical team..."
  }'
```

## Technologies Used

- **Next.js 14** - React framework
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling (no build step)
- **Node.js** - Server runtime

## Key Features

### 1. Members Directory
- Browse active members
- View business profiles
- Quick recommendation access

### 2. Recommendations
- Form-based submission
- Required fields validation
- Success feedback
- Future: Email notifications

### 3. Domain Management
- List of 5+ free domains
- Group assignments
- Domain request functionality
- Future: Automated allocation

### 4. Admin Dashboard
- Protected with password
- Statistics & metrics
- Recommendation queue
- Member/group management

## Configuration Files

### `next.config.mjs`
Next.js configuration (build settings, redirects, etc.)

### `tsconfig.json`
TypeScript configuration with path aliases
- `@/*` → `./`

### `tailwind.config.ts`
Tailwind CSS customization

### `.eslintrc.json`
ESLint rules for code quality

## Development Tips

### Code Style
- Use TypeScript for type safety
- Components: PascalCase files
- Utilities: camelCase
- Constants: UPPERCASE

### Components
- Prefer functional components
- Use React hooks (useState, useEffect)
- 'use client' for interactive components
- Props typed with TypeScript interfaces

### Styling
- Tailwind classes for styling
- Use theme colors from config
- Mobile-first design approach
- Responsive: sm:, md:, lg:, xl: prefixes

### Form Handling
- HTML5 validation attributes
- State management with useState
- Form submission prevent default
- Client-side validation

## Common Commands

```bash
npm install              # Install dependencies
npm run dev             # Start dev server (port 3000)
npm run build           # Create production build
npm run start           # Start production server
npm run lint            # Run ESLint
npm run type-check      # Run TypeScript check
```

## Database Integration (Future)

When ready to add database:

```bash
npm install mysql2 prisma @prisma/client
npx prisma init
# Configure .env.local with DATABASE_URL
npx prisma db push
```

## Performance

- **Build time:** ~10-15 seconds
- **Dev reload:** ~1-2 seconds
- **Production size:** ~5-10 MB (optimized)

## Testing

Current: Manual testing via browser

Future additions:
- Jest + React Testing Library
- E2E tests with Playwright
- API testing

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for:
- Vercel deployment
- Hosterion/cPanel setup
- Docker containerization
- Production configuration

## Troubleshooting

### Issue: Port 3000 already in use
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti :3000 | xargs kill -9
```

### Issue: Dependencies not installing
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: TypeScript errors
```bash
npm run type-check
# Fix errors in code, then rebuild
```

### Issue: Slow build time
- Clear `.next/` folder: `rm -rf .next`
- Rebuild: `npm run build`

## Support

- **Docs:** [README_BNI.md](README_BNI.md)
- **Deploy:** [DEPLOYMENT.md](DEPLOYMENT.md)
- **Issues:** Check console errors
- **Admin:** ed@bnigoldmembers.com

---

**Setup Complete!** 🎉

Run `npm run dev` and open http://localhost:3000
