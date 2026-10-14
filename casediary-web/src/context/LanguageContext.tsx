"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "en" | "hi";

interface Translations {
  [key: string]: {
    en: string;
    hi: string;
  };
}

export const TRANSLATIONS: Translations = {
  // Navigation & Workspace Shell
  dailyDiary: { en: "Daily Diary", hi: "दैनिक डायरी" },
  courtCalendar: { en: "Court Calendar", hi: "न्यायालय कैलेंडर" },
  chamberTeam: { en: "Chamber Team", hi: "चेंबर टीम" },
  casesDirectory: { en: "Cases Directory", hi: "मुकदमों की सूची" },
  addNewCase: { en: "Add New Case", hi: "नया केस दर्ज करें" },
  dailyCauseList: { en: "Daily Cause List", hi: "दैनिक कॉज लिस्ट" },
  legalDrafting: { en: "Drafting Studio", hi: "ड्राफ्टिंग स्टूडियो" },
  feeLedger: { en: "Fee Ledger", hi: "फीस व बहीखाता" },
  ecourtsSync: { en: "eCourts Sync", hi: "ई-कोर्ट्स सिंक" },
  bareActs: { en: "Bare Acts", hi: "बेयर एक्ट्स" },
  legalCalculators: { en: "Calculators", hi: "कैलकुलेटर" },
  pricingPlans: { en: "Pricing", hi: "प्लान्स व शुल्क" },
  chamberSettings: { en: "Settings", hi: "सेटिंग्स" },
  quickSearch: { en: "Quick Search", hi: "त्वरित खोज" },
  search: { en: "Search", hi: "खोजें" },
  login: { en: "Sign In", hi: "साइन इन" },
  logout: { en: "Sign Out", hi: "साइन आउट" },
  chamberWorkspace: { en: "Chamber Workspace", hi: "चेंबर वर्कस्पेस" },
  legalToolsLibrary: { en: "Legal Tools & Library", hi: "कानूनी उपकरण व लाइब्रेरी" },
  protected: { en: "Protected", hi: "सुरक्षित" },
  publicTag: { en: "PUBLIC", hi: "निःशुल्क" },
  freeBadge: { en: "Free", hi: "मुफ़्त" },
  chamberGuest: { en: "Chamber Guest", hi: "चेंबर अतिथि" },
  signInToUnlock: { en: "Sign in to unlock dossiers", hi: "डॉक्युमेंट्स खोलने हेतु साइन इन करें" },
  switchProfile: { en: "Switch Profile", hi: "प्रोफ़ाइल बदलें" },
  seniorAdvocate: { en: "Senior Advocate", hi: "वरिष्ठ अधिवक्ता" },
  chamberAlerts: { en: "Chamber Alerts", hi: "चेंबर सूचनाएं" },
  noAlerts: { en: "No unread notifications", hi: "कोई अपठित सूचना नहीं है" },
  expandSidebar: { en: "Expand sidebar", hi: "साइडबार खोलें" },
  collapseSidebar: { en: "Collapse sidebar", hi: "साइडबार समेटें" },
  themeLight: { en: "Light Mode", hi: "लाइट थीम" },
  themeDark: { en: "Dark Mode", hi: "डार्क थीम" },
  themeSystem: { en: "System Mode", hi: "सिस्टम अनुसार" },
  themeToggle: { en: "Toggle theme", hi: "थीम बदलें" },
  themeAppearance: { en: "Appearance & Theme", hi: "रूप-रंग एवं थीम" },
  themeAppearanceDesc: { en: "Customize courtroom workspace theme for daytime hearings or night research.", hi: "दिन की अदालती सुनवाई अथवा रात्रि अध्ययन हेतु चेंबर का रूप-रंग चुनें।" },

  // Legal Vocabulary & Statuses (Aligned with mobile app utils/translations.ts & legalVocabulary.ts)
  openCases: { en: "Active Cases", hi: "सक्रिय मुकदमे" },
  todaysHearings: { en: "Today's Hearings", hi: "आज की सुनवाई" },
  tomorrowHearings: { en: "Tomorrow's Hearings", hi: "कल की सुनवाई" },
  tomorrowPrep: { en: "Tomorrow's Prep", hi: "कल की तैयारी" },
  needsAction: { en: "Needs Action", hi: "कार्रवाई आवश्यक" },
  undatedMatters: { en: "Undated Matters", hi: "तारीख रहित मुकदमे" },
  recentOutcomes: { en: "Recent Outcomes", hi: "हालिया आदेश / परिणाम" },
  hearingQueue: { en: "Today's Court Docket & Hearing Queue", hi: "आज की कोर्ट कॉज लिस्ट एवं सुनवाई सूची" },
  recordOutcome: { en: "Record Outcome", hi: "परिणाम दर्ज करें" },
  fullDossier: { en: "Full Dossier", hi: "पूरा विवरण" },
  noHearingsToday: { en: "No hearings listed for today.", hi: "आज के लिए कोई सुनवाई सूचीबद्ध नहीं है।" },

  // Case Statuses
  statusOpen: { en: "Open", hi: "खुला (Open)" },
  statusInProgress: { en: "In Progress", hi: "प्रगति पर (In Progress)" },
  statusClosed: { en: "Closed", hi: "निस्तारित (Closed)" },
  statusDisposed: { en: "Disposed", hi: "निस्तारित (Disposed)" },
  statusOnHold: { en: "On Hold", hi: "लंबित / स्थगित" },
  statusAppealed: { en: "Appealed", hi: "अपील में (Appealed)" },
  statusReserved: { en: "Order Reserved", hi: "आदेश सुरक्षित (Reserved)" },

  // Priorities
  priorityHigh: { en: "High Priority", hi: "उच्च प्राथमिकता" },
  priorityMedium: { en: "Medium Priority", hi: "मध्यम प्राथमिकता" },
  priorityLow: { en: "Low Priority", hi: "सामान्य प्राथमिकता" },
  priorityUrgent: { en: "Urgent", hi: "अति आवश्यक" },

  // Hearing Stages & Court Procedures
  stageArguments: { en: "Arguments", hi: "अंतिम बहस (Arguments)" },
  stageEvidence: { en: "Evidence", hi: "साक्ष्य / गवाही (Evidence)" },
  stageBailHearing: { en: "Bail Hearing", hi: "जमानत सुनवाई (Bail Hearing)" },
  stageFramingOfCharge: { en: "Framing of Charges", hi: "आरोप विरचन (Charges)" },
  stageCrossExamination: { en: "Cross-Examination", hi: "प्रतिपरीक्षा (Cross)" },
  stageOrderReserved: { en: "Order Reserved", hi: "आदेश सुरक्षित (Reserved)" },
  stagePassOver: { en: "Pass-Over", hi: "पास-ओवर (Pass-Over)" },
  stageAdjourned: { en: "Adjourned", hi: "स्थगित (Adjourned)" },
  stageNotice: { en: "Notice / Summons", hi: "नोटिस / समन" },
  stageFinalOrder: { en: "Final Order / Judgment", hi: "अंतिम निर्णय / फैसला" },

  // Case Form & Details Fields (100% matched with App translations.ts)
  fieldCaseTitle: { en: "Case Title", hi: "केस शीर्षक" },
  fieldClientName: { en: "Client Name", hi: "मुवक्किल का नाम" },
  fieldCaseNumber: { en: "Case Number", hi: "केस नंबर" },
  fieldSessionTrialNumber: { en: "Sessions Trial Number", hi: "सत्र परीक्षण संख्या (ST No.)" },
  fieldCnrNumber: { en: "CNR Number", hi: "सीएनआर नंबर (CNR No.)" },
  fieldCaseType: { en: "Case Type", hi: "केस प्रकार" },
  fieldCourt: { en: "Court / Forum", hi: "न्यायालय / ट्रिब्यूनल" },
  fieldCourtName: { en: "Court Name", hi: "न्यायालय का नाम" },
  fieldFiledDate: { en: "Date Filed", hi: "दाखिल करने की तिथि" },
  fieldJudgeName: { en: "Presiding Judge", hi: "पीठासीन न्यायाधीश" },
  fieldOpposingCounsel: { en: "Opposing Counsel", hi: "विपक्षी वकील" },
  fieldOppositeAdvocate: { en: "Opposite Advocate", hi: "विपक्षी अधिवक्ता" },
  fieldOppAdvocateContact: { en: "Opp. Advocate Contact", hi: "विपक्षी अधिवक्ता संपर्क" },
  fieldCaseStatus: { en: "Case Status", hi: "केस की स्थिति" },
  fieldPriorityLevel: { en: "Priority Level", hi: "प्राथमिकता स्तर" },
  fieldHearingDate: { en: "Next Hearing Date", hi: "अगली सुनवाई तिथि" },
  fieldStatuteOfLimitations: { en: "Statute of Limitations", hi: "परिसीमा काल (Limitation)" },
  fieldFirstParty: { en: "First Party / Petitioner / Plaintiff", hi: "प्रथम पक्ष / याचिकाकर्ता / वादी" },
  fieldOppositeParty: { en: "Opposite Party / Respondent / Defendant", hi: "विपक्षी / प्रत्यर्थी / प्रतिवादी" },
  fieldClientContact: { en: "Client Contact No.", hi: "मुवक्किल संपर्क नंबर" },
  fieldAccused: { en: "Accused Name(s)", hi: "अभियुक्त का नाम" },
  fieldUnderSection: { en: "Under Section(s)", hi: "धाराएं (Under Sections)" },
  fieldCaseDescription: { en: "Case Description", hi: "केस का संक्षिप्त विवरण" },
  fieldCaseNotes: { en: "Internal Notes", hi: "आंतरिक कानूनी टिप्पणियां" },
  fieldCrimeNumber: { en: "FIR / Crime No.", hi: "प्राथमिकी / अपराध संख्या" },
  fieldPoliceStation: { en: "Police Station", hi: "थाना (Police Station)" },
  fieldDistrict: { en: "District", hi: "जिला (District)" },
  fieldStageOfHearing: { en: "Stage of Hearing", hi: "सुनवाई का चरण" },
  fieldTotalFee: { en: "Total Agreed Fee", hi: "कुल तय फीस" },
  fieldReceivedFee: { en: "Fee Received", hi: "प्राप्त फीस" },
  fieldPendingFee: { en: "Pending Balance", hi: "बकाया राशि" },

  // Action Buttons & General Labels
  btnSave: { en: "Save", hi: "सहेजें" },
  btnSaveChanges: { en: "Save Changes", hi: "बदलाव सहेजें" },
  btnCancel: { en: "Cancel", hi: "रद्द करें" },
  btnDelete: { en: "Delete", hi: "हटाएं" },
  btnEdit: { en: "Edit", hi: "संपादित करें" },
  btnExportPdf: { en: "Export PDF", hi: "पीडीएफ निर्यात करें" },
  btnPrint: { en: "Print", hi: "प्रिंट करें" },
  btnShare: { en: "Share", hi: "साझा करें" },
  btnFilter: { en: "Filter", hi: "फ़िल्टर" },
  btnAll: { en: "All", hi: "सभी" },
  btnBack: { en: "Back", hi: "वापस जाएं" },
  btnContinue: { en: "Continue", hi: "जारी रखें" },
  btnPrevious: { en: "Previous", hi: "पिछला" },
  btnNext: { en: "Next", hi: "अगला" },
  btnDownload: { en: "Download", hi: "डाउनलोड करें" },
  btnUpload: { en: "Upload", hi: "अपलोड करें" },
  btnRefresh: { en: "Refresh", hi: "रिफ्रेश करें" },
  btnSubmit: { en: "Submit", hi: "जमा करें" },
  btnConfirm: { en: "Confirm", hi: "पुष्टि करें" },
  btnClose: { en: "Close", hi: "बंद करें" },

  // New Criminal Laws (BNS, BNSS, BSA)
  bnsTitle: { en: "Bharatiya Nyaya Sanhita, 2023", hi: "भारतीय न्याय संहिता, २०२३ (BNS)" },
  bnssTitle: { en: "Bharatiya Nagarik Suraksha Sanhita, 2023", hi: "भारतीय नागरिक सुरक्षा संहिता, २०२३ (BNSS)" },
  bsaTitle: { en: "Bharatiya Sakshya Adhiniyam, 2023", hi: "भारतीय साक्ष्य अधिनियम, २०२३ (BSA)" },
  ipcEquivalent: { en: "IPC Equivalent", hi: "आईपीसी समतुल्य धारा" },
  crpcEquivalent: { en: "CrPC Equivalent", hi: "सीआरपीसी समतुल्य धारा" },
  ieaEquivalent: { en: "IEA Equivalent", hi: "साक्ष्य अधिनियम समतुल्य" },
  cognizable: { en: "Cognizable", hi: "संज्ञेय (Cognizable)" },
  nonCognizable: { en: "Non-Cognizable", hi: "असंज्ञेय (Non-Cognizable)" },
  bailable: { en: "Bailable", hi: "जमानती (Bailable)" },
  nonBailable: { en: "Non-Bailable", hi: "गैर-जमानती (Non-Bailable)" },
  compoundable: { en: "Compoundable", hi: "शमनीय (Compoundable)" },
  nonCompoundable: { en: "Non-Compoundable", hi: "अशमनीय" },
  punishment: { en: "Punishment", hi: "दंड / सजा" },
  triableBy: { en: "Triable By", hi: "विचारणीय न्यायालय" },

  // Common UI & Search
  searchPlaceholder: { en: "Search cases, CNR, acts...", hi: "केस, सीएनआर, धारा खोजें..." },
  filterAll: { en: "All Courts", hi: "सभी न्यायालय" },
  today: { en: "Today", hi: "आज" },
  yesterday: { en: "Yesterday", hi: "कल (बीता)" },
  tomorrow: { en: "Tomorrow", hi: "कल (आने वाला)" },
  printCauseList: { en: "Print Daily Cause List", hi: "दैनिक कॉज लिस्ट प्रिंट करें" },
  language: { en: "Language", hi: "भाषा" },
  theme: { en: "Theme", hi: "थीम" },
  loading: { en: "Loading...", hi: "लोड हो रहा है..." },
  noData: { en: "No records found", hi: "कोई विवरण उपलब्ध नहीं है" },

  // Landing Page Copy
  landingHeroBadge: { en: "BNS 2023 READY • LITIGATION WORKSPACE", hi: "नए आपराधिक कानून २०२३ समर्थित • लीगल वर्कस्पेस" },
  landingHeroH1: { en: "Litigation Management for Modern Indian Advocates", hi: "भारतीय अधिवक्ताओं के लिए आधुनिक न्यायालय डायरी एवं लीगल वर्कस्पेस" },
  landingHeroSub: { en: "Secure daily chamber diary, real-time cause lists, automatic BNS/CrPC mapping, court fee calculators, and TipTap legal drafting studio in one unified platform.", hi: "दैनिक चेंबर डायरी, रीयल-टाइम कॉज लिस्ट, बीएनएस/सीआरपीसी मैपिंग, न्यायालय शुल्क कैलकुलेटर और कानूनी ड्राफ्टिंग स्टूडियो—सब एक ही सुरक्षित स्थान पर।" },
  landingOpenChamberBtn: { en: "Launch Chamber Diary", hi: "दैनिक डायरी खोलें" },
  landingExploreBareActsBtn: { en: "Browse Bare Acts Directory", hi: "बेयर एक्ट्स डायरेक्टरी देखें" },
  landingConverterTitle: { en: "New Criminal Laws Quick Converter", hi: "नए आपराधिक कानून त्वरित परिवर्तक (BNS / BNSS / BSA)" },
  landingConverterSub: { en: "Instant section cross-mapping between Indian Penal Code & Bharatiya Nyaya Sanhita", hi: "आईपीसी एवं भारतीय न्याय संहिता के बीच तत्काल धारा तुलना एवं विवरण" },
  landingPillarsTitle: { en: "Built for High-Stakes Indian Chambers", hi: "भारतीय न्यायालयों के अभ्यासरत वकीलों हेतु विशेष रूप से निर्मित" },
  landingPillarsSub: { en: "From Supreme Court & High Courts down to District & Taluka Bars across India.", hi: "सर्वोच्च न्यायालय व उच्च न्यायालयों से लेकर देश के समस्त जिला एवं तालुका बार तक।" },

  // Bare Acts Portal
  bareActsPortalTitle: { en: "Indian Statutory Directory & Bare Acts Portal", hi: "भारतीय संविधि डायरेक्टरी एवं बेयर एक्ट्स पोर्टल" },
  bareActsPortalSub: { en: "Complete statutory text with BNS, BNSS, BSA, IPC, CrPC, CPC, and commercial enactments.", hi: "भारतीय न्याय संहिता, नागरिक सुरक्षा, साक्ष्य अधिनियम एवं अन्य प्रमुख केंद्रीय कानूनों का संपूर्ण संग्रह।" },
  allActs: { en: "All Enactments", hi: "समस्त कानून" },
  section: { en: "Section", hi: "धारा" },
  offenceDetails: { en: "Offence Details", hi: "अपराध विवरण" },
  keyChangesInNewLaw: { en: "Key Amendments & Inclusions", hi: "नए कानून में प्रमुख संशोधन व प्रावधान" },

  // Calculators Portal
  calculatorsTitle: { en: "Indian Legal & Court Fee Calculators", hi: "भारतीय कानूनी एवं न्यायालय शुल्क कैलकुलेटर" },
  calculatorsSub: { en: "Statutory limitation periods under Limitation Act 1963, court fees schedules, and interest rates.", hi: "परिसीमा अधिनियम १९६३ के अंतर्गत सीमा अवधि, राज्यवार न्यायालय शुल्क एवं ब्याज गणना।" },
  tabCourtFee: { en: "Court Fee Calculator", hi: "न्यायालय शुल्क (Court Fee)" },
  tabLimitation: { en: "Limitation Period Calculator", hi: "परिसीमा काल (Limitation)" },
  tabInterest: { en: "Section 34 CPC Interest", hi: "धारा ३४ सीपीसी ब्याज (Interest)" },
  claimAmount: { en: "Suit Valuation / Claim Amount (₹)", hi: "वाद मूल्यांकन / दावा राशि (₹)" },
  courtType: { en: "Court Jurisdiction", hi: "न्यायालय क्षेत्राधिकार" },
  causeOfActionDate: { en: "Date of Cause of Action", hi: "वाद हेतुक की तिथि (Cause of Action)" },
  natureOfSuit: { en: "Nature of Suit / Application", hi: "मुकदमे / आवेदन की प्रकृति" },
  calculateNow: { en: "Calculate Period", hi: "अवधि की गणना करें" },
  limitationStatus: { en: "Limitation Assessment", hi: "परिसीमा स्थिति" },
  withinLimitation: { en: "Within Limitation Period", hi: "परिसीमा अवधि के भीतर (Valid)" },
  timeBarred: { en: "Time-Barred / Expired", hi: "परिसीमा अवधि समाप्त (Time-Barred)" },
  daysRemaining: { en: "Days Remaining", hi: "शेष दिन" },
  lastDateToSue: { en: "Last Date to File", hi: "दाखिल करने की अंतिम तिथि" },

  // Pricing Page
  pricingTitle: { en: "Transparent Chamber Subscriptions", hi: "पारदर्शी चेंबर सब्सक्रिप्शन प्लान" },
  pricingSub: { en: "Zero hidden charges. Built for solo practitioners, boutique firms, and multi-bench senior chambers.", hi: "कोई अप्रत्यक्ष शुल्क नहीं। एकल वकीलों, एसोसिएट्स एवं बहु-सदस्यीय चेंबरों हेतु अनुकूलित।" },
  billedAnnually: { en: "Billed Annually", hi: "वार्षिक भुगतान" },
  billedMonthly: { en: "Billed Monthly", hi: "मासिक भुगतान" },
  saveDiscount: { en: "SAVE 33%", hi: "३३% छूट" },
  tierSoloTitle: { en: "Solo Practitioner", hi: "एकल अधिवक्ता (Solo)" },
  tierSoloSub: { en: "For independent litigators handling trial and appellate matters.", hi: "जिला एवं सत्र न्यायालयों में स्वतंत्र वकालत करने वाले वकीलों हेतु।" },
  tierProTitle: { en: "Chamber Pro", hi: "चेंबर प्रो (Chamber Pro)" },
  tierProSub: { en: "For growing chambers with juniors, associates, and multi-court listings.", hi: "जूनियर्स और एसोसिएट्स के साथ कार्य करने वाले सक्रिय चेंबरों हेतु।" },
  tierEnterpriseTitle: { en: "Senior Chamber & Firm", hi: "वरिष्ठ चेंबर व फर्म (Firm)" },
  tierEnterpriseSub: { en: "Unlimited multi-branch teams, white-glove onboarding, and dedicated support.", hi: "असीमित टीम सदस्य, कस्टम डेटाबेस माइग्रेशन एवं समर्पित चेंबर सपोर्ट।" },
  recommendedBadge: { en: "RECOMMENDED FOR ACTIVE ADVOCATES", hi: "सक्रिय अधिवक्ताओं हेतु सर्वोत्तम" },
  startFreeTrial: { en: "Start 14-Day Free Trial", hi: "१४ दिनों का निःशुल्क ट्रायल शुरू करें" },
  upgradeToPro: { en: "Upgrade to Chamber Pro", hi: "चेंबर प्रो में अपग्रेड करें" },
  contactChamberSales: { en: "Contact Chamber Sales", hi: "चेंबर टीम से संपर्क करें" },

  // Cases List Page
  casesListTitle: { en: "Cases Directory", hi: "मुकदमों की सूची" },
  casesListSub: { en: "Manage active litigation matters, hearings, CNR tracking, and client records.", hi: "सक्रिय मुकदमों, पेशियों, सीएनआर ट्रैकिंग और मुवक्किल विवरण का संपूर्ण प्रबंधन।" },
  addNewMatterBtn: { en: "New Case Matter", hi: "नया मुकदमा जोड़ें" },
  exportCasesCsv: { en: "Export Spreadsheet", hi: "एक्सेल स्प्रेडशीट निर्यात" },
  filterByStatus: { en: "Filter by Status", hi: "स्थिति अनुसार फ़िल्टर" },
  filterByCourt: { en: "Filter by Court", hi: "न्यायालय अनुसार फ़िल्टर" },
  searchCasesInput: { en: "Search by title, CNR, case no, client, judge, or section...", hi: "शीर्षक, सीएनआर, केस नंबर, मुवक्किल, जज या धारा खोजें..." },
  noMatchingCases: { en: "No matching case matters found.", hi: "कोई मेल खाता मुकदमा नहीं मिला।" },
  clearFilters: { en: "Clear Filters", hi: "फ़िल्टर हटाएं" },

  // Case Details / Dossier Page
  tabOverview: { en: "Case Overview", hi: "केस सिंहावलोकन" },
  tabHearingsTimeline: { en: "Hearings & Timeline", hi: "सुनवाई व समयरेखा" },
  tabDocuments: { en: "Documents & Evidence", hi: "दस्तावेज़ व साक्ष्य" },
  tabNotesStrategy: { en: "Legal Notes & Strategy", hi: "कानूनी नोट्स व रणनीति" },
  tabFinancials: { en: "Chamber Fee & Ledger", hi: "फीस व बहीखाता" },
  btnRecordNextHearing: { en: "Record Hearing Outcome", hi: "सुनवाई परिणाम दर्ज करें" },
  btnShareWithClient: { en: "Share Update with Client", hi: "मुवक्किल को सूचना भेजें" },
  btnEditDossier: { en: "Edit Matter Details", hi: "विवरण संपादित करें" },
  courtDocketDetails: { en: "Court & Docket Identification", hi: "न्यायालय एवं डॉकेट पहचान" },
  partiesRepresentation: { en: "Parties & Legal Representation", hi: "पक्षकार एवं कानूनी प्रतिनिधित्व" },
  statutoryDetails: { en: "Statutory Provisions & Police Report", hi: "संविधिक धाराएं एवं पुलिस प्राथमिकी" },
  timelineHistory: { en: "Case Hearing History & Outcomes", hi: "पेशी इतिहास एवं न्यायालय आदेश" },
  uploadDocument: { en: "Upload Legal Document", hi: "दस्तावेज़ अपलोड करें" },
  noDocumentsYet: { en: "No documents attached to this dossier yet.", hi: "इस मुकदमे से अभी कोई दस्तावेज़ संलग्न नहीं है।" },

  // Quick Search Dialog
  quickSearchTitle: { en: "Universal Chamber Search", hi: "सार्वभौमिक चेंबर खोज" },
  quickSearchSub: { en: "Search matters, clients, CNR numbers, acts, sections, or cause lists", hi: "मुकदमे, मुवक्किल, सीएनआर नंबर, कानून, धाराएं या कॉज लिस्ट खोजें" },
  quickSearchInputPlaceholder: { en: "Type CNR, case number, client, judge, or section...", hi: "सीएनआर, केस नंबर, मुवक्किल, जज या धारा टाइप करें..." },
  quickSearchNoResults: { en: "No matching records found in chamber database.", hi: "चेंबर डेटाबेस में कोई मेल खाता रिकॉर्ड नहीं मिला।" },

  // Notification Center
  notificationsTitle: { en: "Chamber Alerts & Action Center", hi: "चेंबर सूचनाएं एवं अलर्ट केंद्र" },
  markAllRead: { en: "Mark all as read", hi: "सभी को पढ़ा हुआ चिह्नित करें" },
  filterAllAlerts: { en: "All Alerts", hi: "समस्त अलर्ट" },
  filterHearings: { en: "Hearings", hi: "पेशियां" },
  filterLimitation: { en: "Limitation", hi: "परिसीमा" },
  filterSync: { en: "Sync", hi: "सिंक" },

  // Hearing Update Modal
  modalUpdateHearingTitle: { en: "Record Hearing Outcome & Next Date", hi: "सुनवाई परिणाम व अगली तारीख दर्ज करें" },
  labelHearingOutcome: { en: "Hearing Outcome / Stage Accomplished*", hi: "सुनवाई का परिणाम / संपन्न हुआ चरण*" },
  labelNextHearingDate: { en: "Next Hearing Date*", hi: "अगली पेशी की तारीख*" },
  labelNextStagePurpose: { en: "Next Purpose / Stage of Hearing*", hi: "अगली सुनवाई का उद्देश्य / चरण*" },
  labelCourtOrderNotes: { en: "Court Directions / Brief Order Summary", hi: "अदालती निर्देश / संक्षिप्त आदेश" },
  labelFeeCollected: { en: "Appearance Fee Collected (₹)", hi: "प्राप्त पेशी फीस (₹)" },
  btnSaveOutcome: { en: "Save & Update Diary", hi: "परिणाम सहेजें और डायरी अपडेट करें" },

  // Calendar Screen
  calHeaderTitle: { en: "Court Diary & Hearings Calendar", hi: "कोर्ट डायरी एवं सुनवाई कैलेंडर" },
  calAgendaTitle: { en: "Court Agenda for", hi: "के लिए अदालती कार्यसूची" },
  calMonthView: { en: "Month View", hi: "माह दृश्य" },
  calWeekView: { en: "Week View", hi: "सप्ताह दृश्य" },
  calDayView: { en: "Day View", hi: "दिवस दृश्य" },

  // Daily Cause List
  causeListTitle: { en: "Daily Court Cause List", hi: "दैनिक अदालती कॉज लिस्ट" },
  causeListSub: { en: "List of all chamber matters scheduled for hearing today.", hi: "आज सुनवाई हेतु सूचीबद्ध चेंबर के सभी मुकदमों का विवरण।" },
  itemNo: { en: "Item No.", hi: "क्रम संख्या" },
  courtRoom: { en: "Court Room / Bench", hi: "न्यायालय कक्ष / पीठ" },
  parties: { en: "Parties", hi: "पक्षकार" },
  advocateFor: { en: "Appearing For", hi: "किसकी ओर से" },

  // Drafting Studio (TipTap)
  draftingStudioTitle: { en: "TipTap Legal Drafting Studio", hi: "टिप-टैप कानूनी ड्राफ्टिंग स्टूडियो" },
  draftingStudioSub: { en: "Draft court petitions, plaints, written statements, bail applications, and agreements.", hi: "याचिकाएं, वाद पत्र, लिखित कथन, जमानत आवेदन और समझौते तैयार करें।" },
  templateBail: { en: "Bail Application (Sec 439 CrPC / 483 BNSS)", hi: "जमानत याचिका (४३९ दंड प्रक्रिया / ४८३ बीएनएसएस)" },
  templateAnticipatoryBail: { en: "Anticipatory Bail (Sec 438 CrPC / 482 BNSS)", hi: "अग्रिम जमानत याचिका (४३८ दंड प्रक्रिया / ४८२ बीएनएसएस)" },
  templatePlaint: { en: "Plaint / Civil Suit (Order VII CPC)", hi: "वाद पत्र / दीवानी दावा (आदेश ७ सीपीसी)" },
  templateWrittenStatement: { en: "Written Statement (Order VIII CPC)", hi: "लिखित कथन / जवाब दावा (आदेश ८ सीपीसी)" },
  templateVakalatnama: { en: "Vakalatnama (Authority Letter)", hi: "वकालतनामा (अधिकार पत्र)" },
  templateLegalNotice: { en: "Legal Demand Notice (Sec 138 NI Act)", hi: "कानूनी मांग नोटिस (धारा १३८ एनआई एक्ट)" },
  templateAffidavit: { en: "Supporting Affidavit", hi: "शपथ पत्र (Affidavit)" },

  // Finance & Fee Ledger
  financeTitle: { en: "Advocate Fee Ledger & Accounts", hi: "अधिवक्ता फीस बहीखाता व वित्तीय हिसाब" },
  financeSub: { en: "Chamber fee collections, court appearance date fees (peshi fees), and pending balances.", hi: "चेंबर फीस संग्रह, न्यायालय पेशी शुल्क (तारीख फीस) एवं बकाया राशि का प्रबंधन।" },
  totalBilledFees: { en: "Total Agreed Fees", hi: "कुल तयशुदा फीस" },
  feesCollected: { en: "Fees Collected", hi: "प्राप्त फीस" },
  outstandingReceivables: { en: "Outstanding Receivables", hi: "बकाया राशि" },
  matterWiseBreakdown: { en: "Matter-Wise Fee Breakdown", hi: "मुकदमेवार फीस विवरण" },
  acrossAllMatters: { en: "Across all active matters", hi: "सभी सक्रिय मुकदमों में" },
  realizedRevenue: { en: "Realized chamber revenue", hi: "प्राप्त चेंबर आय" },
  pendingClientPayments: { en: "Pending client payments", hi: "मुवक्किलों से लंबित भुगतान" },
  recoveryRate: { en: "Recovery %", hi: "वसूली प्रतिशत" },

  // Chamber Team & Junior Duty
  teamTitle: { en: "Chamber Team & Junior Duty Roster", hi: "चेंबर टीम एवं जूनियर ड्यूटी रोस्टर" },
  teamSub: { en: "Manage associates, junior advocates, clerks, and court appearance assignments.", hi: "एसोसिएट्स, कनिष्ठ वकीलों, क्लर्क व अदालत में पेशी ड्यूटी का प्रबंधन।" },
  tabDuties: { en: "Today's Court Duties", hi: "आज की कोर्ट ड्यूटी" },
  tabRoster: { en: "Team Directory", hi: "टीम डायरेक्टरी" },
  tabJuniorList: { en: "Junior Daily Cause List", hi: "जूनियर दैनिक कॉज लिस्ट" },
  assignDutyBtn: { en: "Assign Court Duty", hi: "कोर्ट ड्यूटी सौंपें" },
  addMemberBtn: { en: "Add Team Member", hi: "नया सदस्य जोड़ें" },

  // eCourts Sync Hub
  syncTitle: { en: "eCourts & Mobile Sync Hub", hi: "ई-कोर्ट्स एवं मोबाइल सिंक हब" },
  syncSub: { en: "Two-way synchronization between mobile app offline SQLite and cloud chamber database.", hi: "मोबाइल ऐप ऑफलाइन डेटाबेस एवं वेब चेंबर के बीच निर्बाध डेटा ट्रांसफर।" },
  exportBackup: { en: "Export JSON Backup", hi: "बैकअप JSON निर्यात करें" },
  importBackup: { en: "Import & Restore Data", hi: "डेटा आयात व रीस्टोर करें" },

  // Settings & Letterhead
  settingsTitle: { en: "Advocate Profile & Chamber Settings", hi: "अधिवक्ता प्रोफ़ाइल व चेंबर सेटिंग्स" },
  settingsSub: { en: "Configure chamber branding, Bar Council registration, and cause list letterhead.", hi: "चेंबर ब्रांडिंग, बार काउंसिल पंजीकरण एवं कॉज लिस्ट लेटरहेड सेट करें।" },
  advocateName: { en: "Advocate / Firm Name", hi: "अधिवक्ता / फर्म का नाम" },
  designation: { en: "Designation / Title", hi: "पदनाम / उपाधि" },
  barCouncilNo: { en: "Bar Council Enrollment Number", hi: "बार काउंसिल पंजीकरण संख्या" },
  chamberAddress: { en: "Chamber / Office Address", hi: "चेंबर / कार्यालय का पता" },
  practiceAreas: { en: "Practice Areas & Specializations", hi: "विशेषज्ञता के कानूनी क्षेत्र" },
  aboutMe: { en: "Professional Bio / Profile Summary", hi: "व्यावसायिक परिचय / सारांश" },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  t: (key: string) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("advocase_lang") as Language;
      if (saved && (saved === "en" || saved === "hi")) {
        setLanguageState(saved);
      }
    } catch {
      // localStorage may fail in private mode or SSR
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("advocase_lang", lang);
    } catch {
      // silent
    }
  };

  const t = (key: string): string => {
    if (TRANSLATIONS[key]) {
      return TRANSLATIONS[key][language] || TRANSLATIONS[key].en;
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
