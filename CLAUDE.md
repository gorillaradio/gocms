# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GoCMS is a simple CMS system built with Next.js for creating and managing simple business websites with an integrated admin panel. The project follows a philosophy of controlled design where developers/agencies control layout and structure while clients can only modify content (text, images).

## Tech Stack

- **Framework**: Next.js 15.4.6 with App Router
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS v4
- **Runtime**: React 19.1.0
- **Fonts**: Geist Sans and Geist Mono from next/font/google

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Project Architecture

This is a fresh Next.js project that will evolve into a CMS system. The planned architecture includes:

### Current Structure

- `src/app/` - Next.js App Router structure with layout.tsx and page.tsx
- `public/` - Static assets including SVG icons
- Standard Next.js configuration files

### Planned Architecture (from docs/mvp-plan.md)

- **Core/Client Separation**: The system is designed to separate core CMS functionality from client-specific configurations
- **Block-based Content**: Content will be organized into reusable blocks (Hero, Cards, Gallery, Text) with predefined variants
- **Database**: Prisma ORM with SQLite for development, PostgreSQL for production
- **Authentication**: Auth.js (NextAuth v5) for user authentication
- **Admin Panel**: Built with ShadCN UI components for content management

### Future Structure

```
/
├── app/
│   ├── (public)/          # Public site
│   └── admin/             # Admin panel
├── core/                  # Core CMS functionality (future npm package)
├── client/                # Client-specific configurations
├── prisma/                # Database schema and migrations
└── public/uploads/        # User uploaded files
```

## Key Design Principles

1. **Controlled Design**: Developers control layout/structure, clients control content only
2. **Performance First**: Optimized code, no heavy page builders
3. **Block-based Content**: Versatile, reusable content blocks with predefined variants
4. **Multi-client Ready**: Architecture supports scaling to multiple clients with shared core

## Planned Features

- Block-based content system with Hero, Cards, Gallery, and Text blocks
- Admin panel for content editing (no structural changes allowed)
- Image upload and optimization
- User authentication and management
- Site configuration system
- Multi-client support through core/client separation

## Path Alias

- `@/*` maps to `./src/*` for clean imports

## Styling Guidelines

- **ALWAYS use ShadCN/Tailwind CSS variables** for colors instead of hard-coded values
- Use semantic color variables: `primary`, `secondary`, `muted`, `background`, `foreground`, etc.
- Example: `bg-primary text-primary-foreground` instead of `bg-blue-600 text-white`
- Example: `text-muted-foreground` instead of `text-gray-600`
- This ensures consistent theming and proper dark mode support

## Notes

- This is currently a fresh Next.js installation
- The comprehensive MVP plan is documented in `docs/mvp-plan.md`
- The system overview and philosophy are detailed in `docs/overview.md`
- Project uses strict TypeScript configuration
- Tailwind CSS v4 is configured with PostCSS
- npm run dev should be launched manually by user
