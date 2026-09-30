# 🏛️ Advocase (CaseDiary): Comprehensive App Features & Problem-Solving Index

> **File:** `docs/APP_FEATURES_AND_SOLUTIONS.md`  
> **App:** Advocase — Digital Court Munshi for Indian Advocates  
> **Package ID:** `com.iamshiv.CaseDiary`  
> **Scope:** Exhaustive catalog of every capability, sub-feature, utility, and screen present in the codebase, paired with the exact real-world problem it solves for trial, district, and appellate advocates.

---

## 📑 Table of Contents
1. [Overview of the Advocate's Digital Workspace](#1-overview-of-the-advocates-digital-workspace)
2. [Module 1: Daily Court Diary & Cause List Management](#module-1-daily-court-diary--cause-list-management)
3. [Module 2: Case Dossier & Record Management](#module-2-case-dossier--record-management)
4. [Module 3: Client Communication & WhatsApp Automation](#module-3-client-communication--whatsapp-automation)
5. [Module 4: eCourts Data Ingestion, Import & Smart Parsers](#module-4-ecourts-data-ingestion-import--smart-parsers)
6. [Module 5: In-App Legal Drafting Studio & Document Hub](#module-5-in-app-legal-drafting-studio--document-hub)
7. [Module 6: Courtroom Intelligence (Scanner, OCR & Voice Notes)](#module-6-courtroom-intelligence-scanner-ocr--voice-notes)
8. [Module 7: Financial Accounting & Advocate Fee Tracking](#module-7-financial-accounting--advocate-fee-tracking)
9. [Module 8: Interactive Court Calendar & Scheduling](#module-8-interactive-court-calendar--scheduling)
10. [Module 9: Global Search & Instant Case Retrieval](#module-9-global-search--instant-case-retrieval)
11. [Module 10: Proactive Notification Engine & Daily Digests](#module-10-proactive-notification-engine--daily-digests)
12. [Module 11: Master Lookup & Chamber Customization](#module-11-master-lookup--chamber-customization)
13. [Module 12: Data Privacy, On-Device SQLite & Cloud Backup](#module-12-data-privacy-on-device-sqlite--cloud-backup)
14. [Module 13: Advocate Profile & Chamber Letterhead Branding](#module-13-advocate-profile--chamber-letterhead-branding)
15. [Module 14: Localization, Multilingual UI & Transliteration](#module-14-localization-multilingual-ui--transliteration)

---

## 1. Overview of the Advocate's Digital Workspace

The Indian legal practice differs fundamentally from Western corporate legal practice. An Indian advocate:
- Manages 10 to 30 active courtroom matters across multiple physical court buildings every day.
- Operates in physical court environments often lacking mobile internet connectivity (basements, remote taluka courts).
- Faces strict compliance with procedural dates, where missing a single hearing or order date can lead to an *ex-parte* order or dismissal for non-prosecution.
- Fields dozens of daily client calls inquiring about hearing outcomes.

**Advocase** replaces fragile physical diaries with an offline-first mobile workstation. Below is the granular breakdown of every feature currently built into the application.

---

## Module 1: Daily Court Diary & Cause List Management

### 1.1 Today's Hearings Queue
* **In-App Location:** `DashboardScreen.tsx` (`HomeScreen`)
* **What It Does:** Queries the SQLite database for all active matters where `NextDate == Today`. It groups and ranks hearings by courtroom number and serial/item number.
* **The Problem It Solves:** Advocates often arrive at court with scribbled notes on loose paper or an unorganized diary. Finding out which courtroom to attend first causes frantic corridor dashes and missed case calls.
* **Before vs. After:**
  * *Before:* Flipping through pages of a thick diary while walking; asking clerks which judge is sitting.
  * *After:* Opening the app at 9:30 AM to see an ordered list of today’s matters, sorted by courtroom priority.

### 1.2 Tomorrow's Hearings Preview
* **In-App Location:** `DashboardScreen.tsx` (Summary strip & Quick Filter)
* **What It Does:** Pre-calculates tomorrow’s hearing schedule, total case count, and pending court preparation tasks.
* **The Problem It Solves:** Late-evening preparation (*peshi ki taiyari*) usually requires pulling out files late at night. 
* **Before vs. After:**
  * *Before:* Staying in the chamber until 9:00 PM manually compiling tomorrow’s files.
  * *After:* Checking tomorrow’s case count at 5:00 PM to brief juniors and bundle required briefs in minutes.

### 1.3 Yesterday's Cases Review Queue
* **In-App Location:** `Screens/YesterdaysCases/YesterdaysCasesScreen.tsx`
* **What It Does:** Detects cases whose hearing date was yesterday but where the advocate did not enter a new `NextDate` or hearing notes. Displays an actionable triage list.
* **The Problem It Solves:** On busy trial days, advocates often argue 8–10 matters and forget to record what happened in 2 of them before rushing home. Those cases become "lost" until a furious client calls weeks later.
* **Before vs. After:**
  * *Before:* A case slips out of sight; the advocate misses the next date, causing an arrest warrant or dismissal.
  * *After:* A red indicator on the Dashboard highlights: *"3 cases from yesterday need updates"*. The advocate resolves them in 30 seconds.

### 1.4 Undated Cases Tracker
* **In-App Location:** `Screens/UndatedCases/UndatedCasesScreen.tsx`
* **What It Does:** Scans the database for cases where `NextDate` is null, empty, or unassigned.
* **The Problem It Solves:** In Indian courts, when a judge reserves an order (*Order Reserved*), or files are sent for record verification, no next date is given immediately. In paper diaries, these cases get lost because they cannot be written on any future calendar page.
* **Before vs. After:**
  * *Before:* Reserved orders or sine-die matters are completely forgotten for months.
  * *After:* A dedicated "Undated Matters" vault allows weekly status audits until a fresh date is assigned.

### 1.5 1-Tap Daily Cause List PDF Exporter
* **In-App Location:** `utils/pdfExporter.ts`, `utils/causeListConfig.ts`, `Screens/Dashboard/Dashboard.tsx`
* **What It Does:** Generates a formatted, high-resolution PDF document displaying the advocate's daily court cause list, featuring the Advocate's Name, Bar Enrollment Number, Courtroom, Item No., Parties, Case No., and Stage.
* **The Problem It Solves:** Junior advocates, court clerks (*munshis*), and peons require a physical or digital list of cases to manage courtroom attendance, file pulling, and pass-overs.
* **Before vs. After:**
  * *Before:* Manually handwriting or typing 15 case numbers on WhatsApp every night for juniors.
  * *After:* Tapping "Export PDF", generating a clean letterhead-style PDF, and sharing it to the chamber WhatsApp group in 3 seconds.

---

## Module 2: Case Dossier & Record Management

### 2.1 Comprehensive Case Profile (`AddCase.tsx` & `CaseDetailsScreen.tsx`)
* **In-App Location:** `Screens/Addcase/AddCase.tsx`, `Screens/CaseDetailsScreen/CaseDetailsScreen.tsx`
* **What It Does:** Stores all metadata required in Indian litigation:
  * **Core Identifiers:** Case Title, CNR Number (16-digit eCourts ID), Case Number (e.g., O.S./Civil Suit/Crl. Misc.), Filing Year.
  * **Court Context:** Court Name, Case Type (Civil, Criminal, Writ, etc.), Presiding Judge Name.
  * **Parties & Representation:** Client Name, On Behalf Of (Petitioner/Respondent/Applicant), Opposing Party Name, Accused Name.
  * **Counsel Details:** Opposing Counsel Name, Opposing Counsel Phone Number.
  * **Criminal/Police Details:** Crime/FIR Number, FIR Year, Police Station, Under Sections (e.g., Sec 302 IPC / Sec 103 BNS), Sessions Trial Number.
  * **Procedural Tracking:** Case Stage (Framing of Charge, Prosecution Evidence, Arguments, etc.), Priority Tag (High/Medium/Low), Statute of Limitations.
* **The Problem It Solves:** Litigators previously had details scattered across paper files, WhatsApp chats, court orders, and memory. When a judge asks *"Who is the IO?"* or *"What sections are charged?"*, fumbling through files irritates the bench.
* **Before vs. After:**
  * *Before:* Digging through a 200-page brief in the middle of arguments to find the FIR number and Police Station.
  * *After:* Glancing at the phone screen to see all case details instantly.

### 2.2 Case Hearing History & Interactive Timeline
* **In-App Location:** `DataBase/caseTimelineDb.ts`, `Screens/CaseDetailsScreen/components/TimelineEventItem.tsx`
* **What It Does:** Maintains an immutable chronological audit trail of every past hearing date, orders passed, judicial observations, and procedural stages.
* **The Problem It Solves:** Cases often last 3 to 10 years in Indian courts. Remembering what happened 18 months ago before a previous judge is impossible without an organized timeline.
* **Before vs. After:**
  * *Before:* Manually reading hand-scribbled diary margins from two years ago to see why evidence was closed.
  * *After:* Scrolling through a smooth, chronological timeline showing every date, order note, and fee event.

### 2.3 Status Badges & Priority Flagging
* **In-App Location:** `Screens/CaseDetailsScreen/components/StatusBadge.tsx`
* **What It Does:** Visual tag indicators for Case Status (Open, In Progress, Reserved, Disposed, Appealed) and Priority (High, Medium, Low).
* **The Problem It Solves:** During heavy cause lists (20+ cases), critical bail hearings or injunction applications get equal mental weight as routine procedural adjournments.
* **Before vs. After:**
  * *Before:* Treating an urgent stay matter with the same urgency as a routine notice step.
  * *After:* High-priority red badges immediately alert the advocate to prioritize critical matters first.

### 2.4 Quick Contact Dialing & Messaging
* **In-App Location:** `CaseDetailsScreen.tsx`
* **What It Does:** Integrates one-tap native phone calling and SMS buttons right next to the Client Contact Number and Opposing Advocate Contact Number.
* **The Problem It Solves:** Searching for a client or opposing lawyer’s number in personal phone contacts is tedious, especially when saved months ago under vague names like *"Client Bail Delhi"*.
* **Before vs. After:**
  * *Before:* Exiting court notes, searching through 2,000 phone contacts, and calling the wrong client.
  * *After:* Tapping the phone icon inside the case dossier to connect instantly.

---

## Module 3: Client Communication & WhatsApp Automation

### 3.1 1-Click Automated WhatsApp Hearing Update
* **In-App Location:** `utils/whatsappNotifier.ts`, `Screens/CaseDetailsScreen/components/UpdateHearingPopup.tsx`
* **What It Does:** When updating a hearing date, an integrated WhatsApp button dynamically generates and sends a personalized, professional message to the client's phone number without requiring typing:
  > *"Dear [Client Name], your case [Case Title] (CNR: [CNRNumber]) was heard today before [Judge Name]. The next hearing is scheduled on [Next Date] for [Purpose/Stage]. Regards, Adv. [Advocate Name]."*
* **The Problem It Solves:** The single most exhausting administrative task for an Indian litigator is answering 20 to 50 client phone calls every evening asking: *"Sir, aaj hamari tareekh me kya hua?"*
* **Before vs. After:**
  * *Before:* Spending 2 hours every evening making repetitive, emotionally draining phone calls.
  * *After:* Tapping a green button immediately upon stepping out of the courtroom. The client receives a formal update within 3 seconds, building immense trust.

### 3.2 Automated Next Date Reminder Messages
* **In-App Location:** `utils/whatsappNotifier.ts`
* **What It Does:** Pre-formats upcoming court appearance alerts for clients 24–48 hours before the hearing date.
* **The Problem It Solves:** Clients forgetting to show up for their evidence or statement under Sec 313 CrPC leads to non-bailable warrants or adjournment costs.
* **Before vs. After:**
  * *Before:* Scrambling on the morning of a hearing because the client forgot to come to court.
  * *After:* Clients receive automated WhatsApp reminders to appear on time.

---

## Module 4: eCourts Data Ingestion, Import & Smart Parsers

### 4.1 eCourts Services App Direct Backup Importer
* **In-App Location:** `Screens/Settings/ECourtsAppImportScreen.tsx`, `utils/ecourtsParser.ts`
* **What It Does:** Imports cases exported from the official National Judicial Data Grid / eCourts Services mobile application, parsing cases, CNRs, and court details in bulk.
* **The Problem It Solves:** Manually re-typing 100+ active cases when migrating from the official government eCourts app into a private diary is a major friction barrier.
* **Before vs. After:**
  * *Before:* Spending 15 hours manually keying in case titles, CNRs, and parties.
  * *After:* Selecting the eCourts export file and watching all 100 cases populate in 10 seconds.

### 4.2 Raw eCourts Text & SMS Smart Parser
* **In-App Location:** `Screens/CasesList/components/ECourtsTextImportModal.tsx`, `utils/ecourtsParser.ts`
* **What It Does:** Employs regex algorithms and legal pattern recognition to parse raw, unformatted text copied from court websites, cause lists, or court SMS notifications. It automatically extracts:
  * CNR Number (e.g., `DLHC010012342023`)
  * Case Type & Registration Number
  * Petitioner vs. Respondent party names
  * Courtroom Name & Next Hearing Date
* **The Problem It Solves:** Court status information is often received as disjointed SMS notifications or copied from website tables. Re-typing each field into individual text inputs is frustrating.
* **Before vs. After:**
  * *Before:* Switching back and forth between SMS and the app, copying each field one by one.
  * *After:* Pasting the entire SMS into the modal; the app parses and fills all inputs instantly.

### 4.3 Duplicate Review & Conflict Resolution Engine
* **In-App Location:** `Screens/Onboarding/DuplicateReviewScreen.tsx`, `utils/bulkCaseManager.ts`
* **What It Does:** Cross-references incoming imports against existing database records using CNR numbers and case numbers. Flags potential collisions and gives the advocate choices: Merge, Overwrite, or Skip.
* **The Problem It Solves:** Accidental duplicate imports create conflicting hearing dates and clutter the cause list.
* **Before vs. After:**
  * *Before:* Multiple duplicate entries for the same case causing confusion.
  * *After:* A clean conflict resolution screen highlighting exact differences and preserving existing notes.

---

## Module 5: In-App Legal Drafting Studio & Document Hub

### 5.1 Pre-Loaded Indian Court Legal Templates (20+ Templates)
* **In-App Location:** `utils/documentTemplates.ts`, `Screens/CaseDetailsScreen/GenerateDocumentScreen.tsx`
* **What It Does:** Ships with ready-to-use, legally vetted templates in both English and Hindi:
  1. **Vakalatnama (वकालतनामा)**
  2. **Adjournment Application (तारीख पेशी प्रार्थना पत्र)**
  3. **Regular Bail Application (जमानत प्रार्थना पत्र)**
  4. **Anticipatory Bail Application (अग्रिम जमानत)**
  5. **FIR Quashing Petition (Sec 482 CrPC / BNSS)**
  6. **Personal Exemption Application (हाजिरी माफी - Sec 205 / 317 CrPC)**
  7. **Section 138 NI Act Cheque Bounce Notice (चेक बाउंस विधिक नोटिस)**
  8. **General Legal Notice (विधिक नोटिस)**
  9. **Caveat Petition (कैविएट याचिका)**
  10. **Temporary Injunction Application (Order 39 Rule 1 & 2 CPC)**
  11. **Civil Plaint (वाद पत्र / Plaint)**
  12. **Written Statement (जवाब दावा / WS)**
  13. **Rejoinder / Replication**
  14. **Execution Petition (इजराय)**
  15. **Private Criminal Complaint (परिवाद - Sec 200 CrPC)**
  16. **Arbitration Section 9 Interim Relief Petition**
  17. **Consumer Forum Complaint**
  18. **Affidavit (शपथ पत्र)**
  19. **Power of Attorney (मुख्तारनामा)**
  20. **Rent Agreement (किरायानामा)**
* **The Problem It Solves:** Advocates frequently need an urgent Adjournment, Exemption, or Bail application while standing in the court corridor. Finding a typist, waiting in line, and paying ₹100–₹200 per page wastes critical minutes.
* **Before vs. After:**
  * *Before:* Rushing to the court typist pool to draft a simple 1-page exemption while the judge is calling the matter.
  * *After:* Selecting the template, letting the app auto-populate client and case details, editing on phone, and printing immediately.

### 5.2 Dynamic Variable Auto-Injection
* **In-App Location:** `Screens/CaseDetailsScreen/components/PlaceholderBottomSheet.tsx`
* **What It Does:** Automatically replaces template placeholders (`{{courtName}}`, `{{caseNumber}}`, `{{parties}}`, `{{advocateName}}`, `{{advocateEnrollment}}`) with real data from the case dossier and advocate profile.
* **The Problem It Solves:** Copy-pasting old drafts from a laptop often leads to embarrassing clerical errors (e.g., submitting an application with the previous client’s name or wrong court number).
* **Before vs. After:**
  * *Before:* High risk of typographical errors in judge names or party titles.
  * *After:* 100% accurate, computerized substitution directly from the active case record.

### 5.3 Rich Text WYSIWYG Legal Editor (Tiptap Engine)
* **In-App Location:** `Screens/CaseDetailsScreen/TiptapEditDraftScreen.tsx`, `utils/realTiptapEditorTemplate.ts`, `utils/tiptapOfflineBundle.ts`
* **What It Does:** A full-fledged offline rich text drafting environment inside the app supporting:
  * Headings, bold, italics, underline, strike-through.
  * Text alignment (justified text conforming to high court filing standards).
  * Bullet points, ordered lists, and blockquotes.
  * Table creation and column configuration (`TableConfigModal.tsx`).
  * Legal margins and page break visualization.
* **The Problem It Solves:** Most mobile text editors lack formal legal formatting (justification, headers, tables for schedule of property).
* **Before vs. After:**
  * *Before:* Unformatted plain text notes that cannot be submitted to court.
  * *After:* Publication-grade legal pleadings ready for court submission.

### 5.4 Digital Touch Signature Canvas
* **In-App Location:** `Screens/CaseDetailsScreen/components/SignatureCanvasModal.tsx`
* **What It Does:** Allows the advocate or client to sign directly on the mobile touchscreen using a finger or stylus, embedding the digital signature image directly into the legal document draft.
* **The Problem It Solves:** E-filing and urgent PDF submissions require signatures. Advocates had to print, sign with a pen, and re-scan the document.
* **Before vs. After:**
  * *Before:* Printing physical copies just to sign and scan them again.
  * *After:* Signing on the screen and exporting the signed PDF directly.

### 5.5 Centralized Document Drafts Hub
* **In-App Location:** `Screens/Settings/DraftsHubScreen.tsx`
* **What It Does:** A unified repository displaying all legal drafts created across all cases, with filters for custom vs. system templates, last edited dates, and quick PDF re-exports.
* **The Problem It Solves:** Drafts get scattered across different phone folders, WhatsApp downloads, and email attachments.
* **Before vs. After:**
  * *Before:* Losing track of which draft version was sent to the client.
  * *After:* One clean hub organizing every draft by case title and timestamp.

---

## Module 6: Courtroom Intelligence (Scanner, OCR & Voice Notes)

### 6.1 Multi-Page Camera Document Scanner
* **In-App Location:** `Screens/Dashboard/PdfScannerScreen.tsx`, `Screens/Addcase/DocumentUpload.tsx`
* **What It Does:** Uses the device camera to photograph physical court orders, charge sheets, summons, or certified copies, auto-crops edges, and compiles them into a single compressed PDF linked to the case file.
* **The Problem It Solves:** Litigators receive certified physical copies of orders or police reports in court and risk misplacing the paper sheets before reaching their chamber.
* **Before vs. After:**
  * *Before:* Stuffing loose court order sheets into pockets or bags, risking damage or loss.
  * *After:* Snapping 3 photos in the courtroom; the app binds them into a permanent case PDF.

### 6.2 Optical Character Recognition (OCR) Engine
* **In-App Location:** `utils/ocrService.ts`, `Screens/CaseDetailsScreen/components/OcrReviewModal.tsx`
* **What It Does:** Scans photographed documents and extracts editable textual content, allowing advocates to copy clauses, citations, or testimonies straight into their legal drafts.
* **The Problem It Solves:** Manually typing out long paragraphs from an opposing party's petition or a lower court judgment into a memo of appeal wastes hours.
* **Before vs. After:**
  * *Before:* Hand-typing 5 pages of lower court findings into an appeal memo.
  * *After:* Snapping a photo, extracting text via OCR, and inserting it into the appeal draft.

### 6.3 Speech-to-Text Audio Dictation
* **In-App Location:** `utils/speechRecognitionService.ts`
* **What It Does:** Converts spoken words into case notes in real-time, supporting Indian English legal vocabulary and terms.
* **The Problem It Solves:** Stepping out of a courtroom with the judge's verbal directions fresh in mind, typing on a small on-screen keyboard while walking in a crowded corridor is difficult.
* **Before vs. After:**
  * *Before:* Postponing note-taking until evening, by which time specific judicial observations are forgotten.
  * *After:* Dictating a 15-second voice note outside the courtroom door; speech is converted into permanent text notes.

### 6.4 Legal Vocabulary & Autocomplete Bar
* **In-App Location:** `utils/legalAutocompleteService.ts`, `utils/legalVocabulary.ts`, `Screens/CaseDetailsScreen/components/LegalAutocompleteBar.tsx`
* **What It Does:** Predicts and auto-completes complex legal phrases (e.g., *Prima facie*, *Locus standi*, *Mutatis mutandis*, *Ad-interim ex-parte*, sections of IPC, CrPC, CPC, BNS, BNSS).
* **The Problem It Solves:** Mobile keyboards constantly auto-correct specialized legal terms and Latin maxims into nonsensical ordinary words.
* **Before vs. After:**
  * *Before:* Fighting mobile keyboard auto-correct over terms like *Certiorari* or *Vakalatnama*.
  * *After:* Tapping dedicated legal suggestion chips above the keyboard for instant insertion.

---

## Module 7: Financial Accounting & Advocate Fee Tracking

### 7.1 Case Fee Management (`schema.ts` & `CaseDetailsScreen.tsx`)
* **In-App Location:** `DataBase/schema.ts` (`total_fee`, `fee_paid`), `Screens/CaseDetailsScreen/CaseDetailsScreen.tsx`
* **What It Does:** Tracks the financial relationship for each legal matter:
  * Total agreed professional fee.
  * Advance / fees paid to date.
  * Outstanding balance calculation.
  * Progress visualization bar indicating fee realization percentage.
* **The Problem It Solves:** Advocates frequently forget how much fee was agreed upon or whether the client has paid for the current stage (e.g., evidence stage fee), leading to awkward arguments or lost revenue.
* **Before vs. After:**
  * *Before:* Forgetting whether a client owes ₹15,000 before arguing their final stage.
  * *After:* A glance at the case header shows: *"Paid: ₹25,000 / Pending: ₹10,000"*.

### 7.2 Financial Ledger & Payment Event History
* **In-App Location:** `DataBase/caseTimelineDb.ts` (`amount`, `payment_mode`, `event_type`)
* **What It Does:** Logs individual fee payment installments (Cash, UPI, Cheque, Bank Transfer) as timestamped events in the case timeline.
* **The Problem It Solves:** Disagreements arise when a client claims: *"Sir, I already paid you ₹10,000 in cash 3 months ago"*, and the advocate has no written receipt.
* **Before vs. After:**
  * *Before:* Clashing with clients over unrecorded cash payments.
  * *After:* Showing the client the recorded date, amount, and payment mode on the spot.

---

## Module 8: Interactive Court Calendar & Scheduling

### 8.1 Monthly & Weekly Court Calendar
* **In-App Location:** `Screens/Calendar/Calendar.tsx`
* **What It Does:** A specialized calendar view displaying marked indicators on every date that has scheduled courtroom hearings.
* **The Problem It Solves:** When a judge asks: *"Counsel, suggest a suitable date in the third week of November"*, advocates cannot check their court conflicts quickly.
* **Before vs. After:**
  * *Before:* Guessing a date, only to discover later that they already have 4 heavy trials in another court on that exact day.
  * *After:* Tapping the November date on the in-app calendar to see workload density and picking a clash-free hearing date.

### 8.2 Day-Specific Hearing Breakdown
* **In-App Location:** `Screens/Calendar/Calendar.tsx`
* **What It Does:** Tapping any date reveals all scheduled cases for that day with courtroom numbers, parties, and stages, allowing direct entry into any case record.
* **The Problem It Solves:** Planning chamber workload and assigning junior advocates across different courts days in advance.
* **Before vs. After:**
  * *Before:* Waiting until the evening before a hearing to see the court schedule.
  * *After:* Reviewing the schedule 2 weeks in advance to manage junior briefings.

---

## Module 9: Global Search & Instant Case Retrieval

### 9.1 Multi-Parameter Real-Time Search
* **In-App Location:** `Screens/SearchScreen/SearchScreen.tsx`
* **What It Does:** Real-time search across hundreds of cases indexing:
  * Case Title & Client Name.
  * CNR Number & Case Registration Number.
  * Opposing Party & Opposing Counsel.
  * Court Name & Judge Name.
  * Police Station, FIR Number & Legal Section.
* **The Problem It Solves:** A client calls from the court gate saying *"Sir, I am Ramesh, my case is in Court 5"*. In a 400-page paper diary, finding "Ramesh" takes several minutes.
* **Before vs. After:**
  * *Before:* Awkwardly asking the client for file numbers while searching through paper piles.
  * *After:* Typing "Ramesh" in the search box; the case dossier opens in 0.1 seconds.

### 9.2 Filter by Case Type, Status & Court
* **In-App Location:** `Screens/SearchScreen/SearchScreen.tsx`, `Screens/CasesList/CasesList.tsx`
* **What It Does:** Enables filtering cases by status (Active, Disposed, Reserved), Case Type (Civil, Criminal, Family, Writ, Consumer), or specific Court Forum.
* **The Problem It Solves:** When an advocate wants to audit all pending Consumer Forum cases or check all Criminal appeals, paper diaries offer no way to filter.
* **Before vs. After:**
  * *Before:* Impossible to extract category-specific case lists without manual tallying.
  * *After:* Tapping the "Consumer" or "Criminal" pill to view the exact sub-portfolio.

---

## Module 10: Proactive Notification Engine & Daily Digests

### 10.1 Morning 7:30 AM Cause List Digest
* **In-App Location:** `utils/notificationScheduler.ts`
* **What It Does:** Automatically triggers a local device notification every morning at 7:30 AM summarizing the day’s courtroom schedule (e.g., *"Good Morning Sir! You have 6 hearings scheduled today across District Court & High Court"*).
* **The Problem It Solves:** Advocates occasionally forget a hearing scheduled weeks ago if they did not open their physical diary the previous evening.
* **Before vs. After:**
  * *Before:* Starting the day unprepared and scrambling when a junior calls about a forgotten matter.
  * *After:* Waking up to an automated morning briefing on the phone lock screen.

### 10.2 Evening 6:00 PM Post-Court Update Reminder
* **In-App Location:** `utils/notificationScheduler.ts`
* **What It Does:** Prompts the advocate in the evening if any of today’s hearings are still missing next dates or hearing outcomes.
* **The Problem It Solves:** Post-court fatigue causes lawyers to put off updating case records until they completely forget.
* **Before vs. After:**
  * *Before:* Forgetting to record order dates after a long day.
  * *After:* A gentle evening nudge reminding the advocate to update cases and trigger client WhatsApp alerts before leaving the chamber.

### 10.3 In-App Notification Inbox
* **In-App Location:** `Screens/Notifications/NotificationInboxScreen.tsx`, `DataBase/appNotificationsDb.ts`
* **What It Does:** A dedicated inbox storing all past alerts, date updates, and reminders for historical reference.
* **The Problem It Solves:** Swiping away a push notification accidentally usually means the information is lost.
* **Before vs. After:**
  * *Before:* Lost push notifications cannot be recovered.
  * *After:* Checking the in-app inbox anytime to review all recent alerts.

---

## Module 11: Master Lookup & Chamber Customization

### 11.1 Dynamic Master Categories Manager
* **In-App Location:** `Screens/Settings/ManageLookupCategoryScreen.tsx`
* **What It Does:** Allows the advocate to add, edit, or delete custom:
  * Court Names (e.g., adding local Tribunals, DRT, NCLT, Family Courts).
  * Case Types (e.g., adding specific state writ classifications).
  * Police Stations & Districts.
* **The Problem It Solves:** Static dropdowns in generic apps fail because every Indian district has unique court designations and police station names.
* **Before vs. After:**
  * *Before:* Frustrated by rigid dropdown menus that lack the advocate’s local court or police station.
  * *After:* Full freedom to configure local court names once, after which they appear across all dropdowns.

### 11.2 Pre-Loaded Indian Police Station & District Database
* **In-App Location:** `assets/police-stations.json`, `assets/states-and-districts.json`, `DataBase/schema.ts`
* **What It Does:** Comes pre-seeded with hundreds of Indian districts, states, and police stations for fast autocomplete during case creation.
* **The Problem It Solves:** Having to manually type out full district and police station names repeatedly.
* **Before vs. After:**
  * *Before:* Manually typing district and jurisdiction details for every single case.
  * *After:* Selecting the district from pre-populated lists in 1 tap.

---

## Module 12: Data Privacy, On-Device SQLite & Cloud Backup

### 12.1 100% Offline-First On-Device Architecture
* **In-App Location:** `DataBase/connection.ts`, `DataBase/schema.ts`
* **What It Does:** All case records, notes, client numbers, and hearing history reside in an encrypted SQLite database stored locally on the advocate’s physical device.
* **The Problem It Solves:**
  1. *Connectivity:* Indian court basements, lockups, and rural taluka courts frequently have zero mobile signal. Cloud-only apps fail and spin indefinitely.
  2. *Attorney-Client Privilege:* Advocates are legally and ethically bound to maintain client confidentiality (Indian Evidence Act / Bar Council of India rules). Storing sensitive case notes on unsecured third-party servers raises compliance concerns.
* **Before vs. After:**
  * *Before:* Cloud legal apps freezing in court basements; hesitation about sensitive client data privacy.
  * *After:* Zero loading lag, zero internet required, and complete client data confidentiality.

### 12.2 Private Google Drive Encrypted Cloud Backup & Restore
* **In-App Location:** `utils/backupManager.ts`, `Screens/Settings/DatabaseImportScreen.tsx`, `Screens/Settings/SettingsScreen.tsx`
* **What It Does:** Provides one-tap encrypted backup of the entire SQLite database and case documents directly to the advocate's personal Google Drive account, with full one-tap restore capability.
* **The Problem It Solves:** If a phone is lost, stolen, or damaged, or when the advocate purchases a new smartphone, years of case records could be lost.
* **Before vs. After:**
  * *Before:* Fear of losing the phone and forfeiting decades of case history.
  * *After:* Restoring the entire chamber database onto a new phone in under 60 seconds from Google Drive.

---

## Module 13: Advocate Profile & Chamber Letterhead Branding

### 13.1 Advocate Professional Identity & Chamber Letterhead
* **In-App Location:** `Screens/ProfileScreen/Profile.tsx`, `DataBase/userProfileDB.ts`
* **What It Does:** Stores the advocate's professional credentials:
  * Full Name & Honorific (Advocate, Senior Counsel).
  * Bar Council Enrollment Number (e.g., `D/1234/2012`).
  * Chamber Address & Court Office Location.
  * Primary Contact Number & Email.
* **The Problem It Solves:** Professional documents (Cause List PDFs, Legal Drafts, Notices) must include the advocate's enrollment number and chamber details to be legally compliant.
* **Before vs. After:**
  * *Before:* Manually typing chamber address and enrollment numbers on every generated draft.
  * *After:* Automatically branding every exported PDF with the advocate's official letterhead header and footer.

### 13.2 Real-Time Practice Statistics
* **In-App Location:** `Screens/ProfileScreen/Profile.tsx`, `Screens/ProfileScreen/components/EditableStatItem.tsx`
* **What It Does:** Calculates and displays real-time key metrics of the legal practice:
  * Total Matters Managed.
  * Active Pending Cases.
  * Disposed / Decided Matters.
  * Total Unique Clients.
* **The Problem It Solves:** Solo practitioners rarely have business intelligence on their practice growth or case resolution rate.
* **Before vs. After:**
  * *Before:* No visibility into practice metrics or annual caseload trends.
  * *After:* Instant insight into caseload distribution and chamber throughput.

---

## Module 14: Localization, Multilingual UI & Transliteration

### 14.1 Multilingual UI (Hindi & English Support)
* **In-App Location:** `Providers/LanguageProvider.tsx`, `utils/translations.ts`
* **What It Does:** Full language toggling between English and Hindi across the entire application interface, buttons, headings, and alert dialogs.
* **The Problem It Solves:** Thousands of advocates practicing in District & Sessions Courts, CJM courts, and Revenue boards in North and Central India conduct proceedings in Hindi.
* **Before vs. After:**
  * *Before:* Struggling with complex English-only tech interfaces.
  * *After:* A clean, natural Hindi interface using authentic legal terminology (प्रकरण, वाद, अगली पेशी, जमानत).

### 14.2 Smart Legal Transliteration Engine
* **In-App Location:** `utils/transliterationService.ts`
* **What It Does:** Allows advocates to type in Roman English letters (e.g., typing *"Ramesh Kumar vs Rajendra Prasad"*) and have it automatically converted into Devanagari script (*रमेश कुमार बनाम राजेन्द्र प्रसाद*) when drafting in Hindi.
* **The Problem It Solves:** Typing on pure Devanagari keyboards is slow for advocates accustomed to QWERTY typing.
* **Before vs. After:**
  * *Before:* Slow, tedious Hindi keyboard typing.
  * *After:* Fast phonetic typing that converts directly into legal Hindi text.

---

## 🎯 Summary Matrix: Features vs. Core Advocate Pain Points

| Core Advocate Pain Point | Specific Advocase Solution | Module & Tools |
| :--- | :--- | :--- |
| **Heavy 2kg paper diary & frantic page-flipping** | Ordered Today's Cause List & instant multi-keyword search | Module 1 & Module 9 |
| **2 hours wasted on evening client phone calls** | 1-Click automated WhatsApp hearing update | Module 3 (`whatsappNotifier.ts`) |
| **Cases lost/dismissed when no next date is given** | Dedicated "Undated Cases" & "Yesterday's Cases" trackers | Module 1 (`UndatedCasesScreen.tsx`) |
| **No internet connectivity in courtroom basements** | 100% offline encrypted on-device SQLite database | Module 12 (`schema.ts`) |
| **Waiting in line and paying ₹200 for court typists** | In-app legal drafting studio with 20+ auto-filled templates | Module 5 (`documentTemplates.ts`) |
| **Clashing hearing dates across different courts** | Interactive Court Calendar with workload density markers | Module 8 (`Calendar.tsx`) |
| **Losing all records when changing or losing phones** | 1-Tap encrypted backup & restore via private Google Drive | Module 12 (`backupManager.ts`) |
| **Manual preparation of cause lists for junior counsel** | 1-Click professional Cause List PDF exporter | Module 1 (`pdfExporter.ts`) |
| **Disputes with clients over unpaid or cash fees** | Integrated case fee ledger and payment history timeline | Module 7 (`caseTimelineDb.ts`) |
| **Re-typing 100+ cases from eCourts manually** | Bulk eCourts Services App import and SMS text parser | Module 4 (`ecourtsParser.ts`) |
