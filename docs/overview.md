# **Sistema Siti Web Semplici con Admin Integrato – Documento di Progetto v2**

## **1. Obiettivo del sistema**

Realizzare un sistema per creare e gestire **siti aziendali semplici** (es. piccole e medie imprese, blog personale) con:

- **Layout e styling controllati dal codice** (no page builder drag&drop in stile Elementor o Divi)
- **Admin UI minimale** solo per modificare testi e contenuti (no modifica struttura/design)
- **Performance elevate**
- **Facile replicabilità** per nuovi clienti
- **Manutenibilità** e aggiornabilità centralizzata

**Scala target**: 10-20 clienti/anno, non pensato per scalare massivamente.

---

## **2. Filosofia di design**

1. **Separazione ruoli**

   - **Developer/Agenzia**: controlla layout, struttura, styling, performance, blocchi disponibili.
   - **Cliente**: può modificare testi, immagini e contenuti dinamici, ma non alterare design o struttura.

2. **Semplicità prima di tutto**

   - Evitare funzionalità inutili per il target e per il maintainer di questi siti.
   - Evitare strumenti pesanti (Elementor, WP page builder) che rallentano e complicano.

3. **Performance e pulizia**

   - Codice ottimizzato e leggero.
   - Nessun sovraccarico da editor WYSIWYG completi.
   - Deployment semplice e affidabile.

4. **Controllo dell'agenzia**
   - L'agenzia decide quali blocchi/componenti rendere disponibili per ogni cliente.
   - I blocchi sono progettati per essere versatili e coprire la maggior parte dei casi d'uso.

---

## **3. Architettura generale**

- **Framework principale**: Next.js (pubblico + admin nello stesso progetto).
- **Database**:
  - Gestito tramite Prisma come ORM.
  - Sviluppo locale → SQLite (per semplicità e rapidità).
  - Produzione → PostgreSQL (o MySQL se necessario) per robustezza e scalabilità.
- **Autenticazione**: Auth.js con Credentials (email/password) + opzione Google login (se richiesto dal cliente).
- **Storage**:
  - Locale (`/public/uploads`) per siti su un singolo server.
  - S3 compatibile solo se necessario in futuro.
- **Rendering**:
  - SSG/ISR per il sito pubblico.
  - SSR per l'admin.
- **Gestione immagini**: ottimizzazione e compressione automatica.

---

## **4. Struttura dei contenuti**

### 4.1 Layout e styling

- Realizzati interamente in codice React.
- Basati su **design token** (palette, radius, spacing, tipografia).
- Personalizzazione styling tramite CSS variables e classi predefinite.
- Nessuna possibilità per il cliente di modificare CSS/HTML direttamente.

### 4.2 Componenti di pagina

- Componenti "blocco" versatili (`Hero`, `Cards`, `Gallery`, ecc.).
- Varianti controllate (`full`, `split`, ecc.).
- Props predefiniti (titolo, testo, immagine, link).
- **Blocchi progettati per coprire la maggior parte dei casi d'uso senza personalizzazioni ad hoc**.

### 4.3 Modello dati

- **Page**: slug, lista di blocchi.
- **Block**: type, variant, props.
- **Props**: definiti da schema (Zod/JSON Schema) → generano form nell'admin.
- **Schema versioning**: supporto per migration dei dati in caso di breaking changes.

### 4.4 Editing contenuti

- Editor WYSIWYG leggero **solo per testo** (TipTap o Quill, funzioni base: bold, italic, link, liste).
- Campi immagine → upload locale.
- **Modifiche molto basic**: cambio testi, immagini, contenuti dinamici.
- **Nessuna modifica di struttura, layout, o ordine blocchi** dal pannello.
- Sistema di **versionamento contenuti** basato su database (implementazione futura).

---

## **5. Strategia di gestione multi-cliente**

### 5.1 Fase prototipo (1 cliente)

- Singola repo, sviluppo come per un singolo cliente.
- Focus su test del workflow di editing e performance.
- Struttura cartelle già predisposta per separazione core/cliente:
  ```
  /core/          # blocchi, admin, logica base
  /client/        # site.config.ts, custom components, styling
  /uploads/       # cliente-specifico
  ```

### 5.2 Fase evoluzione (2-10 clienti)

- **Core come pacchetto npm privato**.
- Ogni cliente ha la sua installazione con:
  - `package.json` che specifica la versione del core.
  - `site.config.ts` per branding e configurazioni.
  - `/client/` per personalizzazioni specifiche.
- **Aggiornamenti**: `npm update @agenzia/cms-core` + redeploy.

### 5.3 Gestione aggiornamenti

**Hotfix urgenti**:

- Fix nel core → publish nuova versione → update automatico su tutti i clienti.

**Breaking changes**:

- L'agenzia controlla quando ogni cliente aggiorna.
- Migration script per convertire dati esistenti.
- Backward compatibility dove possibile.

**Nuovi blocchi**:

- L'agenzia decide per ogni cliente quali blocchi abilitare.
- Configurazione tramite feature flags in `site.config.ts`.

---

## **6. Pannello Admin**

### 6.1 Funzioni principali

- Login/logout sicuro.
- CRUD per:
  - Post del blog.
  - Pagine (con blocchi predefiniti abilitati per il cliente).
  - Galleria (se attiva).
- Impostazioni base (titolo sito, SEO base).
- Upload immagini con ottimizzazione automatica.

### 6.2 UX e restrizioni

- Form generati dagli schema dei blocchi.
- **Accesso limitato**: solo contenuti testuali e immagini.
- Anteprima live usando i componenti reali.
- Interface semplificata per utenti non tecnici.

---

## **7. Deployment**

### 7.1 Server

- VPS o server dedicato modesto.
- Nginx come reverse proxy.
- PM2 o systemd per esecuzione app.

### 7.2 Build e deploy

- Build automatizzato via GitHub Actions:
  - Build in cloud → server riceve solo artefatti pronti.
  - Deploy via SSH/rsync (semplice) o Docker (più robusto).
- **Backup automatici** di database e `/public/uploads`.

### 7.3 Sicurezza

- `.env` con credenziali DB e segreti auth.
- Backup regolare con strategy di disaster recovery.
- Update di sicurezza gestiti centralmente tramite core npm.

---

## **8. Estendibilità futura**

- Supporto autenticazione a due fattori.
- Ruoli multipli (admin, editor).
- Integrazione con servizi esterni (newsletter, analytics).
- Migrazione a storage esterno (S3) se necessario.
- Sistema avanzato di versionamento contenuti.

---

## **9. Cosa NON fare**

- Multi-tenant: inutile e più complesso per la scala target.
- WYSIWYG completo: apre a modifiche strutturali indesiderate.
- Page builder drag&drop: lento, ingombrante, poco controllabile.
- Over-engineering per scenari di scala non previsti.
- Blocchi troppo specifici: puntare su versatilità.

---

## **10. Roadmap**

1. **Prototipo** (1 cliente):

   - Next.js con SQLite + Prisma.
   - 3-4 blocchi base versatili (Hero, Cards, Gallery, Text).
   - Admin minimale per modificare testi e immagini.
   - Struttura cartelle predisposta per evoluzione.

2. **Testing e refinement**:

   - Deploy su VPS con build automatizzato.
   - Test workflow editing con cliente reale.
   - Identificazione pattern comuni per blocchi.

3. **Evoluzione multi-cliente**:

   - Estrazione core in pacchetto npm privato.
   - Standardizzazione `site.config.ts`.
   - Automatizzazione deployment.

4. **Consolidamento**:
   - Sistema migration per breaking changes.
   - Backup e monitoring automatizzati.
   - Documentazione per onboarding nuovi clienti.

---

## **Note implementative**

- **Breaking changes**: sempre accompagnati da migration script e documentazione.
- **Backward compatibility**: mantenuta dove possibile per ridurre effort di aggiornamento.
- **Testing**: ogni aggiornamento core testato su ambiente staging prima del rollout.
- **Monitoring**: log centralizzati per identificare rapidamente problemi su installazioni cliente.
