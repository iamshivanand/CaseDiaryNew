# CaseDiary: Market Research, Feature Roadmap, & Growth Strategy

This document delivers a 360-degree product and marketing blueprint for the **CaseDiary** mobile application. It combines playbooks from the **Product Manager Toolkit** (competitor profiling & JTBD), **Brainstorming Playbook** (value-effort feature expansion), and **Growth Engine** (ASO keyword maps & AARRR loops) to transform CaseDiary into the premium legal-tech app for Indian advocates and chamber lawyers.

---

## 🗺️ Option A: Market Research & Competitor Analysis
*(Powered by `@product-manager-toolkit`)*

The Indian legal-tech ecosystem is digitizing rapidly due to the eCourts Mission Mode Project. Advocate workloads are heavily dependent on daily court cause lists, physical diaries, and constant status tracking.

### 1. Competitive Landscape Analysis

| Competitor | Target Audience | Primary Channels | Strengths | Weaknesses / Gaps |
| :--- | :--- | :--- | :--- | :--- |
| **Provakil** | Mid-size law firms, corporate legal teams | Web SaaS, Sales outreach | Real-time scraper for 10k+ courts; virtual display boards; robust enterprise role delegation. | Heavy, complex interface; expensive; lacks solo-advocate friendly offline UX. |
| **LegalKart** | Chamber lawyers, solo advocates, public seekers | Mobile Apps, digital ads | Direct advocate-to-client consult matching; unified dashboard; instant client fee payments. | Monetization-heavy; high fee cuts; offline usability is limited. |
| **Case Bench** | Boutique firms, independent litigators | Web & Mobile, referrals | Automated court notification triggers; clean dashboard; case alert logs. | Lacks advanced client collaboration; document scanning is basic. |
| **India Case Status** | Litigants, solo practitioners | WhatsApp, Web | No-app-install WhatsApp updates; simple monitoring alerts. | No client management; no secure document store; strictly reactive alerts. |
| **eCourts Services (Govt)** | General public, all lawyers | Android & iOS stores | Official data source; free; supports CNR searches and case history. | Terribly dated UI; zero client contact integration; no notes, tasks, or custom diaries. |

### 2. Advocate Jobs-to-be-Done (JTBD)
We group our user segment goals into three core JTBD statements:

1. **The Chamber Organizer**:
   > *"When I have hearings spread across 3 different courtrooms today, I want to see my customized daily cause list ordered by court priority and time, so that I can schedule my junior advocates and never miss a case call."*
2. **The Offline Practitioner**:
   > *"When I am in a courtroom basement with zero network coverage, I want to access my case notes, opposing counsel details, and PDF petitions instantly on my phone, so I can present my arguments confidently."*
3. **The Client Communicator**:
   > *"When court dates are rescheduled, I want to automatically alert my clients without spending hours typing manual text messages or taking calls, so I can maintain trust and save time."*

---

## 💡 Option B: Feature Improvement & Brainstorming
*(Powered by `@brainstorming`)*

We evaluate new features for CaseDiary based on a **Value vs. Effort** matrix:

```
         Low Effort                        High Effort
         
High     🌟 QUICK WINS                     🚀 BIG BETS
Value    - Auto-WhatsApp Client Alerts     - eCourts Cause List Syncing (Scraping)
         - Local Calendar Integration      - In-App OCR Document Scanner
         
Low      🔧 FILL-INS                       ⏳ TIME SINKS
Value    - Multiple Color Themes           - Social networking for lawyers
         - In-app notepad widgets          - Complex retainer billing systems
```

### 1. Feature Specifications

#### A. Automated Client Alerts (Quick Win)
- **Problem**: Advocates spend hours calling clients to communicate next hearing dates (`NextDate`).
- **Solution**: Integrating local SMS or device WhatsApp hooks. When an advocate saves a hearing in `UpdateHearingPopup`, trigger a pre-formatted message: 
  > *"Dear [Client], your case [Title] (CNR: [CNR]) is scheduled for next hearing on [NextDate] before [Judge]. Regards, [Advocate Name]."*

#### B. Automated eCourts Cause List Scraper (Big Bet)
- **Problem**: Manual entry of case status updates is tedious.
- **Solution**: Let advocates import case details by simply entering the **CNR Number** or **Case Number**. The app contacts a cloud scraping API (connecting to eCourts services), fetches the case title, parties, court name, judge name, and automatically seeds/updates the local SQLite database.

```mermaid
graph TD
    A[Advocate Enters CNR Number] --> B[App Requests Cloud API Scraper]
    B --> C{Scraper Checks eCourts}
    C -->|Success| D[Return Structured JSON Payload]
    C -->|Failure| E[Show "CNR Not Found" Alert]
    D --> F[Pre-fill AddCase / EditCase Form Fields]
    F --> G[Save directly to Local SQLite DB]
    G --> H[Schedule Local Daily Notification Alerts]
```

---

## 📈 Option C: Growth Strategy & Acquisition Funnel
*(Powered by `@growth-engine`)*

### 1. App Store Optimization (ASO) Keyword Strategy
Advocates look for productivity and court tracking utilities. We target high-intent, medium-intent, and long-tail keywords in Google Play and iOS App Store metadata.

```markdown
### Target ASO Keywords

1. High Intent (Direct Conversion):
   - "legal diary for advocates"
   - "court case tracker india"
   - "advocate case diary app"
   - "vakeel diary"
   
2. Informational / Search Intent:
   - "check ecourts case status"
   - "how to find cnr number"
   - "daily cause list organizer"

3. Long-tail (Low Competition, High Relevance):
   - "offline litigation case manager"
   - "lawyer client contact scheduler"
   - "cause list pdf generator"
```

### 2. AARRR Pirate Metrics Funnel for CaseDiary

```mermaid
funnel
    title CaseDiary AARRR Funnel
    Acquisition : App Store Searches (Advocate Diary, Vakil Diary)
    Activation : Advocate adds their first Case & CNR Number
    Retention : Advocate opens app daily to check Today's Cases
    Revenue : Premium unlocks (Unlimited document attachments, Ad-free mode)
    Referral : Advocate exports and shares Daily Cause List PDF
```

*   **Acquisition**: Leverage App Store Optimization (ASO) using our strategic keyword lists.
*   **Activation**: Ensure immediate value by providing a "Quick Add" screen with only 3 required fields (Title, Client, Hearing Date). *Do not force registration or profile setup on first launch.*
*   **Retention**: Send a local push notification every morning at 7:30 AM summarizing "Today's Scheduled Hearings" (using `notificationScheduler.ts`).
*   **Revenue**: Charge a monthly/yearly premium subscription for:
    - Ad-free experience (removing AdMob banners).
    - Unlimited document storage (SQLite / file attachments).
    - Unlimited Cause List PDF exports.
*   **Referral (Viral Loop)**: Utilize the **Daily Cause List PDF** sharing feature. When an advocate shares the daily cause list to their chamber group (WhatsApp/Telegram), append a footer: 
    > *"Generated using CaseDiary App. Download CaseDiary to manage your chamber cases offline."*

---

## 📋 7-Day Advocate Onboarding Sequence
To maximize retention (D1 to D7), CaseDiary should trigger timely in-app prompts and reminders:

- **Day 0 (Install)**: Welcome prompt. Show a 3-step walkthrough slide on how to add a case and upload their first document.
- **Day 1 (Activation)**: If the user hasn't added a case, display a friendly card on the Dashboard: *"Have a case tomorrow? Add it in 5 seconds to get morning reminders."*
- **Day 3 (Discovery)**: Prompt to link case contacts. Highlight that adding a client's phone number lets them call/text directly from the case details screen.
- **Day 5 (Engagement)**: Introduce the "PDF Export" feature. Encourage them to print or share their Cause List for tomorrow's hearings.
- **Day 7 (Upsell/Nudge)**: If they have added 5+ cases and are active, prompt for a Play Store review or display a gentle banner highlighting the benefits of CaseDiary Premium.
