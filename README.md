# Entrada - California Guardianship Form Generator

A web application for generating SIJS (Special Immigrant Juvenile Status) guardianship forms efficiently with progressive disclosure and auto-save functionality.

## 🚀 Features

- **Progressive Disclosure**: Reduces overwhelming 122 fields to 3-5 visible at a time
- **Auto-Save**: Saves every 2 seconds after user stops typing - never lose data
- **Multi-Step Interview**: Guided form collection across 6 main sections
- **Mobile Responsive**: Professional legal interface that works on all devices
- **Case Management**: Dashboard to track and resume multiple cases

## 🛠 Tech Stack

- **Framework**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS + ShadCN UI
- **Database**: Supabase (PostgreSQL with RLS)
- **Authentication**: Google SSO via Supabase Auth
- **PDF Generation**: Adobe PDF Services API (coming soon)
- **State Management**: React hooks with auto-save

## 📋 Quick Start

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## 📱 What's Built

### ✅ Current Features
- Professional homepage with feature overview
- Dashboard with case management (mock data)
- Progressive disclosure interview form (Minor Information section)
- Auto-save simulation with visual feedback
- Mobile-responsive design
- Professional legal styling

### 🎯 Progressive Disclosure Demo

The Minor Information section showcases the core UX pattern:

1. **Always visible**: Name, Date of Birth, Gender
2. **Conditional**: Immigration fields only appear if "Not a US citizen"
3. **Conditional**: Sibling fields only appear if "Has siblings"

This reduces overwhelming forms to 3-5 fields at a time while maintaining complete data collection.

## 🚧 Next Steps

1. **Set up Supabase**: Create project and configure authentication
2. **Implement real auto-save**: Connect to Supabase database
3. **Complete all form sections**: Guardian, Parents, SIJS, Court Info
4. **Add PDF generation**: Adobe API integration

## 📚 Documentation

See the `/guidelines/` folder for complete technical specifications:
- Form field inventory (122 fields)
- UX implementation guidelines
- Design system specifications
- Database schema

## 🔐 Environment Setup

Create `.env.local`:

```env
# Supabase (required for production)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key

# Adobe PDF Services (required for PDF generation)
ADOBE_CLIENT_ID=your_adobe_client_id
ADOBE_CLIENT_SECRET=your_adobe_client_secret
ADOBE_ORGANIZATION_ID=your_adobe_org_id
```

This is a demo version that works without these credentials using mock data.
