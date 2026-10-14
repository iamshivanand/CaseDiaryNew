# 🏛️ Advocase: Engineering, Design System & Architecture Rulebook

> **Scope:** Entire Advocase Ecosystem (Mobile Native App + Full-Stack Web Application)  
> **Purpose:** Enforce strict, unified architectural standards, performance optimizations, visual design parity, open-source engine selection, and production load-balancing strategies from day one.  
> **Status:** Mandatory Reference for all engineering, design, and agentic workflows.

---

## 📑 Table of Contents
1. [Core Philosophy: Mobile App to Web Ecosystem Parity](#1-core-philosophy-mobile-to-web-parity)
2. [Design System & Visual Language Standards](#2-design-system--visual-language-standards)
3. [Open-Source Engine Standards (Rich-Text Editor & Tools)](#3-open-source-engine-standards)
4. [Full-Stack Architecture & Database Agnosticism](#4-full-stack-architecture--database-agnosticism)
5. [Performance Optimization Directives](#5-performance-optimization-directives)
6. [High-Availability, Load Balancing & Hostinger Deployment](#6-high-availability-load-balancing--hostinger-deployment)
7. [Coding Conventions, Security & Quality Protocol](#7-coding-conventions-security--quality-protocol)

---

## 1. Core Philosophy: Mobile to Web Parity

The web application (`casediary-web`) is **not** a separate product; it is the **Desktop Command Center** for the advocate who carries the mobile app in court.

### The Advocate's Dual-Screen Reality:
- **In Court (Mobile App):** Fast, 1-handed triage, voice notes, courtroom outcome marking, pass-over requests, offline-first operation.
- **In Chamber (Web Application):** Large-screen multi-tasking, high-velocity legal drafting on physical A4/Legal canvas, junior delegation, letterhead printing, fee ledger audits, and cloud sync.

### Parity Principles:
1. **Zero Mental Translation:** A case status (`Open`, `In Progress`, `Order Reserved`), priority tag (`High`, `Medium`), or procedural stage (`Arguments`, `Evidence`) must use identical colors, labels, and naming on both mobile and web.
2. **Offline & Dual-Sync Integrity:** Both platforms mirror the exact SQLite schema. When transitioning to PostgreSQL in the cloud, all data entities map 1-to-1 without data loss or schema distortion.
3. **Indian Legal Terminology First:** Always preserve real courtroom conventions: *Munshi*, *Cause List*, *Pass-Over*, *Order Reserved*, *CNR Number*, *Crime/FIR No*, *Under Sections*, *Limitation Date*.

---

## 2. Design System & Visual Language Standards

### 2.1 Color Palette & Semantic Tokens
The visual design embodies an **Executive Legal Atmosphere** (deep slate, rich navy, warm amber/gold, vibrant accents):

```css
/* Core Executive Theme */
--slate-base:     #0f172a; /* Deep courtroom slate */
--slate-card:     #1e293b; /* Elevated surfaces / cards */
--slate-border:   #334155; /* Subtle separation borders */

/* Accent & Identity */
--gold-primary:   #f59e0b; /* Advocate Amber / Gold */
--gold-hover:     #d97706; /* Interactive hover gold */
--indigo-counsel: #6366f1; /* Junior Counsel & Chamber Team */

/* Operational Badges */
--emerald-success:#10b981; /* Attended / Fee Paid / Disposed */
--rose-urgent:    #f43f5e; /* High Priority / Warrant / Overdue */
--blue-hearing:   #3b82f6; /* Trial Date / eCourts Sync */
```

### 2.2 Typography Hierarchy
- **Application Controls & Navigation:** Modern geometric sans-serif (`Inter`, system UI font) for maximum legibility at compact sizes (11px–14px).
- **Court Pleadings & Legal Editor Canvas:** Classical serif (`Times New Roman`, `Bookman Old Style`, `Georgia`) to strictly conform to High Court and Supreme Court registry standards.

### 2.3 Component Surface Rules
- **Corner Radii:** Consistent rounded geometry (`rounded-2xl` for cards, `rounded-3xl` for hero banners/modals, `rounded-xl` for interactive buttons and inputs).
- **Elevation:** Soft ambient drop shadows (`shadow-sm`, `shadow-md`, `shadow-2xl` with backdrops). Avoid harsh 100% black solid shadows.
- **Micro-Interactions:** Every interactive element must provide subtle visual feedback (`transition-all duration-200`, hover background shifts, active press scales).

---

## 3. Open-Source Engine Standards

To avoid building brittle bespoke solutions, always adopt the best-in-class, battle-tested open-source engines for complex subsystems.

### 3.1 Legal Drafting Engine: TipTap / ProseMirror
- **Engine Selection:** **TipTap** (built on the industry-standard ProseMirror framework, trusted by Linear, Notion, and The New York Times).
- **Why TipTap:**
  1. **Mobile Parity:** The React Native app already ships TipTap offline bundles ([`utils/realTiptapEditorTemplate.ts`](file:///e:/Projects/2026/CaseDiaryNew/utils/realTiptapEditorTemplate.ts)). Using TipTap on the web allows **100% lossless document exchange** via structured ProseMirror JSON.
  2. **Headless Architecture:** Allows complete control over styling, rendering a physical floating A4/Legal page with margins rather than an uncontrolled textarea.
  3. **Custom Legal Extensions:** Enables custom nodes for court line numbers (1–32), 1.75" gutter margins, watermarks, and auto-interpolating case variable chips (`{{Case_Number}}`, `{{Client_Name}}`).
- **Standard Extension Matrix:**
  - `@tiptap/starter-kit` (Bold, Italic, Strike, Headings, Lists, Blockquote)
  - `@tiptap/extension-underline` (Essential for statutory citations & court prayers)
  - `@tiptap/extension-text-align` (Left, Center, Right, Justify for High Court petitions)
  - `@tiptap/extension-font-family` (Times New Roman, Georgia, Bookman Old Style)
  - `@tiptap/extension-table`, `@tiptap/extension-table-row`, `@tiptap/extension-table-cell`, `@tiptap/extension-table-header` (Index of Documents, List of Dates & Events, Fee schedules)

### 3.2 PDF & Document Generation
- **CSS Paged Media (`@page`):** For printable daily cause lists and pleadings, utilize native browser CSS Paged Media. What the advocate sees on screen must render with 100% millimeter accuracy in print/PDF.
- **Client-Side Export:** Support instant browser print-to-PDF (`window.print()`) alongside headless backend generation when needed.

---

## 4. Full-Stack Architecture & Database Agnosticism

### 4.1 Separation of Concerns
```
┌────────────────────────────────────────────────────────────┐
│                    Next.js 16 App Router                   │
│   (Client Pages: Dashboard, Cause List, Team, Dossier)    │
└───────────────────────────────┬────────────────────────────┘
                                │ HTTP / JSON
┌───────────────────────────────▼────────────────────────────┐
│                     REST API Route Layer                   │
│       (/api/cases, /api/team, /api/notifications, etc.)    │
└───────────────────────────────┬────────────────────────────┘
                                │ Typed Query
┌───────────────────────────────▼────────────────────────────┐
│                       Drizzle ORM                          │
│          (Database-Agnostic Query Abstraction)             │
└──────────────┬──────────────────────────────┬──────────────┘
               │ Local / Single-Node          │ Multi-User / Cloud
┌──────────────▼─────────────┐ ┌──────────────▼──────────────┐
│       SQLite Database      │ │      PostgreSQL Database    │
│    (`better-sqlite3`, WAL) │ │      (Hostinger / Neon)     │
└────────────────────────────┘ └─────────────────────────────┘
```

### 4.2 Database Agnosticism Rules
1. **Drizzle ORM Exclusivity:** All database interactions must use Drizzle ORM query builders. Never write engine-specific raw SQL queries in route handlers.
2. **Dual-Dialect Readiness:** The data layer must seamlessly toggle between SQLite (`better-sqlite3` on local SSD) and PostgreSQL (`pg` or `postgres.js` via `DATABASE_URL`) with zero refactoring in the API route handlers.
3. **Strict Cascades:** Foreign keys on dependent records (`CaseTimeline`, `CaseDocuments`, `CaseAssignments`) must enforce `ON DELETE CASCADE` or `ON DELETE SET NULL` to preserve referential integrity.

---

## 5. Performance Optimization Directives

### 5.1 Frontend Optimization
- **Dynamic Imports (`next/dynamic`):** Heavy modules like the Rich Text Legal Editor, PDF viewers, and chart engines must be loaded lazily with clean skeleton fallbacks to keep initial page bundle under 90KB.
- **Debounced Mutations:** Auto-save in the drafting studio and global quick search queries must be debounced (400ms–600ms) to prevent server hammering.
- **Zero Layout Shift (CLS):** Every icon, avatar, and image must specify explicit width and height containers to eliminate cumulative layout shift.
- **Hydration Isolation:** Never evaluate client-volatile values (like `new Date().toLocaleString()`) directly during server rendering; encapsulate dynamic timestamps in client hooks with `suppressHydrationWarning`.

### 5.2 Backend & Data Optimization
- **SQLite WAL Mode:** SQLite must always operate in Write-Ahead Logging (`PRAGMA journal_mode = WAL;`) and `PRAGMA synchronous = NORMAL;` to allow non-blocking concurrent reads while writes are processing.
- **Compound Database Indexes:**
  - `idx_cases_user_next_date`: `(user_id, NextDate)` for instantaneous cause list queries.
  - `idx_case_assignments_duty_date`: `(duty_date, status)` for real-time pass-over boards.
  - `idx_timeline_case_id`: `(case_id, hearing_date)` for instant chronological dossier generation.
- **Binary Streaming:** File uploads must stream directly to disk (`ReadableStream` to `fs.createWriteStream`) without buffering multi-megabyte payloads in memory.

---

## 6. High-Availability, Load Balancing & Hostinger Deployment

### 6.1 Hostinger Architecture (Production VPS)
For hosting on Hostinger VPS (Ubuntu 22.04 / 24.04 LTS), deploy using **Nginx + PM2 Cluster Mode + PostgreSQL**:

```
           Incoming Internet Traffic (HTTPS / 443)
                             │
                             ▼
                    ┌─────────────────┐
                    │      Nginx      │ (SSL Termination, Gzip/Brotli,
                    │  Reverse Proxy  │  Rate Limiting, 50MB Body Size)
                    └────────┬────────┘
                             │ Upstream Socket / Port 3000
              ┌──────────────┴──────────────┐
              ▼                             ▼
       ┌──────────────┐              ┌──────────────┐
       │ PM2 Worker 1 │              │ PM2 Worker 2 │ (Node.js Cluster Mode)
       └──────┬───────┘              └──────┬───────┘
              └──────────────┬──────────────┘
                             │ Connection Pool (PgPool)
                             ▼
                    ┌─────────────────┐
                    │   PostgreSQL    │ (Local VPS or Cloud Managed)
                    └─────────────────┘
```

### 6.2 Load Balancing Directives
1. **PM2 Cluster Mode:** Run Next.js across all available CPU cores:
   ```javascript
   // ecosystem.config.js
   module.exports = {
     apps: [{
       name: "casediary-web",
       script: "node_modules/next/dist/bin/next",
       args: "start",
       instances: "max", // Scale across all available CPU cores
       exec_mode: "cluster",
       max_memory_restart: "1G",
       env: {
         NODE_ENV: "production",
         PORT: 3000
       }
     }]
   };
   ```
2. **Nginx Reverse Proxy & Load Balancing Config:**
   ```nginx
   upstream casediary_cluster {
     least_conn; # Load balancing algorithm: send traffic to least loaded worker
     server 127.0.0.1:3000 max_fails=3 fail_timeout=30s;
     keepalive 64;
   }

   server {
     listen 80;
     server_name casediary.yourdomain.com;
     return 301 https://$host$request_uri;
   }

   server {
     listen 443 ssl http2;
     server_name casediary.yourdomain.com;

     ssl_certificate /etc/letsencrypt/live/casediary.yourdomain.com/fullchain.pem;
     ssl_certificate_key /etc/letsencrypt/live/casediary.yourdomain.com/privkey.pem;

     client_max_body_size 50M;

     location / {
       proxy_pass http://casediary_cluster;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
     }

     location /api/health {
       proxy_pass http://casediary_cluster;
       access_log off; # Keep liveness probes quiet
     }
   }
   ```
3. **Stateless Service Design:** The Next.js server instances must remain completely stateless. All session data, notifications, and case records live in the database.
4. **Storage Abstraction:** Uploaded briefs and court orders must be organized under a designated persistent path (e.g. `/var/www/casediary-uploads/`) with unique UUID-prefixed filenames, allowing seamless future migration to S3 / Cloudflare R2 object storage.
5. **Health Check Endpoint:** Expose `GET /api/health` returning database connectivity status, memory usage, and uptime for load balancer liveness probes.

---

## 7. Coding Conventions, Security & Quality Protocol

### 7.1 Security Guidelines
- **Input Sanitization:** All rich text and HTML drafts rendered in the browser must be sanitized with strict element allowlists to eliminate Cross-Site Scripting (XSS).
- **File Upload Guardrails:** File uploads must validate MIME types (PDF, DOCX, JPG, PNG) and enforce a 50MB ceiling to prevent denial-of-service storage exhaustion.
- **Client Data Privacy:** Never log client contact numbers, case strategies, or criminal FIR contents in plain server stdout logs.

### 7.2 Verification Standard Before Merging
Any new module or change must pass:
1. **Type Safety:** `npm run build` with zero TypeScript or ESLint errors.
2. **Database Integrity:** Foreign key referential checks and seed consistency.
3. **Visual Parity:** Desktop and mobile responsiveness with smooth sidebar transitions.
4. **Documentation:** Immediate update to [`walkthrough.md`](file:///C:/Users/gangw/.gemini/antigravity-ide/brain/922e1d57-4de3-437f-97fc-3dbfd768799a/walkthrough.md).

