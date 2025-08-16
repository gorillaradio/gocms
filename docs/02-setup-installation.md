# Setup and Installation

## Prerequisites

- **Node.js**: Version 18.0 or higher
- **npm**: Version 8.0 or higher (comes with Node.js)
- **Git**: For version control

## Initial Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone [repository-url]
cd gocms

# Install dependencies
npm install
```

### 2. Environment Configuration

Create environment files for development:

```bash
# Copy environment template
cp .env.example .env.local
```

Configure the following environment variables:

```env
# Database
DATABASE_URL="file:./dev.db"

# JWT Secret (generate a secure random string)
JWT_SECRET="your-super-secure-jwt-secret-key-here"

# Next.js Environment
NODE_ENV="development"
```

### 3. Database Setup

Initialize and set up the SQLite database:

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed the database with initial data
npm run db:seed
```

### 4. Development Server

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Database Management

### Prisma Commands

```bash
# Generate Prisma client after schema changes
npx prisma generate

# Create and apply a new migration
npx prisma migrate dev --name migration_name

# Reset database (caution: deletes all data)
npx prisma migrate reset

# View database in Prisma Studio
npx prisma studio

# Seed database with test data
npx prisma db seed
```

### Database Location

Development database is stored as `prisma/dev.db` (SQLite file).

## Initial Admin User

The system includes a seeding script that creates an initial admin user:

- **Email**: `admin@example.com`
- **Password**: `admin123`

Change these credentials immediately after first login.

## Project Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm start           # Start production server
npm run lint        # Run ESLint

# Database
npm run db:seed     # Seed database with test data
npm run db:reset    # Reset database (careful!)
npm run db:studio   # Open Prisma Studio
```

## Directory Structure After Setup

```
gocms/
├── .env.local              # Environment variables
├── .next/                  # Next.js build files
├── node_modules/           # Dependencies
├── prisma/
│   ├── dev.db             # SQLite database
│   ├── migrations/        # Database migrations
│   └── schema.prisma      # Database schema
├── public/                # Static assets
├── src/                   # Source code
└── docs/                  # Documentation
```

## Verification Steps

After setup, verify everything works:

1. **Development Server**: Visit `http://localhost:3000`
2. **Admin Access**: Go to `http://localhost:3000/admin`
3. **Login**: Use seeded admin credentials
4. **Database**: Check Prisma Studio at `http://localhost:5555`

## Common Issues

### Port Already in Use

If port 3000 is busy:

```bash
# Use different port
npm run dev -- -p 3001
```

### Database Connection Issues

If database connection fails:

```bash
# Regenerate Prisma client
npx prisma generate

# Check database file exists
ls -la prisma/dev.db
```

### Environment Variables

Ensure `.env.local` exists and contains required variables:
- `DATABASE_URL`
- `JWT_SECRET`

### Permission Issues

On macOS/Linux, ensure proper file permissions:

```bash
chmod 755 prisma/
chmod 644 prisma/dev.db
```

## Production Setup

For production deployment:

1. **Environment**: Set `NODE_ENV=production`
2. **Database**: Use PostgreSQL instead of SQLite
3. **JWT Secret**: Use a cryptographically secure random string
4. **Build**: Run `npm run build` before deployment

Example production environment:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/gocms"
JWT_SECRET="[64-character-secure-random-string]"
NODE_ENV="production"
```

## Development Workflow

1. **Make changes** to source code
2. **Test locally** with `npm run dev`
3. **Run database migrations** if schema changed
4. **Test build** with `npm run build`
5. **Commit changes** to version control

See [Development Workflow](./09-development-workflow.md) for detailed guidelines.