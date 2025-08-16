# Piano MVP - Sistema CMS Semplice

## Fase 1: Setup Iniziale

### 1.1 Creazione progetto Next.js

```bash
npx create-next-app@latest gocms --typescript --tailwind --eslint --app
cd gocms
```

### 1.2 Setup ShadCN per Admin UI (fatto)

```bash
# ⚠️ AGGIORNATO: ShadCN ha cambiato nome da "shadcn-ui" a "shadcn" (Agosto 2024)
npx shadcn@latest init
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add form
npx shadcn@latest add card
npx shadcn@latest add table
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add sonner
npx shadcn@latest add avatar
npx shadcn@latest add separator
npx shadcn@latest add sheet
```

### 1.3 Installazione dipendenze core

```bash
# Database e ORM
npm install prisma @prisma/client (fatto)

# Autenticazione - ⚠️ AGGIORNATO: NextAuth v5 (Auth.js) per Next.js 15
npm install next-auth@beta @auth/prisma-adapter (fatto)

# Validazione e form
npm install zod react-hook-form @hookform/resolvers (fatto)

# Upload e gestione immagini
npm install sharp multer

# Editor testo (futuro)
npm install @tiptap/react @tiptap/starter-kit
```

### 1.3 Struttura cartelle iniziale

```
/
├── app/
│   ├── (public)/          # Sito pubblico
│   │   ├── page.tsx
│   │   └── [slug]/
│   └── admin/             # Pannello admin
│       ├── layout.tsx
│       ├── login/
│       ├── pages/
│       └── settings/
├── core/                  # Sistema core (futuro npm package)
│   ├── components/        # Blocchi riutilizzabili
│   ├── lib/              # Utilities e database
│   └── types/            # TypeScript definitions
├── client/               # Configurazione cliente
│   ├── site.config.ts
│   ├── components/       # Override componenti
│   └── styles/          # Custom styling
├── prisma/
│   ├── schema.prisma
│   └── migrations/
└── public/
    └── uploads/          # File caricati
```

## Fase 2: Database e Modelli

### 2.1 Schema Prisma iniziale

```prisma
// prisma/schema.prisma
model Page {
  id        String   @id @default(cuid())
  slug      String   @unique
  title     String
  blocks    Block[]
  published Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Block {
  id      String @id @default(cuid())
  type    String // "hero", "cards", "gallery", "text"
  variant String // "full", "split", etc.
  props   Json   // Contenuto del blocco
  order   Int    // Ordine nella pagina
  pageId  String
  page    Page   @relation(fields: [pageId], references: [id], onDelete: Cascade)
}

model User {
  id       String @id @default(cuid())
  email    String @unique
  password String
  name     String?
}

model Settings {
  id    String @id @default(cuid())
  key   String @unique
  value String
}
```

### 2.2 Setup SQLite

```bash
# ⚠️ AGGIORNATO: Prisma init ora usa Prisma Postgres per default, specifichiamo SQLite
npx prisma init --datasource-provider sqlite

# Prima migrazione
npx prisma migrate dev --name init

# Genera client
npx prisma generate
```

## Fase 3: Autenticazione

### 3.1 Configurazione Auth.js (NextAuth v5)

- Setup con email/password usando Credentials provider
- Configurazione in file `auth.ts` nella root (nuovo pattern v5)
- Middleware per proteggere routes admin
- Login/logout components con ShadCN UI

### 3.2 Seeding database

- Utente admin di default
- Pagina home iniziale con blocchi di esempio

## Fase 4: Blocchi Base

### 4.1 Sistema blocchi core

Implementare 4 blocchi versatili:

#### Hero Block

```typescript
interface HeroProps {
  title: string;
  subtitle?: string;
  image?: string;
  cta?: {
    text: string;
    link: string;
  };
  variant: "full" | "split" | "minimal";
}
```

#### Cards Block

```typescript
interface CardsProps {
  title?: string;
  cards: Array<{
    title: string;
    description: string;
    image?: string;
    link?: string;
  }>;
  variant: "grid-2" | "grid-3" | "carousel";
}
```

#### Gallery Block

```typescript
interface GalleryProps {
  title?: string;
  images: Array<{
    src: string;
    alt: string;
    caption?: string;
  }>;
  variant: "grid" | "masonry" | "slider";
}
```

#### Text Block

```typescript
interface TextProps {
  content: string; // HTML da editor
  variant: "default" | "centered" | "columns";
}
```

### 4.2 Schema validation con Zod

- Schema per ogni tipo di blocco
- Validazione props in input/output

## Fase 5: Frontend Pubblico

### 5.1 Page renderer dinamico

```typescript
// app/(public)/[slug]/page.tsx
export default async function PublicPage({
  params,
}: {
  params: { slug: string };
}) {
  const page = await getPageBySlug(params.slug);

  return (
    <div>
      {page.blocks.map((block) => (
        <BlockRenderer key={block.id} block={block} />
      ))}
    </div>
  );
}
```

### 5.2 Componenti blocchi

- Implementazione React per ogni tipo
- Styling con Tailwind
- Responsive design

### 5.3 Layout base

- Header/footer configurabili
- Navigation dinamica
- SEO meta tags

## Fase 6: Admin Panel con ShadCN

### 6.1 Layout admin con ShadCN

- Sidebar navigation con Sheet component
- Breadcrumb navigation
- User menu con DropdownMenu
- Toast notifications per feedback

### 6.2 Gestione pagine con ShadCN

- Table component per lista pagine
- Dialog per conferme eliminazione
- Form components per editor blocchi
- Card components per preview blocchi

### 6.3 Form auto-generati con ShadCN

- Form component + react-hook-form
- Input, Textarea, Select components
- File upload con styling ShadCN
- Button components per azioni
- Validazione real-time con toast feedback

### 6.4 Impostazioni base

- Card layout per sezioni impostazioni
- Form per configurazioni sito
- Avatar component per profilo utente

## Fase 7: Upload e Gestione File

### 7.1 Sistema upload

- Endpoint API per upload
- Ottimizzazione immagini con Sharp
- Gestione formati e dimensioni

### 7.2 File manager base

- Lista file caricati
- Cancellazione
- Preview immagini

## Fase 8: Configurazione Cliente

### 8.1 site.config.ts

```typescript
export const siteConfig = {
  name: "Nome Cliente",
  description: "Descrizione sito",
  url: "https://cliente.com",
  theme: {
    colors: {
      primary: "#...",
      secondary: "#...",
    },
    fonts: {
      heading: "Inter",
      body: "Inter",
    },
  },
  features: {
    blog: false,
    gallery: true,
    contact: true,
  },
  blocks: {
    enabled: ["hero", "cards", "gallery", "text"],
    variants: {
      hero: ["full", "split"],
      cards: ["grid-2", "grid-3"],
    },
  },
};
```

## Fase 9: Testing e Refinement

### 9.1 Test funzionalità

- CRUD completo pagine
- Upload immagini
- Anteprima e pubblicazione
- Performance sito pubblico

### 9.2 UX improvements

- Loading states
- Error handling
- Feedback utente
- Mobile responsiveness

## Fase 10: Deploy Setup

### 10.1 Preparazione produzione

- Variabili ambiente
- Script di build
- Ottimizzazioni Next.js

### 10.2 Deploy su VPS

- Nginx configuration
- PM2 setup
- Database setup PostgreSQL
- SSL certificate

## Milestone MVP

### Prototipo Completo

✅ Sistema funzionante con:

- 4 blocchi versatili
- Admin panel completo con ShadCN UI
- Upload immagini
- Sistema utenti base
- Deploy funzionante

## Prossimi Passi Post-MVP

1. **Blog system** (se richiesto dal primo cliente)
2. **Editor testo avanzato** con TipTap
3. **Sistema backup** automatico
4. **Analytics** integration
5. **Estrazione core** in npm package

## Note Tecniche Aggiornate

- **SQLite** per sviluppo: zero setup, file-based
- **PostgreSQL** per produzione: più robusto per concurrent access
- **ISR** Next.js per performance ottimali
- **Prisma** per type-safe database access con supporto sia SQLite che PostgreSQL
- **Zod** per validation schema-driven
- **ShadCN v2024** con nuovo comando `npx shadcn@latest` (sostituisce shadcn-ui)
- **NextAuth v5 (Auth.js)** con nuovo pattern di configurazione in `auth.ts`
- **React Hook Form** + ShadCN Form components per UI ottimale admin
