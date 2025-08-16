# Deployment Guide

## Overview

This guide covers deploying GoCMS to production environments, including platform-specific configurations, database setup, security considerations, and monitoring. The system is designed to be deployed on modern hosting platforms with minimal configuration.

## Deployment Architecture

```mermaid
graph TB
    subgraph "Production Environment"
        A[Load Balancer] --> B[Next.js Application]
        B --> C[PostgreSQL Database]
        B --> D[File Storage]
        E[CDN] --> F[Static Assets]
    end
    
    subgraph "Development Environment"
        G[Local Next.js] --> H[SQLite Database]
        G --> I[Local File System]
    end
    
    subgraph "CI/CD Pipeline"
        J[Git Repository] --> K[Build Process]
        K --> L[Testing]
        L --> M[Deployment]
    end
    
    J --> G
    M --> A
```

## Platform Deployment Options

### Vercel (Recommended)

Vercel provides seamless deployment for Next.js applications:

#### 1. Project Setup

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to Vercel
vercel --prod
```

#### 2. Environment Configuration

Configure environment variables in Vercel dashboard:

```bash
# Production environment variables
DATABASE_URL="postgresql://user:pass@host:5432/gocms_prod"
JWT_SECRET="your-production-jwt-secret-64-chars-minimum"
NEXTAUTH_URL="https://your-domain.vercel.app"
NEXTAUTH_SECRET="your-nextauth-secret"
```

#### 3. Database Integration

Vercel integrates well with PostgreSQL providers:

```bash
# Add PostgreSQL integration
vercel env add DATABASE_URL
# Enter your PostgreSQL connection string
```

#### 4. Build Configuration

Create `vercel.json` for deployment settings:

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "rewrites": [
    {
      "source": "/admin/(.*)",
      "destination": "/admin/$1"
    }
  ]
}
```

### Railway

Railway offers simple deployment with integrated PostgreSQL:

#### 1. Project Setup

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Deploy
railway up
```

#### 2. Database Setup

```bash
# Add PostgreSQL service
railway add postgresql

# Get database URL
railway variables
```

#### 3. Environment Variables

```bash
# Set production variables
railway variables set JWT_SECRET=your-secret
railway variables set NODE_ENV=production
```

### Docker Deployment

For containerized deployment:

#### 1. Dockerfile

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### 2. Docker Compose

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/gocms
      - JWT_SECRET=your-production-secret
    depends_on:
      - db
      - migrate
    
  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=gocms
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
      
  migrate:
    build: .
    command: npx prisma migrate deploy
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/gocms
    depends_on:
      - db

volumes:
  postgres_data:
```

#### 3. Build and Run

```bash
# Build and start services
docker-compose up --build

# Run in production
docker-compose -f docker-compose.prod.yml up -d
```

## Database Setup

### PostgreSQL Configuration

#### 1. Migration to PostgreSQL

Update database configuration for production:

```bash
# Update schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

#### 2. Environment Variables

```bash
# PostgreSQL connection string format
DATABASE_URL="postgresql://username:password@hostname:port/database?schema=public"

# Example for Supabase
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"

# Example for Railway
DATABASE_URL="postgresql://postgres:password@containers-us-west-123.railway.app:5432/railway"
```

#### 3. Run Migrations

```bash
# Deploy migrations to production database
npx prisma migrate deploy

# Generate Prisma client for production
npx prisma generate
```

#### 4. Seed Production Database

```bash
# Create admin user in production
npx prisma db seed
```

### Database Providers

#### Supabase

1. Create project at [supabase.com](https://supabase.com)
2. Get connection string from Settings > Database
3. Configure connection:

```bash
# Supabase connection
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
```

#### Railway PostgreSQL

```bash
# Automatic setup with Railway
railway add postgresql
railway variables
# Copy DATABASE_URL from output
```

#### Neon

1. Create database at [neon.tech](https://neon.tech)
2. Get connection string
3. Configure:

```bash
# Neon connection
DATABASE_URL="postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

## Security Configuration

### Environment Variables

Secure all sensitive configuration:

```bash
# Required production environment variables
JWT_SECRET="minimum-32-character-random-string-for-jwt-signing"
DATABASE_URL="postgresql://user:password@host:port/database"
NODE_ENV="production"

# Optional but recommended
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="another-secure-random-string"
```

### Secret Generation

Generate secure secrets:

```bash
# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate NextAuth secret
openssl rand -base64 32
```

### Security Headers

Configure security headers in `next.config.ts`:

```typescript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self'",
            ].join('; ')
          }
        ]
      }
    ]
  }
}

export default nextConfig
```

### HTTPS Configuration

Ensure HTTPS in production:

```typescript
// Middleware for HTTPS redirect
export function middleware(request: NextRequest) {
  // Force HTTPS in production
  if (process.env.NODE_ENV === 'production' && 
      request.headers.get('x-forwarded-proto') !== 'https') {
    return NextResponse.redirect(
      `https://${request.headers.get('host')}${request.nextUrl.pathname}`,
      301
    )
  }
  
  // Your existing auth middleware
  return authMiddleware(request)
}
```

## Performance Optimization

### Static Generation

Optimize page generation:

```typescript
// Generate static pages for public content
export async function generateStaticParams() {
  const pages = await prisma.page.findMany({
    where: { published: true },
    select: { slug: true }
  })
  
  return pages.map((page) => ({
    slug: page.slug
  }))
}

// Cache database queries
export const revalidate = 3600 // Revalidate every hour
```

### Database Optimization

#### Connection Pooling

```typescript
// lib/db.ts - Production database configuration
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  log: process.env.NODE_ENV === 'development' ? ['query'] : ['error'],
  // Connection pool settings for production
  __internal: {
    engine: {
      // Connection pool size
      connection_limit: 10,
      // Connection timeout
      connect_timeout: 60,
      // Query timeout
      query_timeout: 60
    }
  }
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

#### Query Optimization

```typescript
// Optimized queries for production
export async function getPageBySlug(slug: string) {
  return prisma.page.findUnique({
    where: { slug, published: true },
    include: {
      blocks: {
        include: { fields: true },
        orderBy: { order: 'asc' }
      }
    },
    // Cache this query
    cacheStrategy: { ttl: 3600 }
  })
}
```

### CDN Configuration

#### Asset Optimization

```typescript
// next.config.ts - Asset optimization
const nextConfig = {
  images: {
    domains: ['your-cdn-domain.com'],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384]
  },
  
  // Enable static exports for CDN
  trailingSlash: true,
  
  // Optimize bundles
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@radix-ui/react-icons']
  }
}
```

#### Static Asset Hosting

```bash
# Example: Deploy static assets to CDN
aws s3 sync ./public s3://your-cdn-bucket --delete
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

## Monitoring and Logging

### Application Monitoring

#### Error Tracking

```typescript
// lib/monitoring.ts
export function logError(error: Error, context?: Record<string, any>) {
  console.error('Application Error:', {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  })
  
  // Send to monitoring service (Sentry, etc.)
  if (process.env.SENTRY_DSN) {
    // Sentry.captureException(error, { extra: context })
  }
}
```

#### Performance Monitoring

```typescript
// Performance tracking
export function trackPageLoad(slug: string, loadTime: number) {
  console.log('Page Performance:', {
    slug,
    loadTime,
    timestamp: new Date().toISOString()
  })
}

// Database query monitoring
export function trackQuery(query: string, duration: number) {
  if (duration > 1000) {
    console.warn('Slow Query:', {
      query,
      duration,
      timestamp: new Date().toISOString()
    })
  }
}
```

### Health Checks

Create health check endpoints:

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      version: process.env.npm_package_version
    })
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    }, { status: 503 })
  }
}
```

### Log Management

```typescript
// lib/logger.ts
export const logger = {
  info: (message: string, meta?: any) => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      meta,
      timestamp: new Date().toISOString()
    }))
  },
  
  error: (message: string, error?: Error, meta?: any) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: error?.message,
      stack: error?.stack,
      meta,
      timestamp: new Date().toISOString()
    }))
  },
  
  warn: (message: string, meta?: any) => {
    console.warn(JSON.stringify({
      level: 'warn',
      message,
      meta,
      timestamp: new Date().toISOString()
    }))
  }
}
```

## Backup and Recovery

### Database Backups

#### Automated Backups

```bash
#!/bin/bash
# backup.sh - Automated database backup script

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="gocms_backup_$TIMESTAMP.sql"

# Create backup
pg_dump $DATABASE_URL > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Upload to cloud storage
aws s3 cp ${BACKUP_FILE}.gz s3://your-backup-bucket/

# Clean up local files older than 7 days
find . -name "gocms_backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
```

#### Backup Restoration

```bash
# Restore from backup
gunzip gocms_backup_20240101_120000.sql.gz
psql $DATABASE_URL < gocms_backup_20240101_120000.sql
```

### Content Backup

```typescript
// Content export utility
export async function exportContent() {
  const pages = await prisma.page.findMany({
    include: {
      blocks: {
        include: { fields: true }
      }
    }
  })
  
  const backup = {
    timestamp: new Date().toISOString(),
    version: '1.0',
    pages
  }
  
  return JSON.stringify(backup, null, 2)
}

// Content import utility
export async function importContent(backupData: string) {
  const backup = JSON.parse(backupData)
  
  for (const page of backup.pages) {
    await prisma.page.upsert({
      where: { slug: page.slug },
      update: {
        title: page.title,
        headContent: page.headContent,
        blocks: {
          deleteMany: {},
          create: page.blocks
        }
      },
      create: page
    })
  }
}
```

## SSL/TLS Configuration

### Certificate Management

Most hosting platforms handle SSL automatically, but for custom deployments:

```nginx
# nginx configuration
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/private.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

## Deployment Checklist

### Pre-Deployment

- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] SSL certificates configured
- [ ] Security headers implemented
- [ ] Performance optimizations applied
- [ ] Backup strategy implemented
- [ ] Monitoring tools configured

### Post-Deployment

- [ ] Health checks passing
- [ ] Database connectivity verified
- [ ] Authentication working
- [ ] Content editing functional
- [ ] Asset loading correctly
- [ ] Performance metrics normal
- [ ] Error tracking active
- [ ] Backup schedule confirmed

### Rollback Plan

```bash
# Emergency rollback procedure
1. Identify deployment version to rollback to
2. Deploy previous version:
   vercel --prod --force
3. Restore database if needed:
   psql $DATABASE_URL < backup_file.sql
4. Verify functionality
5. Notify team of rollback
```

## Troubleshooting Deployment Issues

### Common Issues

#### Database Connection Errors

```typescript
// Debug database connection
try {
  await prisma.$connect()
  console.log('Database connected successfully')
} catch (error) {
  console.error('Database connection failed:', error)
  // Check: DATABASE_URL format, network access, credentials
}
```

#### Environment Variable Issues

```bash
# Verify environment variables
echo $DATABASE_URL
echo $JWT_SECRET
echo $NODE_ENV

# Check variable loading in application
console.log('Environment check:', {
  hasDatabase: !!process.env.DATABASE_URL,
  hasJwtSecret: !!process.env.JWT_SECRET,
  nodeEnv: process.env.NODE_ENV
})
```

#### Build Errors

```bash
# Clear build cache
rm -rf .next
npm run build

# Check for missing dependencies
npm install

# Verify Prisma client
npx prisma generate
```

#### Asset Loading Issues

```typescript
// Check asset paths in production
console.log('Asset paths:', {
  publicPath: process.env.NEXT_PUBLIC_BASE_PATH,
  assetPrefix: process.env.NEXT_PUBLIC_ASSET_PREFIX,
  cdnUrl: process.env.NEXT_PUBLIC_CDN_URL
})
```

### Debug Tools

```typescript
// Production debugging (remove before final deployment)
if (process.env.NODE_ENV === 'production' && process.env.DEBUG_MODE) {
  console.log('Debug info:', {
    environment: process.env.NODE_ENV,
    database: process.env.DATABASE_URL?.substring(0, 20) + '...',
    timestamp: new Date().toISOString()
  })
}
```

## Scaling Considerations

### Horizontal Scaling

```typescript
// Stateless application design
// - No file system dependencies
// - Database connection pooling
// - Session storage in cookies (JWT)
// - CDN for static assets
```

### Database Scaling

```typescript
// Read replicas for scaling reads
const readOnlyPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_READ_URL
    }
  }
})

// Use read replica for public pages
export async function getPageBySlugReadOnly(slug: string) {
  return readOnlyPrisma.page.findUnique({
    where: { slug, published: true },
    include: {
      blocks: {
        include: { fields: true },
        orderBy: { order: 'asc' }
      }
    }
  })
}
```

## Next Steps

- [Troubleshooting Guide](./09-troubleshooting.md)
- [Performance Monitoring](./10-monitoring.md)
- [API Reference](./11-api-reference.md)