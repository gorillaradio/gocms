# API Documentation

## Overview

GoCMS provides a RESTful API for content management operations. The API is built using Next.js App Router API routes and focuses on page and block manipulation for the admin interface.

## API Architecture

```mermaid
graph TB
    A[Admin Interface] --> B[API Routes]
    B --> C[Database Operations]
    B --> D[Authentication Check]
    
    E[/api/pages/[id]] --> F[PATCH: Update Page]
    
    G[Server Actions] --> H[User Authentication]
    G --> I[Page Management]
    
    J[Middleware] --> K[Route Protection]
    K --> L[Session Verification]
```

## Authentication

All API routes inherit the same JWT-based authentication system. Protected routes require a valid session cookie.

### Authentication Headers

API routes automatically receive authentication via HttpOnly cookies:

```typescript
const token = request.cookies.get('session')?.value
const session = await verifySessionToken(token)
```

## API Endpoints

### Pages API

#### Update Page Blocks

Updates block order and field values for a specific page.

```http
PATCH /api/pages/[id]
```

**Parameters:**
- `id` (string): Page ID (not used directly but required for route)

**Request Body:**
```json
{
  "blocks": [
    {
      "id": "block_id",
      "type": "hero",
      "order": 1,
      "fields": [
        {
          "id": "field_id",
          "fieldName": "main_title",
          "displayName": "Main Title",
          "value": "Welcome to Our Site"
        }
      ]
    }
  ]
}
```

**Response:**
```json
{
  "success": true
}
```

**Error Response:**
```json
{
  "error": "Failed to update page",
  "details": "Specific error message"
}
```

**Implementation Details:**

```typescript
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const body = await request.json();
  const { blocks } = body;

  await prisma.$transaction(async (tx) => {
    for (const block of blocks) {
      // Update block order
      await tx.block.update({
        where: { id: block.id },
        data: { order: block.order }
      });
      
      // Update block fields
      if (block.fields && block.fields.length > 0) {
        for (const field of block.fields) {
          await tx.blockField.update({
            where: { id: field.id },
            data: { 
              value: field.value,
              displayName: field.displayName
            }
          });
        }
      }
    }
  });

  return NextResponse.json({ success: true });
}
```

## Server Actions

Server Actions provide form-based operations for authentication and content management.

### Authentication Actions

Located in `/src/app/actions/auth.ts`:

#### Register User

```typescript
export async function registerAction(formData: FormData)
```

**Form Fields:**
- `email` (string): User email address
- `password` (string): User password
- `name` (string): User display name

**Process:**
1. Validates required fields
2. Checks email uniqueness
3. Hashes password
4. Creates user record
5. Establishes session
6. Redirects to admin

#### Login User

```typescript
export async function loginAction(formData: FormData)
```

**Form Fields:**
- `email` (string): User email
- `password` (string): User password

**Process:**
1. Validates credentials
2. Verifies password hash
3. Creates session
4. Redirects to admin

#### Logout User

```typescript
export async function logoutAction()
```

**Process:**
1. Deletes session cookie
2. Redirects to login

## Error Handling

### Standard Error Responses

**HTTP Status Codes:**
- `200`: Success
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (authentication required)
- `404`: Not Found (resource doesn't exist)
- `500`: Internal Server Error

**Error Response Format:**
```json
{
  "error": "Error description",
  "details": "Specific error details (optional)"
}
```

### Transaction Safety

Database operations use Prisma transactions for data consistency:

```typescript
await prisma.$transaction(async (tx) => {
  // Multiple related operations
  // All succeed or all fail
});
```

## Request/Response Examples

### Update Page Content

**Request:**
```bash
curl -X PATCH \
  -H "Content-Type: application/json" \
  -d '{
    "blocks": [
      {
        "id": "clm123abc",
        "type": "hero",
        "order": 1,
        "fields": [
          {
            "id": "clm456def",
            "fieldName": "hero_title",
            "displayName": "Hero Title",
            "value": "New Hero Title"
          }
        ]
      }
    ]
  }' \
  http://localhost:3000/api/pages/clm789ghi
```

**Response:**
```json
{
  "success": true
}
```

### Authentication via Form

**Login Form Submission:**
```html
<form action="/login" method="POST">
  <input name="email" value="admin@example.com" />
  <input name="password" type="password" value="admin123" />
  <button type="submit">Login</button>
</form>
```

**Response:** Redirect to `/admin` with session cookie set.

## Data Validation

### Input Validation

**Block Updates:**
- Block ID must exist in database
- Order must be valid integer
- Field IDs must exist and belong to block

**Authentication:**
- Email format validation
- Password length requirements
- Required field checks

### Type Safety

TypeScript interfaces ensure type safety:

```typescript
interface Block {
  id: string;
  type: string;
  order: number;
  fields?: BlockField[];
}

interface BlockField {
  id: string;
  fieldName: string;
  displayName: string;
  value: string;
}
```

## Database Operations

### Optimized Queries

**Block Updates with Relations:**
```typescript
// Efficient update pattern
await prisma.block.update({
  where: { id: blockId },
  data: { order: newOrder },
  include: { fields: true }
});
```

**Bulk Field Updates:**
```typescript
// Transaction-safe bulk updates
await prisma.$transaction(
  fields.map(field => 
    prisma.blockField.update({
      where: { id: field.id },
      data: { value: field.value }
    })
  )
);
```

## API Usage in Frontend

### Fetch API Usage

```typescript
// Update page blocks
const response = await fetch(`/api/pages/${pageId}`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ blocks: updatedBlocks })
});

if (response.ok) {
  const result = await response.json();
  console.log('Update successful:', result.success);
}
```

### Server Action Usage

```typescript
// In React component
import { loginAction } from '@/app/actions/auth';

export function LoginForm() {
  return (
    <form action={loginAction}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button type="submit">Login</button>
    </form>
  );
}
```

## Security Considerations

### CSRF Protection

- Server Actions provide built-in CSRF protection
- API routes should validate request origin in production
- SameSite cookie configuration prevents CSRF attacks

### Input Sanitization

```typescript
// Validate and sanitize inputs
const sanitizedBlocks = blocks.filter(block => 
  block.id && 
  typeof block.order === 'number' &&
  block.fields?.every(field => field.id && field.value !== undefined)
);
```

### Rate Limiting

Consider implementing rate limiting for production:

```typescript
// Example rate limiting (not implemented)
const rateLimiter = new Map();

export function rateLimit(request: NextRequest) {
  const ip = request.ip;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 100;
  
  // Implementation details...
}
```

## Development and Testing

### API Testing

**Manual Testing:**
```bash
# Test with curl
curl -X PATCH \
  -H "Content-Type: application/json" \
  -b "session=your-session-token" \
  -d '{"blocks":[...]}' \
  http://localhost:3000/api/pages/page-id
```

**Console Logging:**
The API includes detailed console logging for debugging:

```typescript
console.log('API received blocks:', blocks.map(b => ({ 
  id: b.id, 
  type: b.type, 
  order: b.order, 
  fieldsCount: b.fields?.length || 0 
})));
```

### Error Monitoring

**Transaction Errors:**
```typescript
try {
  await prisma.$transaction(/* operations */);
  console.log('✓ Successfully updated');
} catch (blockError) {
  console.error(`ERROR updating block:`, blockError);
  throw blockError;
}
```

## Future API Enhancements

### Planned Endpoints

- `GET /api/pages` - List all pages
- `POST /api/pages` - Create new page
- `DELETE /api/pages/[id]` - Delete page
- `POST /api/upload` - File upload endpoint
- `GET /api/settings` - Site settings
- `PATCH /api/settings` - Update settings

### API Versioning

Consider API versioning for future releases:

```
/api/v1/pages/[id]
/api/v2/pages/[id]
```