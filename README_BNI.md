# BNI Gold Members Romania - Web Application

Modern web platform for BNI Gold Members enabling recommendations sharing, member networking, and domain management for group launches.

## Features

✓ **Member Directory** - Browse active BNI Gold Members  
✓ **Recommendations System** - Share business referrals with fellow members  
✓ **Domain Management** - Free domains for new groups launching  
✓ **Executive Director Dashboard** - Manage members, recommendations, and groups  
✓ **Responsive Design** - Mobile-friendly interface with Tailwind CSS  

## Tech Stack

- **Framework**: Next.js 14 (React 18)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Server**: Node.js / Express (Next.js built-in)

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
cd C:\CLAUDE\bni
npm install
```

### Development

```bash
npm run dev
```

Server runs at `http://localhost:3000`

### Production Build

```bash
npm run build
npm run start
```

## Project Structure

```
app/
├── layout.tsx           # Root layout with Navigation
├── page.tsx             # Home page
├── members/page.tsx     # Members directory
├── recommendations/page.tsx  # Recommendation form
├── domains/page.tsx     # Available domains
├── admin/page.tsx       # Executive director dashboard
└── globals.css          # Global styles

components/
├── Navigation.tsx       # Navigation bar

public/
├── favicon.ico
```

## Pages Overview

### Home (`/`)
Landing page with overview of platform features and quick access to main sections.

### Members (`/members`)
Directory of active BNI Gold Members with ability to give recommendations.

### Recommendations (`/recommendations`)
Form-based interface for members to submit recommendations to executive director.
- Recommending member name
- Recommended member/business
- Business description
- Referral details

### Domains (`/domains`)
Available free domains for BNI groups launching new initiatives.
- List of 5+ free domains
- Group assignments
- Domain request functionality

### Admin Dashboard (`/admin`)
Executive director access panel (protected with password).

**Login**: admin2024

Features:
- Dashboard statistics
- Pending recommendations review
- Recommendation approval/rejection
- Member management
- Group administration

## Environment Setup

Create `.env.local` for configuration:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_SITE_NAME=BNI Gold Members Romania
```

## Deployment

### Hosterion (PHP 8+)
1. Build: `npm run build`
2. Deploy `.next/` and `public/` folders via FTP
3. Set up Node.js runtime via cPanel

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

## API Routes (To Be Added)

- `POST /api/recommendations` - Submit recommendation
- `GET /api/recommendations` - Fetch pending recommendations
- `PUT /api/recommendations/:id` - Approve/reject recommendation
- `GET /api/members` - Fetch member list
- `GET /api/domains` - Fetch available domains

## Database

Currently using mock data. To integrate with MySQL:

1. Create database: `resizeme_ops`
2. Install: `npm install mysql2 prisma`
3. Set up Prisma schema
4. Add `.env.local`:
```env
DATABASE_URL="mysql://user:password@localhost:3306/resizeme_ops"
```

## Security Notes

- Admin password currently hardcoded (use proper authentication in production)
- Implement proper authentication (JWT, OAuth, etc.)
- Validate all forms server-side
- Add CSRF protection
- Enable HTTPS for production

## Future Enhancements

- [ ] Database integration (MySQL)
- [ ] User authentication system
- [ ] Email notifications
- [ ] Recommendation history
- [ ] Member profiles with detailed info
- [ ] Group management features
- [ ] Reporting/analytics
- [ ] Mobile app

## Contact

**Email**: ed@bnigoldmembers.com  
**Organization**: Resize Media  
**Subdomain**: bnigoldmembers.resize-media.com

---

Built with Next.js 14 and Tailwind CSS
