Implementazione di un Sistema di Autenticazione Custom in Next.js 15 (App Router)

Obiettivo e Contesto

Implementare un sistema di autenticazione semplice ma sicuro in Next.js 15 utilizzando l’App Router, con un’architettura full-stack Node.js (no Edge runtime). L’applicazione usa Prisma ORM con un database SQLite locale in sviluppo, con la possibilità di migrare facilmente a Postgres o MySQL in produzione. L’autenticazione deve essere custom (senza utilizzare servizi esterni come NextAuth, Clerk, ecc.), sfruttando le funzionalità native di Next.js (Server Actions, Middleware) e librerie standard per hashing e token.

Requisiti Tecnici
• Hashing delle Password: Utilizzare bcrypt per hashare le password degli utenti, con un cost (numero di round) pari a 12. Ciò garantisce un buon equilibrio tra sicurezza e performance (2^12 iterazioni di hashing) ￼ ￼. Si raccomanda di usare le funzioni asincrone di bcrypt (bcrypt.hash e bcrypt.compare con await) invece delle varianti sincrone, per non bloccare il loop eventi di Node ￼.
• Sessione tramite JWT: Implementare una sessione stateless utilizzando JSON Web Token (JWT) firmati con algoritmo HMAC HS256. Per la firma usare la libreria jose, compatibile con Next.js (anche in Edge) ￼ ￼. Il token JWT conterrà dati minimi (es. ID utente e timestamp) e sarà conservato in un cookie HTTP-only firmato. Non memorizzare dati sensibili nel payload JWT (solo identificatori o ruoli) ￼.
• Cookie di Sessione: Il cookie che conserva il JWT di sessione deve avere le seguenti opzioni di sicurezza ￼:
• httpOnly: true – impedisce l’accesso al cookie via JavaScript lato client.
• secure: true – trasmette il cookie solo su connessioni HTTPS (attivarlo solo in produzione; in sviluppo su localhost può essere false).
• sameSite: 'lax' – riduce rischi di CSRF, permettendo il cookie solo su navigazione primaria.
• path: '/' – il cookie è valido per tutto il sito.
• Scadenza: 7 giorni. Impostare Expires (o Max-Age) a 7 giorni nel futuro, così che la sessione scada dopo una settimana dal login.
• Server Actions per Login/Registrazione: Utilizzare le Server Actions di Next.js (funzioni marcate con direttiva 'use server' negli React Server Components) per implementare le operazioni di registrazione, login e logout ￼. Ciò permette di gestire form e mutazioni di dati senza definire API routes manuali:
• La pagina di registrazione (/signup) conterrà un form collegato a una Server Action (es. registerAction). Questa action dovrà validare i dati, creare un nuovo utente nel DB (dopo aver hashato la password con bcrypt), e infine creare la sessione JWT per l’utente (impostando il cookie) e fare redirect alla pagina protetta (es. /admin o una dashboard).
• La pagina di login (/login) conterrà un form collegato a una Server Action (es. loginAction). Questa action autentica l’utente verificando le credenziali: cerca l’utente per email con Prisma, verifica la password con bcrypt (bcrypt.compare). Se valido, genera il JWT di sessione e imposta il cookie (tramite l’API cookies() di Next), quindi effettua un redirect verso l’area autenticata. Se le credenziali sono errate, restituisce un errore (ad es. lancia un Error o ritorna un oggetto di errore da gestire nell’interfaccia).
• Logout: implementare una Server Action (es. logoutAction) che rimuove/invalida la sessione corrente. Si può utilizzare cookies().delete('session') per cancellare il cookie di sessione ￼, quindi fare redirect al login ￼.
• Protezione delle rotte /admin: Creare il file middleware.ts nella root del progetto Next.js per proteggere tutte le rotte sotto /admin (o altre sezioni riservate). Il middleware dovrà intercettare ogni richiesta in ingresso:
• Se l’utente non è autenticato (cookie di sessione mancante o JWT non valido/scaduto), redirigere la richiesta verso /login ￼.
• Se l’utente è autenticato e la richiesta è verso una pagina pubblica di login/registrazione, opzionalmente si può reindirizzare verso l’area interna (evitando che un utente loggato veda la schermata di login) ￼.
• Utilizzare NextResponse di Next.js per eseguire i redirect. Esempio di logica in middleware:

import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth'; // funzione per verificare JWT
export const config = { matcher: ['/admin/:path*'] }; // applica il middleware a tutte le rotte /admin

export function middleware(req: NextRequest) {
const url = req.nextUrl;
const token = req.cookies.get('session')?.value;
const isAuthenticated = token && verifySessionToken(token);
if (!isAuthenticated) {
// Utente non loggato, redirect a /login
return NextResponse.redirect(new URL('/login', url));
}
return NextResponse.next(); // Utente autenticato, prosegue verso /admin
}

Nota: l’esempio sopra semplifica la gestione degli errori. In implementazione reale, verifySessionToken dovrebbe catturare eventuali eccezioni (token non valido/scaduto) e restituire false/null in tal caso.

    •	Runtime del Middleware: Di default il middleware gira su Edge Runtime, ma qui non usiamo funzionalità non supportate su Edge (il JWT viene verificato con jose, che supporta Web Crypto ￼). Tuttavia, poiché l’app è destinata ad ambiente Node (es. un deployment su VPS), si può facoltativamente forzare il middleware a usare il runtime Node.js se supportato dalla versione di Next in uso. Next 15.5+ consente export const config = { runtime: 'nodejs' } nel middleware ￼ (funzionalità non ancora segnata come completamente stabile, valutare in base alla versione). In ogni caso, assicurarsi che le funzioni sensibili (es. bcrypt per password) vengano eseguite solo in contesto Node (ad esempio dentro le Server Actions, che per impostazione girano sul server Node) e non nel middleware.

    •	Libreria di Autenticazione (lib/auth.ts): Creare un modulo di utilità (ad esempio app/lib/auth.ts oppure lib/auth.ts configurando l’alias @/lib) per centralizzare la logica di autenticazione. Questa libreria fornirà funzioni riutilizzabili come:
    •	hashPassword(password: string): ritorna la hash bcrypt della password (usare bcrypt.hash con saltRounds=12) ￼.
    •	verifyPassword(password: string, hash: string): verifica una password in chiaro confrontandola con l’hash salvata (bcrypt.compare).
    •	createSession(userId: string): genera un JWT contenente ad es. { userId, iat, exp } usando jose e lo firma con la secret key dell’app ￼. Imposta poi un cookie di nome session con il token, usando l’API cookies() di Next con le opzioni sopra descritte (httpOnly, path=/, sameSite lax, expires 7 giorni, secure in prod). Si può implementare questa funzione come una Server Action (usando 'use server' in cima al file) o assicurandosi comunque che giri solo lato server (ad esempio aggiungendo import 'server-only' all’inizio del file per evitare import client) ￼. Esempio minimale:

import 'server-only';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const ALG = 'HS256';

export async function createSession(userId: string) {
const token = await new SignJWT({ userId })
.setProtectedHeader({ alg: ALG })
.setIssuedAt()
.setExpirationTime('7d')
.sign(SECRET);
// Imposta cookie di sessione
cookies().set('session', token, {
httpOnly: true,
secure: process.env.NODE_ENV === 'production',
sameSite: 'lax',
path: '/',
maxAge: 60 _ 60 _ 24 \* 7 // 7 giorni in secondi
});
}

export async function verifySessionToken(token: string): Promise<boolean | { userId: string }> {
try {
const { payload } = await jwtVerify(token, SECRET, { algorithms: [ALG] });
return payload as { userId: string };
} catch {
return false;
}
}

export async function deleteSession() {
cookies().set('session', '', { expires: new Date(0) }); // invalida il cookie immediatamente
}

(L’esempio sopra mostra i passi principali: generazione e verifica JWT con jose, set/delete cookie. In produzione, JWT_SECRET va definita in .env come stringa robusta ￼.)

    •	Prisma e Database: Configurare Prisma per SQLite in sviluppo e mantenere portabilità verso Postgres/MySQL:
    •	Il file schema.prisma dovrebbe avere il datasource configurato per SQLite durante lo sviluppo, ad esempio:

datasource db {
provider = "sqlite"
url = env("DATABASE_URL") // es: "file:./dev.db"
}

Questo può essere inizializzato rapidamente con il comando Prisma CLI ￼. Esempio: npx prisma init --datasource-provider sqlite crea uno schema Prisma già configurato per SQLite ￼.

    •	Definire nel schema.prisma il modello User per gli utenti, con almeno i campi: id (chiave primaria), email (string univoca per login), password (string per la hash bcrypt), e altri campi rilevanti (nome, ruoli, ecc. a piacere). Ad esempio, ispirandosi alla documentazione Prisma ￼:

model User {
id Int @id @default(autoincrement())
email String @unique
password String
name String?
// ... altri campi opzionali
}

Una volta definito il modello, eseguire prisma migrate dev (in sviluppo) per applicare lo schema al DB SQLite (verrà generato il file dev.db). In produzione, basterà cambiare la stringa DATABASE_URL nel file .env puntando a un database Postgres/MySQL e aggiornare il provider in schema.prisma (provider = "postgresql" o "mysql") ￼, quindi eseguire le migrazioni per adattare lo schema al nuovo DB. Prisma astrae la maggior parte delle differenze, rendendo la migrazione relativamente semplice.

    •	Utilizzare Prisma Client nelle Server Actions per interagire col DB. Ad esempio, nella action di registrazione:

// Esempio semplificato di registrazione (Server Action)
'use server';
import { prisma } from '@/lib/prisma'; // istanza PrismaClient
import { hashPassword, createSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function registerAction(formData: FormData) {
const email = formData.get('email')?.toString();
const pass = formData.get('password')?.toString();
if (!email || !pass) throw new Error("Dati mancanti");
// (Si potrebbe aggiungere validazione più robusta su formato email, strength password, ecc.)
const existing = await prisma.user.findUnique({ where: { email } });
if (existing) {
throw new Error("Email già registrata");
}
const passwordHash = await hashPassword(pass);
const user = await prisma.user.create({ data: { email, password: passwordHash } });
await createSession(user.id); // imposta il cookie di sessione per il nuovo utente
redirect('/admin'); // reindirizza l’utente loggato all’area protetta
}

L’esempio sopra mostra un possibile flusso: verifica se l’email è libera, crea l’utente con password hashata, crea la sessione e redirige l’utente autenticato. Analogamente, si implementerà loginAction che fa findUnique sull’email, poi verifyPassword con bcrypt e, se ok, chiama createSession e redirect.

    •	Per il logout, la Server Action logoutAction chiamerà semplicemente deleteSession() (per cancellare il cookie) e poi effettuerà redirect('/login') ￼.

Esempi di Codice Chiave
• Hash e verifica password con bcrypt (cost=12): ￼

import bcrypt from 'bcrypt';
const saltRounds = 12;
// Esempio di hashing
const hashed = await bcrypt.hash(plainPassword, saltRounds);
// Esempio di verifica
const match = await bcrypt.compare(inputPassword, hashed);

Nota: utilizzare sempre le versioni asincrone (bcrypt.hash/compare restituiscono una Promise) ￼ per evitare di bloccare il server.

    •	Generazione e verifica JWT con jose: ￼ ￼

import { SignJWT, jwtVerify } from 'jose';
const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
// Creazione JWT
const token = await new SignJWT({ userId: user.id })
.setProtectedHeader({ alg: 'HS256' })
.setIssuedAt()
.setExpirationTime('7d')
.sign(secret);
// Verifica JWT
const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
console.log(payload.userId); // ID utente dal token

    •	Impostazione del cookie di sessione: uso di Next Server Actions e API cookies()

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createSession } from '@/lib/auth';

export async function loginAction(email: string, password: string) {
'use server';
// ... valida input, cerca utente e verifica password
await createSession(user.id);
redirect('/admin');
}

La funzione createSession internamente chiama cookies().set('session', token, { httpOnly: true, ... }) con le opzioni illustrate (vedi sopra). Next.js consente di settare i cookie direttamente nelle Server Action; il redirect immediato tramite redirect() interrompe l’esecuzione dell’action e instrada il client verso la pagina destinazione.

    •	Middleware di protezione (estratto): ￼

// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/session'; // funzione che verifica/decifra il JWT
import { cookies } from 'next/headers';

const protectedRoutes = ['/admin'];

export async function middleware(req: NextRequest) {
const path = req.nextUrl.pathname;
const isProtected = protectedRoutes.some(r => path.startsWith(r));
const token = (await cookies()).get('session')?.value;
const session = token ? await decrypt(token) : null;
if (isProtected && !session?.userId) {
return NextResponse.redirect(new URL('/login', req.nextUrl));
}
return NextResponse.next();
}
export const config = { matcher: ['/admin/:path*'] };

Spiegazione: il middleware controlla se la richiesta è diretta a una route protetta (/admin); se sì, tenta di leggere il cookie session e di verificarlo (decrypt dovrebbe utilizzare jwtVerify di jose per validare il token ￼). Se il token manca o non è valido, l’utente viene reindirizzato a /login ￼. Altrimenti la richiesta continua. (Nel caso sopra decrypt è analogo a verifySessionToken illustrato prima; si può integrare direttamente la verifica JWT nel middleware se si preferisce evitare dipendenze esterne).
Nota: Il middleware viene eseguito prima della renderizzazione della pagina, per ogni richiesta. Assicurarsi che operi in modo snello (solo lettura cookie e verifica HMAC, nessuna query al DB dentro il middleware, per non impattare le performance) ￼ ￼.

Definition of Done (criteri di accettazione)

Per considerare completo il task, il sistema di autenticazione deve soddisfare tutti i seguenti punti: 1. Registrazione Utente: È possibile creare un nuovo account utente tramite la pagina di registrazione. Le password sono salvate solo in forma hashata (bcrypt cost 12) nel database ￼. Eventuali errori (email già in uso, campi mancanti, password non valida) sono gestiti appropriatamente (es. mostrando un messaggio di errore). 2. Login Utente: Gli utenti possono autenticarsi tramite la pagina di login con email e password. Se le credenziali sono corrette, viene creata una sessione JWT e impostato un cookie HTTP-only contenente il token. Il cookie rispetta le impostazioni di sicurezza (httpOnly, sameSite, path, expirazione 7gg, secure in prod) ￼. Dopo il login l’utente viene reindirizzato all’area protetta (es. /admin) automaticamente. 3. Accesso alle Aree Protette: Qualsiasi navigazione o chiamata alle rotte sotto /admin senza un JWT di sessione valido provoca un redirect immediato a /login ￼. Gli utenti autenticati possono accedere alle pagine sotto /admin normalmente. (Opzionale: se un utente autenticato prova a tornare su /login o /signup, l’app può redirigerlo via middleware di nuovo su /admin per migliorare l’UX ￼.)\* 4. Logout: È disponibile un meccanismo di logout (ad es. un pulsante “Logout” nell’area riservata) che, quando attivato, chiama la Server Action di logout. Questa elimina il cookie di sessione (invalida il JWT lato client) ￼ e reindirizza l’utente alla schermata di login ￼. Dopo il logout l’utente non può più accedere alle pagine protette finché non effettua di nuovo il login. 5. Implementazione Custom & Sicura: L’intera soluzione è implementata senza fare uso di provider di autenticazione terzi. La sicurezza è gestita internamente: hashing robusto delle password, JWT firmati con secret sicuro (memorizzato in variabile d’ambiente, es. JWT_SECRET) ￼, cookie httpOnly, e controlli server-side sia al login sia a ogni richiesta (via middleware). 6. Separation of Concerns: La logica di autenticazione (hash/verifica password, creazione/verifica token) è ben incapsulata nella libreria auth.ts, riutilizzata dalle Server Actions e dal middleware. Il codice è organizzato in modo chiaro: pagine che contengono solo UI e form, funzioni server separate per le azioni (login/registrazione), middleware per la protezione globale. 7. Pronta per Produzione (scalabilità): La soluzione funziona inizialmente con SQLite tramite Prisma, e può essere portata su Postgres/MySQL aggiornando la configurazione di Prisma (connection string e provider) e rieseguendo le migrazioni ￼. Non ci sono query SQL raw o caratteristiche specifiche di SQLite hardcodate nel codice. Inoltre, il sistema è pensato per ambienti Node server (es. un deployment su VPS): l’uso di bcrypt e delle API Node avviene solo dove supportato. (Se in futuro si utilizzasse la Edge Runtime, andrebbero sostituiti i componenti non compatibili come bcrypt con equivalenti edge-compliant, ma questo non è richiesto ora.) 8. Documentazione e Riferimenti: Il codice è affiancato da commenti esplicativi dove opportuno, e il team dispone dei link a documentazione ufficiale (Next.js, Prisma, bcrypt, jose) per approfondire ogni sezione:
• Next.js – Server Actions e modulistica app router ￼, guida ufficiale all’autenticazione stateless (Esempi di uso di bcrypt, SignJWT, cookies API, redirect) ￼ ￼.
• Next.js – Middleware (protezione rotte, uso di NextRequest/NextResponse, configurazione matcher e runtime) ￼ ￼.
• Libreria jose (JWT in Node e Edge) – documentazione/NPM ￼.
• Libreria bcrypt – documentazione/NPM (best practice su cost e utilizzo asincrono) ￼.
• Prisma – documentazione ufficiale su SQLite e migrazione ad altri DB (quickstart SQLite, modifica provider) ￼ ￼. ￼
