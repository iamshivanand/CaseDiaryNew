// utils/legalNerService.ts

export interface ExtractedLegalEntities {
  cnrNumber?: string;
  caseNumber?: string;
  petitioner?: string;
  respondent?: string;
  courtName?: string;
  actsAndSections: string[];
  dates: string[];
  amounts: string[];
}

/**
 * Extracts structured legal entities from raw typed draft text offline using pattern recognition and NLP heuristics
 */
export const extractLegalEntities = (draftText: string): ExtractedLegalEntities => {
  if (!draftText) {
    return { actsAndSections: [], dates: [], amounts: [] };
  }

  // Strip HTML tags for clean text analysis
  const text = draftText.replace(/<[^>]*>/g, " ");

  const entities: ExtractedLegalEntities = {
    actsAndSections: [],
    dates: [],
    amounts: [],
  };

  // 1. Extract CNR Number (16-digit alphanumeric format e.g., MHAU010012342026)
  const cnrMatch = text.match(/\b([A-Z]{4}\d{12})\b/i);
  if (cnrMatch) {
    entities.cnrNumber = cnrMatch[1].toUpperCase();
  }

  // 2. Extract Case Number (e.g., Case No. 123/2026, Bail Application No. 402/2026, CS/102/2024)
  const caseNoMatch = text.match(
    /\b((?:Case|Bail App(?:lication)?|Civil Suit|Crl\.? Misc\.?|S\.?T\.?|W\.?P\.?|C\.?A\.?)\s*(?:No\.?|n\/o)?\s*\d+[\/\-]\d{2,4})\b/i
  );
  if (caseNoMatch) {
    entities.caseNumber = caseNoMatch[1];
  }

  // 3. Extract Court Name (trimmed at newline/period)
  const courtMatch = text.match(
    /(IN THE (?:HIGH COURT OF [A-Z\s,]+|SUPREME COURT OF INDIA|DISTRICT (?:& SESSIONS )?COURT[A-Z\s,]*|TRIBUNAL[A-Z\s,]*))/i
  );
  if (courtMatch) {
    const rawCourt = courtMatch[1].split(/\n|\r|CNR/)[0].trim();
    entities.courtName = rawCourt;
  }

  // 4. Extract Petitioner / Respondent (e.g., "John Doe ... Petitioner", "State of MH ... Respondent", "X Versus Y")
  const versusMatch = text.match(
    /([A-Z0-9\s.,]+?)\s+(?:VERSUS|VS\.?|V\/S)\s+([A-Z0-9\s.,]+?)(?=\n|<br>|\.\s|$|IN THE|BEFORE)/i
  );
  if (versusMatch) {
    entities.petitioner = versusMatch[1].replace(/\s+/g, " ").trim();
    entities.respondent = versusMatch[2].replace(/\s+/g, " ").trim();
  } else {
    // Fallback: search for "Petitioner:" or "Respondent:" labels
    const petMatch = text.match(/(?:Petitioner|Appellant|Applicant|Plaintiff)\s*[:\-]\s*([A-Z0-9\s.,]+?)(?=\n|$|,)/i);
    if (petMatch) entities.petitioner = petMatch[1].trim();

    const resMatch = text.match(/(?:Respondent|Defendant|Opposite Party)\s*[:\-]\s*([A-Z0-9\s.,]+?)(?=\n|$|,)/i);
    if (resMatch) entities.respondent = resMatch[1].trim();
  }

  // 5. Extract Acts and Sections (e.g., "Section 420 IPC", "Section 138 NI Act", "Sec. 439 Cr.P.C.", "Article 226")
  const actSectionRegex = /\b((?:Section|Sec\.?|Article|Art\.?)\s*\d+[A-Z]?(?:\s+(?:read with|r\/w)\s+\d+[A-Z]?)?\s+(?:of\s+)?(?:IPC|Cr\.?P\.?C\.?|C\.?P\.?C\.?|N\.?I\.?\s*Act|Indian Penal Code|Constitution|Evidence Act|POCSO|NDPS|Motor Vehicles Act|MVA))\b/gi;
  const actMatches = text.match(actSectionRegex);
  if (actMatches) {
    entities.actsAndSections = Array.from(new Set(actMatches.map((m) => m.trim())));
  }

  // 6. Extract Dates (DD/MM/YYYY, DD-MM-YYYY, DDth Month YYYY)
  const dateRegex = /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})\b/gi;
  const dateMatches = text.match(dateRegex);
  if (dateMatches) {
    entities.dates = Array.from(new Set(dateMatches.map((d) => d.trim())));
  }

  // 7. Extract Currency Amounts (Rs. 50,000/-, ₹ 1,00,000, Rs. 1000)
  const amountRegex = /(?:Rs\.?|₹)\s*[\d,]+(?:\/\-)?/gi;
  const amountMatches = text.match(amountRegex);
  if (amountMatches) {
    entities.amounts = Array.from(new Set(amountMatches.map((a) => a.trim())));
  }

  return entities;
};
