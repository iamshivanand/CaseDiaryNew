import { db, sqlite } from "./index";
import * as schema from "./schema";
import { eq } from "drizzle-orm";

export function seedDatabase() {
  const existingUsers = db.select().from(schema.Users).all();
  if (existingUsers.length > 0) {
    console.log("Database already seeded. Skipping...");
    return;
  }

  console.log("Seeding database with initial advocate data...");

  // 1. Insert Default User (Advocate)
  const userResult = db
    .insert(schema.Users)
    .values({
      name: "Adv. Rajesh Sharma",
      email: "adv.rajesh.sharma@delhibar.in",
      phone: "+91 98101 23456",
      barCouncilNumber: "D/1248/2012",
      chamberAddress: "Chamber No. 412, Lawyers Chambers Block, Tis Hazari Courts, Delhi - 110054",
    })
    .returning()
    .get();

  const userId = userResult.id;

  // 2. Lawyer Profile
  db.insert(schema.LawyerProfiles)
    .values({
      user_id: userId,
      name: "Adv. Rajesh Sharma",
      designation: "Senior Litigator & Chamber Head",
      practiceAreas: "Criminal Defense, Commercial Disputes, Constitutional Writs, Cheque Bounce (NI Act)",
      aboutMe: "Practicing advocate at Delhi High Court & District Courts with over 14 years of litigation experience in criminal trials and appellate practice.",
      contactInfo: "Phone: +91 98101 23456 | Email: adv.rajesh.sharma@delhibar.in",
      languages: "English, Hindi, Punjabi",
      barCouncilNumber: "D/1248/2012",
      chamberAddress: "Chamber No. 412, Lawyers Chambers Block, Tis Hazari Courts, Delhi - 110054",
      letterheadConfig: JSON.stringify({
        chamberTitle: "SHARMA & ASSOCIATES ADVOCATES",
        subtitle: "Advocates, Legal Consultants & Trial Specialists",
        office: "Chamber 412, Tis Hazari Courts, Delhi 110054",
        phone: "+91 98101 23456",
        email: "adv.rajesh.sharma@delhibar.in",
      }),
    })
    .run();

  // 3. Insert Predefined Case Types
  const caseTypes = [
    "Criminal Bail Application",
    "Civil Suit for Recovery",
    "Cheque Bounce (Sec 138 NI Act)",
    "Writ Petition (Civil)",
    "Criminal Appeal",
    "Matrimonial / Divorce Petition",
    "Consumer Complaint",
    "Motor Accident Claim (MACT)",
    "Arbitration Application",
  ];

  for (const name of caseTypes) {
    db.insert(schema.CaseTypes).values({ name, user_id: userId }).run();
  }

  // 4. Insert Districts
  const districts = [
    { name: "Central Delhi", state: "Delhi" },
    { name: "New Delhi", state: "Delhi" },
    { name: "South Delhi", state: "Delhi" },
    { name: "North West Delhi", state: "Delhi" },
    { name: "South West Delhi", state: "Delhi" },
  ];

  const districtIds: Record<string, number> = {};
  for (const d of districts) {
    const res = db.insert(schema.Districts).values({ ...d, user_id: userId }).returning().get();
    districtIds[d.name] = res.id;
  }

  // 5. Insert Courts
  const courts = [
    { name: "Tis Hazari District Court - Courtroom 14 (ASJ-02)", court_type: "District & Sessions" },
    { name: "Patiala House Courts - Courtroom 08 (CMM)", court_type: "Chief Metropolitan Magistrate" },
    { name: "Saket Courts - Courtroom 22 (Civil Judge)", court_type: "Senior Civil Judge" },
    { name: "Delhi High Court - Courtroom 31 (Division Bench)", court_type: "High Court" },
    { name: "Rohini Courts - Courtroom 05 (Sessions Judge)", court_type: "District & Sessions" },
  ];

  for (const c of courts) {
    db.insert(schema.Courts).values({ ...c, user_id: userId }).run();
  }

  // 6. Police Stations
  const policeStations = [
    { name: "PS Karol Bagh", district_id: districtIds["Central Delhi"] },
    { name: "PS Connaught Place", district_id: districtIds["New Delhi"] },
    { name: "PS Hauz Khas", district_id: districtIds["South Delhi"] },
    { name: "PS Rohini South", district_id: districtIds["North West Delhi"] },
  ];

  const psIds: Record<string, number> = {};
  for (const ps of policeStations) {
    const res = db.insert(schema.PoliceStations).values({ ...ps, user_id: userId }).returning().get();
    psIds[ps.name] = res.id;
  }

  // Compute dates: Today, Tomorrow, Yesterday
  const now = new Date();
  const formatYMD = (d: Date) => d.toISOString().split("T")[0];

  const todayStr = formatYMD(now);

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const tomorrowStr = formatYMD(tomorrow);

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayStr = formatYMD(yesterday);

  const nextWeek = new Date(now);
  nextWeek.setDate(now.getDate() + 7);
  const nextWeekStr = formatYMD(nextWeek);

  // 7. Insert Rich Sample Cases
  // Case 1: TODAY's Hearing
  const caseToday = db
    .insert(schema.Cases)
    .values({
      uniqueId: "CASE-DL-2026-001",
      user_id: userId,
      CaseTitle: "State vs. Vikram Malhotra & Ors.",
      ClientName: "Vikram Malhotra",
      OnBehalfOf: "Accused No. 1",
      CNRNumber: "DLCT010045232025",
      case_number: "SC No. 412/2025",
      case_year: 2025,
      court_name: "Tis Hazari District Court - Courtroom 14 (ASJ-02)",
      case_type_name: "Criminal Bail Application",
      dateFiled: "2025-11-10",
      NextDate: todayStr,
      PreviousDate: "2026-02-15",
      crime_number: "FIR No. 182/2025",
      crime_year: 2025,
      police_station_id: psIds["PS Karol Bagh"],
      district_id: districtIds["Central Delhi"],
      Undersection: "Sec 420, 468, 471, 120B IPC (Sec 318, 336 BNS)",
      FirstParty: "State of NCT of Delhi",
      OppositeParty: "Vikram Malhotra",
      Accussed: "Vikram Malhotra, Sandeep Verma",
      ClientContactNumber: "+91 98711 54321",
      JudgeName: "Hon'ble Sh. Ajay Kumar, ASJ-02",
      OpposingCounsel: "Sh. P.K. Gupta, Addl. Public Prosecutor",
      CaseStatus: "In Progress",
      Priority: "High",
      case_stage: "Arguments on Regular Bail",
      total_fee: 75000,
      fee_paid: 45000,
      date_fee: 5000,
      date_fee_collected: 5000,
      CaseDescription: "Regular bail application for primary accused Vikram Malhotra in alleged commercial forgery matter.",
      CaseNotes: "Produce bank verification certificates and prove non-custodial interrogation compliance under Arnesh Kumar guidelines.",
    })
    .returning()
    .get();

  db.insert(schema.CaseTimeline).values({
    case_id: caseToday.id,
    hearing_date: "2026-02-15",
    notes: "Notice issued to the Investigating Officer for filing Status Report. Reply awaited.",
    event_type: "order",
  }).run();

  // Case 2: TOMORROW's Hearing
  const caseTomorrow = db
    .insert(schema.Cases)
    .values({
      uniqueId: "CASE-DL-2026-002",
      user_id: userId,
      CaseTitle: "M/s Apex Logistics vs. Global Infratech Pvt Ltd",
      ClientName: "Apex Logistics Ltd (Mr. Arun Singhal)",
      OnBehalfOf: "Petitioner / Complainant",
      CNRNumber: "DLND020088922024",
      case_number: "CC No. 5814/2024",
      case_year: 2024,
      court_name: "Patiala House Courts - Courtroom 08 (CMM)",
      case_type_name: "Cheque Bounce (Sec 138 NI Act)",
      dateFiled: "2024-08-14",
      NextDate: tomorrowStr,
      PreviousDate: "2026-01-20",
      Undersection: "Sec 138, 141 Negotiable Instruments Act",
      FirstParty: "M/s Apex Logistics Ltd",
      OppositeParty: "Global Infratech Pvt Ltd",
      ClientContactNumber: "+91 98200 99887",
      JudgeName: "Ms. Neha Sharma, MM (NI Act)",
      OpposingCounsel: "Adv. K.R. Swaminathan",
      CaseStatus: "In Progress",
      Priority: "Medium",
      case_stage: "Complainant Evidence (Cross-Examination)",
      total_fee: 50000,
      fee_paid: 50000,
      CaseDescription: "Dishonour of three cheques amounting to Rs. 24,50,000/- issued towards freight transportation services.",
      CaseNotes: "AR (Authorized Representative) of Complainant to be tendered for cross-examination with original invoices.",
    })
    .returning()
    .get();

  // Case 3: YESTERDAY's Hearing (Un-updated action queue)
  const caseYesterday = db
    .insert(schema.Cases)
    .values({
      uniqueId: "CASE-DL-2026-003",
      user_id: userId,
      CaseTitle: "Sunita Devi vs. Ramesh Chand & Ors.",
      ClientName: "Sunita Devi",
      OnBehalfOf: "Plaintiff",
      CNRNumber: "DLST030012902023",
      case_number: "CS (OS) 304/2023",
      case_year: 2023,
      court_name: "Saket Courts - Courtroom 22 (Civil Judge)",
      case_type_name: "Civil Suit for Recovery",
      dateFiled: "2023-04-12",
      NextDate: yesterdayStr, // Still marked as yesterday! Needs update!
      PreviousDate: "2025-11-05",
      FirstParty: "Sunita Devi",
      OppositeParty: "Ramesh Chand",
      ClientContactNumber: "+91 99100 11223",
      JudgeName: "Sh. Ankit Mehra, Civil Judge",
      OpposingCounsel: "Adv. Devinder Rawat",
      CaseStatus: "Open",
      Priority: "High",
      case_stage: "Arguments on Temporary Injunction (Order 39 Rule 1 & 2 CPC)",
      total_fee: 60000,
      fee_paid: 30000,
      CaseDescription: "Partition and perpetual injunction suit concerning ancestral property in Greater Kailash.",
      CaseNotes: "Urgent: Update court outcome from yesterday's hearing! Client called twice.",
    })
    .returning()
    .get();

  // Case 4: UNDATED Matter (Reserved / Sine Die)
  const caseUndated = db
    .insert(schema.Cases)
    .values({
      uniqueId: "CASE-DL-2026-004",
      user_id: userId,
      CaseTitle: "Hindustan Petrochemicals vs. Union of India",
      ClientName: "Hindustan Petrochemicals Ltd",
      OnBehalfOf: "Petitioner",
      CNRNumber: "DLHC010077882024",
      case_number: "W.P.(C) 9920/2024",
      case_year: 2024,
      court_name: "Delhi High Court - Courtroom 31 (Division Bench)",
      case_type_name: "Writ Petition (Civil)",
      dateFiled: "2024-06-18",
      NextDate: null, // Undated!
      PreviousDate: "2026-01-15",
      FirstParty: "Hindustan Petrochemicals Ltd",
      OppositeParty: "Union of India & Central Board of Direct Taxes",
      ClientContactNumber: "+91 98111 88877",
      JudgeName: "Hon'ble The Chief Justice & Justice Manmohan",
      OpposingCounsel: "Additional Solicitor General of India",
      CaseStatus: "Reserved",
      Priority: "High",
      case_stage: "Judgment / Final Order Reserved",
      total_fee: 150000,
      fee_paid: 120000,
      CaseDescription: "Challenge to constitutional validity of retrospective tax notification under Article 226.",
      CaseNotes: "Final arguments concluded on 15 Jan 2026. Written submissions filed. Judgment reserved.",
    })
    .returning()
    .get();

  // Case 5: Future Hearing
  const caseFuture = db
    .insert(schema.Cases)
    .values({
      uniqueId: "CASE-DL-2026-005",
      user_id: userId,
      CaseTitle: "State vs. Rohit Bhati",
      ClientName: "Rohit Bhati",
      OnBehalfOf: "Accused",
      CNRNumber: "DLNW010023452024",
      case_number: "Sessions Case 88/2024",
      case_year: 2024,
      court_name: "Rohini Courts - Courtroom 05 (Sessions Judge)",
      case_type_name: "Criminal Appeal",
      dateFiled: "2024-03-01",
      NextDate: nextWeekStr,
      PreviousDate: "2026-02-01",
      crime_number: "FIR 44/2024",
      crime_year: 2024,
      police_station_id: psIds["PS Rohini South"],
      district_id: districtIds["North West Delhi"],
      Undersection: "Sec 307, 34 IPC",
      FirstParty: "State",
      OppositeParty: "Rohit Bhati",
      ClientContactNumber: "+91 97110 55443",
      JudgeName: "Sh. R.S. Ahlawat, Sessions Judge",
      OpposingCounsel: "Sh. Satish Kumar, Addl. PP",
      CaseStatus: "In Progress",
      Priority: "Medium",
      case_stage: "Prosecution Evidence (PW-3 & PW-4)",
      total_fee: 80000,
      fee_paid: 60000,
      CaseDescription: "Attempt to murder allegation arising out of neighborhood dispute.",
      CaseNotes: "Prepare cross-examination of medical officer regarding simple vs grievous injuries.",
    })
    .returning()
    .get();

  // 8. Document Drafts Templates
  db.insert(schema.DocumentDrafts).values([
    {
      id: "draft-bail-template-01",
      case_id: caseToday.id,
      case_title: caseToday.CaseTitle,
      client_name: caseToday.ClientName,
      case_number: caseToday.case_number,
      title: "Regular Bail Application u/s 439 Cr.P.C. / Sec 483 BNSS",
      template_type: "bail",
      html_content: `
        <div style="font-family: 'Times New Roman', serif; line-height: 1.6; font-size: 14pt;">
          <p style="text-align: center; font-weight: bold; text-decoration: underline;">
            IN THE COURT OF HON'BLE SESSIONS JUDGE, TIS HAZARI COURTS, DELHI
          </p>
          <p style="text-align: center; font-weight: bold;">
            BAIL APPLICATION NO. ______ OF 2026<br/>
            IN FIR NO. 182/2025 POLICE STATION KAROL BAGH<br/>
            U/S 420/468/471/120B IPC
          </p>
          <p style="margin-top: 20px;"><b>IN THE MATTER OF:</b><br/>
          <b>Vikram Malhotra</b> S/o Sh. Ramesh Malhotra ... Applicant / Accused<br/>
          <i>VERSUS</i><br/>
          <b>STATE OF NCT OF DELHI</b> ... Respondent
          </p>
          <p style="text-align: center; font-weight: bold; margin-top: 30px; text-decoration: underline;">
            APPLICATION UNDER SECTION 439 CR.P.C. (SEC 483 BNSS, 2023) FOR GRANT OF REGULAR BAIL ON BEHALF OF THE APPLICANT
          </p>
          <p><b>MOST RESPECTFULLY SHOWETH:</b></p>
          <ol>
            <li>That the Applicant is a respectable, peace-loving citizen of India having deep roots in society and has been falsely implicated in the above-titled case.</li>
            <li>That the applicant was arrested on 10.11.2025 and has been in continuous judicial custody since then. The investigation is complete and charge-sheet has already been submitted before the Hon'ble Trial Court.</li>
            <li>That no custodial interrogation of the applicant is any further required for any purpose whatsoever.</li>
            <li>That the Applicant undertakes to abide by all conditions that may be imposed by this Hon'ble Court and shall not tamper with evidence nor influence any witness.</li>
          </ol>
          <p style="margin-top: 40px; text-align: right;">
            <b>FILED BY:</b><br/>
            <b>ADV. RAJESH SHARMA</b><br/>
            Counsel for the Applicant<br/>
            Chamber 412, Tis Hazari Courts, Delhi<br/>
            Enrollment No. D/1248/2012
          </p>
        </div>
      `,
      is_custom_template: 0,
    },
    {
      id: "draft-vakalatnama-01",
      title: "Standard Advocate Vakalatnama (Delhi Courts Form)",
      template_type: "vakalatnama",
      html_content: `
        <div style="font-family: 'Times New Roman', serif; line-height: 1.6;">
          <h2 style="text-align: center; text-decoration: underline;">VAKALATNAMA</h2>
          <p style="text-align: center;">IN THE COURT OF ____________________________________</p>
          <p>Suit / Case No. ________________ of 2026</p>
          <p>_____________________________________ ... Plaintiff / Petitioner / Appellant</p>
          <p style="text-align: center;"><i>VERSUS</i></p>
          <p>_____________________________________ ... Defendant / Respondent / Accused</p>
          <p style="margin-top: 20px;">
            I / We, the undersigned, do hereby appoint and retain <b>ADV. RAJESH SHARMA (D/1248/2012)</b> to be our advocate in the above matter...
          </p>
        </div>
      `,
      is_custom_template: 0,
    },
  ]).run();

  // 9. Initial Notifications
  db.insert(schema.AppNotifications).values([
    {
      title: "Hearing Today: State vs. Vikram Malhotra",
      body: "Matter listed at Courtroom 14 (ASJ-02) Tis Hazari Courts for Arguments on Regular Bail.",
      category: "hearing",
      case_id: caseToday.id,
    },
    {
      title: "Action Required: Yesterday's Un-updated Case",
      body: "Sunita Devi vs. Ramesh Chand had a hearing yesterday. Please record the new next date and court orders.",
      category: "hearing",
      case_id: caseYesterday.id,
    },
  ]).run();

  console.log("Database seeded successfully with 5 matters across all triage queues!");
}

export function seedChamberTeam() {
  const existing = db.select().from(schema.ChamberMembers).all();
  if (existing.length > 0) return;

  console.log("Seeding initial chamber team roster & court duties...");

  const user = db.select().from(schema.Users).get();
  const userId = user?.id || 1;

  const m1 = db
    .insert(schema.ChamberMembers)
    .values({
      user_id: userId,
      name: "Adv. Ananya Deshmukh",
      role: "Junior Advocate",
      barCouncilNumber: "D/5412/2021",
      phone: "+91 98111 22334",
      email: "ananya.law@delhibar.in",
      assigned_courts: "Tis Hazari Courts, Rohini Courts",
      status: "Active",
    })
    .returning()
    .get();

  const m2 = db
    .insert(schema.ChamberMembers)
    .values({
      user_id: userId,
      name: "Adv. Rohan Gupta",
      role: "Senior Associate",
      barCouncilNumber: "D/3890/2019",
      phone: "+91 98222 33445",
      email: "rohan.gupta@delhibar.in",
      assigned_courts: "Patiala House Courts, Delhi High Court",
      status: "Active",
    })
    .returning()
    .get();

  const m3 = db
    .insert(schema.ChamberMembers)
    .values({
      user_id: userId,
      name: "Munshi Ram Prasad",
      role: "Court Clerk / Munshi",
      barCouncilNumber: "Delhi Bar Munshi Registry #412",
      phone: "+91 98333 44556",
      email: "ramprasad.clerk@gmail.com",
      assigned_courts: "Tis Hazari, Saket Courts",
      status: "Active",
    })
    .returning()
    .get();

  // Find cases to link
  const cases = db.select().from(schema.Cases).all();
  if (cases.length > 0) {
    const todayCase = cases[0];
    const tomorrowCase = cases.length > 1 ? cases[1] : cases[0];

    const todayStr = new Date().toISOString().split("T")[0];
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowStr = tomorrowDate.toISOString().split("T")[0];

    // Assign today's case to Adv. Ananya Deshmukh
    db.insert(schema.CaseAssignments).values({
      case_id: todayCase.id,
      member_id: m1.id,
      duty_date: todayStr,
      duty_type: "Pass-Over Request",
      status: "Pending",
      notes: "Seek pass-over till 11:30 AM before ASJ-02; Senior is arguing in High Court Courtroom 31.",
    }).run();

    // Assign tomorrow's case to Adv. Rohan Gupta
    db.insert(schema.CaseAssignments).values({
      case_id: tomorrowCase.id,
      member_id: m2.id,
      duty_date: tomorrowStr,
      duty_type: "Evidence / Cross",
      status: "Pending",
      notes: "Tender Authorized Representative with original invoices and certificate u/s 65B.",
    }).run();

    // Update case assigned member
    db.update(schema.Cases)
      .set({ assigned_member_id: m1.id })
      .where(eq(schema.Cases.id, todayCase.id))
      .run();
  }

  console.log("Chamber team and initial courtroom duties seeded successfully!");
}

// Auto-run if executed directly
if (require.main === module) {
  seedDatabase();
  seedChamberTeam();
}

