/**
 * Utility scripts and helpers for parsing public eCourts services data
 * from within the client-side WebView scraper modal.
 */

/**
 * Script injected into the WebView to extract raw DOM tables, headings, and acts.
 */
export const ecourtsParserJS = `
  (function() {
    try {
      const tables = document.querySelectorAll('table');
      if (tables.length === 0) {
        return;
      }

      const rawData = {
        tables: [],
        headings: [],
        acts: []
      };

      // 1. Extract headings for court name extraction
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, .court_name, .court-name, .court_title');
      headings.forEach(h => {
        const text = (h.innerText || h.textContent || '').trim();
        if (text) {
          rawData.headings.push(text);
        }
      });

      // Helper to clean up basic whitespace
      function cleanText(val) {
        if (!val) return '';
        return val.trim().replace(/\\s+/g, ' ');
      }

      // 2. Extract Acts
      tables.forEach(table => {
        let isDetailsTable = false;
        const rows = table.querySelectorAll('tr');
        rows.forEach(r => {
          const cells = r.querySelectorAll('td, th');
          cells.forEach(c => {
            const text = (c.innerText || c.textContent || '').toLowerCase();
            if (text.includes('cnr number') || text.includes('case type') || text.includes('filing number') || text.includes('next hearing date') || text.includes('registration number')) {
              isDetailsTable = true;
            }
          });
        });
        
        if (isDetailsTable) return;

        let actColIndex = -1;
        let secColIndex = -1;
        
        rows.forEach((row, rowIndex) => {
          const cells = row.querySelectorAll('td, th');
          for (let colIndex = 0; colIndex < cells.length; colIndex++) {
            const text = (cells[colIndex].innerText || cells[colIndex].textContent || '').trim().toLowerCase();
            if (text.includes('under act') || text === 'act' || text === 'act(s)') {
              actColIndex = colIndex;
            }
            if (text.includes('under section') || text === 'section' || text === 'section(s)') {
              secColIndex = colIndex;
            }
          }
          
          if (actColIndex !== -1 || secColIndex !== -1) {
            rows.forEach((dataRow, dataRowIndex) => {
              if (dataRowIndex === rowIndex) return; // skip header row
              const dataCells = dataRow.querySelectorAll('td, th');
              let actVal = '';
              let secVal = '';
              if (actColIndex !== -1 && dataCells[actColIndex]) {
                actVal = cleanText(dataCells[actColIndex].innerText || dataCells[actColIndex].textContent || '');
              }
              if (secColIndex !== -1 && dataCells[secColIndex]) {
                secVal = cleanText(dataCells[secColIndex].innerText || dataCells[secColIndex].textContent || '');
              }
              if (actVal || secVal) {
                const lowerAct = actVal.toLowerCase();
                const lowerSec = secVal.toLowerCase();
                // Skip if the values themselves look like headers
                if (lowerAct.includes('under act') || lowerSec.includes('under section') || lowerAct === 'act' || lowerSec === 'section') return;
                rawData.acts.push({ act: actVal, section: secVal });
              }
            });
          }
        });
      });

      // 3. Extract all key-value rows from all tables
      tables.forEach(table => {
        // Skip case history tables
        let isHistoryTable = false;
        const checkRows = table.querySelectorAll('tr');
        for (let i = 0; i < checkRows.length; i++) {
          const cells = checkRows[i].querySelectorAll('td, th');
          for (let j = 0; j < cells.length; j++) {
            const text = (cells[j].innerText || cells[j].textContent || '').toLowerCase();
            if (text.includes('business on date') || text.includes('purpose of hearing')) {
              isHistoryTable = true;
              break;
            }
          }
          if (isHistoryTable) break;
        }
        if (isHistoryTable) return;

        const rows = table.querySelectorAll('tr');
        rows.forEach((row, rowIndex) => {
          const cells = row.querySelectorAll('td, th');
          
          if (cells.length === 1) {
            const label = cleanText(cells[0].innerText || cells[0].textContent || '');
            if (label && label.length <= 80) {
              const nextRow = rows[rowIndex + 1];
              if (nextRow) {
                const nextCells = nextRow.querySelectorAll('td, th');
                if (nextCells.length === 1) {
                  const val = cleanText(nextCells[0].innerText || nextCells[0].textContent || '');
                  rawData.tables.push({ label, value: val, layout: 'vertical' });
                }
              }
            }
          } else {
            // Process cells in pairs to avoid duplicate/sliding window labels
            for (let j = 0; j < cells.length; j += 2) {
              if (j + 1 < cells.length) {
                const label = cleanText(cells[j].innerText || cells[j].textContent || '');
                const cleanLabel = label.replace(/:$/, '').trim();
                if (cleanLabel && cleanLabel.length <= 80) {
                  const val = cleanText(cells[j+1].innerText || cells[j+1].textContent || '');
                  rawData.tables.push({ label: cleanLabel, value: val, layout: 'horizontal' });
                }
              }
            }
          }
        });
      });

      window.ReactNativeWebView.postMessage(JSON.stringify({
        status: 'success',
        data: rawData
      }));
    } catch (e) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        status: 'error',
        message: e.toString()
      }));
    }
  })();
  true;
`;

export interface ExtractedCaseData {
  CNRNumber?: string;
  case_type_name?: string;
  filingNumber?: string;
  case_number?: string;
  NextDate?: string;
  FirstParty?: string;
  OppositeParty?: string;
  dateFiled?: string;
  JudgeName?: string;
  Undersection?: string;
  CaseTitle?: string;
  court_name?: string;
  CaseStatus?: string;
  OpposingCounsel?: string;
  police_station?: string;
  crime_number?: string;
  crime_year?: string;
  rawTables?: Array<{ label: string; value: string }>;
}

/**
 * Dynamically maps the raw JSON table outputs from eCourts into CaseDiary fields.
 */
export function parseRawECourtsData(rawData: any): ExtractedCaseData {
  const caseData: ExtractedCaseData = {};
  if (!rawData) return caseData;

  // Save raw scraped tables so the preview modal can render all fields dynamically
  caseData.rawTables = Array.isArray(rawData.tables)
    ? rawData.tables.map((item: any) => ({
        label: (item.label || '').trim(),
        value: (item.value || '').trim()
      }))
    : [];

  const fieldSynonyms = {
    case_type_name: ['case type', 'case_type'],
    filingNumber: ['filing number', 'filing no'],
    CNRNumber: ['cnr number', 'cnr no'],
    case_number: ['case number', 'case no', 'suit no', 'reg no', 'registration number', 'registration no'],
    NextDate: ['next hearing date', 'next date'],
    FirstParty: ['petitioner', 'plaintiff', 'appellant'],
    OppositeParty: ['respondent', 'defendant'],
    dateFiled: ['filing date', 'date of filing'],
    JudgeName: ['judge', 'presiding officer', 'bench'],
    Undersection: ['under section', 'section', 'act', 'under_section'],
    CaseStatus: ['case status', 'stage of case', 'status'],
    police_station: ['police station', 'police_station', 'ps', 'p.s.'],
    crime_number: ['fir number', 'fir no', 'crime number', 'crime no', 'fir number / year'],
    crime_year: ['fir year', 'crime year'],
    session_trial_number: ['sessions trial', 'session trial', 'sessions trial number', 'sessions trial no']
  };

  // Helper to clean up party names (Petitioner / Respondent) and remove advocate info
  function cleanPartyName(val: string) {
    if (!val) return '';
    let name = val.split(/advocate/i)[0];
    name = name.replace(/(?:\r?\n|^)\d+[\s\).:-]*/g, ', ');
    name = name.replace(/\r?\n/g, ', ');
    name = name.replace(/\s*,\s*/g, ', ');
    name = name.replace(/\s+/g, ' ');
    return name.trim().replace(/^,\s*/, '').replace(/,\s*$/, '').trim();
  }

  // Helper to extract advocate name
  function cleanAdvocateName(val: string) {
    if (!val) return '';
    const parts = val.split(/advocate/i);
    if (parts.length > 1) {
      let adv = parts[1];
      adv = adv.replace(/^[\s\d\).:-]+/, '');
      adv = adv.replace(/\r?\n/g, ', ');
      adv = adv.replace(/\s+/g, ' ');
      return adv.trim().replace(/^,\s*/, '').replace(/,\s*$/, '').trim();
    }
    return '';
  }

  // Helper to extract a 16-character alphanumeric CNR number
  function cleanCNR(val: string) {
    if (!val) return '';
    const clean = val.replace(/\s+/g, '');
    const match = clean.match(/[a-zA-Z]{4}\d{12}/);
    return match ? match[0].toUpperCase() : clean;
  }

  // 1. Process key-value rows
  if (Array.isArray(rawData.tables)) {
    rawData.tables.forEach((row: any) => {
      const label = (row.label || '').trim();
      const cleanLabel = label.toLowerCase();
      const rawValue = (row.value || '').trim();

      for (const [field, syns] of Object.entries(fieldSynonyms)) {
        const matches = syns.some(syn => {
          if (syn === 'hearing date') {
            return cleanLabel.includes('hearing date') && !cleanLabel.includes('first');
          }
          return cleanLabel.includes(syn);
        });

        if (matches) {
          const typedField = field as keyof ExtractedCaseData;
          if (!caseData[typedField] || (rawValue && !String(caseData[typedField]).trim())) {
            if (typedField === 'CNRNumber') {
              caseData.CNRNumber = cleanCNR(rawValue);
            } else if (typedField === 'FirstParty') {
              caseData.FirstParty = cleanPartyName(rawValue);
            } else if (typedField === 'OppositeParty') {
              caseData.OppositeParty = cleanPartyName(rawValue);
              const adv = cleanAdvocateName(rawValue);
              if (adv) {
                caseData.OpposingCounsel = adv;
              }
            } else if (typedField === 'crime_number') {
              const parts = rawValue.split('/');
              if (parts.length > 1) {
                caseData.crime_number = parts[0].trim();
                caseData.crime_year = parts[1].trim();
              } else {
                caseData.crime_number = rawValue;
              }
            } else {
              (caseData as any)[typedField] = rawValue;
            }
          }
          break;
        }
      }
    });
  }

  // 2. Process Acts and Sections
  if (Array.isArray(rawData.acts) && rawData.acts.length > 0) {
    const formattedActs = rawData.acts.map((item: any) => {
      if (item.act && item.section) {
        return `${item.section} (${item.act})`;
      }
      return item.section || item.act;
    }).join(', ');
    caseData.Undersection = formattedActs;
  }

  // 3. Process headings for court name
  if (Array.isArray(rawData.headings)) {
    for (const text of rawData.headings) {
      const lowerText = text.toLowerCase();
      if (lowerText.length > 5 && lowerText.length < 120) {
        const hasCourtKeywords = lowerText.includes('court') || 
                                 lowerText.includes('judge') || 
                                 lowerText.includes('sessions') || 
                                 lowerText.includes('establishment');
        const hasNoiseKeywords = lowerText.includes('case') || 
                                 lowerText.includes('history') || 
                                 lowerText.includes('status') || 
                                 lowerText.includes('advocate') || 
                                 lowerText.includes('petitioner') || 
                                 lowerText.includes('respondent') || 
                                 lowerText.includes('act') || 
                                 lowerText.includes('section') ||
                                 lowerText.includes('details') ||
                                 lowerText.includes('transfer') ||
                                 lowerText.includes('qr code');
        if (hasCourtKeywords && !hasNoiseKeywords) {
          caseData.court_name = text;
          break;
        }
      }
    }
  }

  // 4. Construct Case Title
  if (caseData.FirstParty && caseData.OppositeParty) {
    caseData.CaseTitle = `${caseData.FirstParty} vs. ${caseData.OppositeParty}`;
  } else if (caseData.FirstParty) {
    caseData.CaseTitle = caseData.FirstParty;
  }

  // 5. Fallback for crime_year if not explicitly set
  if (!caseData.crime_year) {
    if (caseData.case_number && caseData.case_number.includes('/')) {
      const parts = caseData.case_number.split('/');
      const yearPart = parts[parts.length - 1].trim();
      if (yearPart.match(/^\d{4}$/)) {
        caseData.crime_year = yearPart;
      }
    } else if (caseData.dateFiled) {
      const match = caseData.dateFiled.match(/^(\d{4})/);
      if (match) {
        caseData.crime_year = match[1];
      }
    }
  }

  return caseData;
}

export function convertIndianDateToLocal(dateStr: string): string | null {
  if (!dateStr) return null;
  const cleaned = dateStr.trim();
  
  // 1. Match DD-MM-YYYY or DD/MM/YYYY
  const matchNumeric = cleaned.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (matchNumeric) {
    const [_, day, month, year] = matchNumeric;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // 2. Match word-based dates like "16th June 2026" or "18th December 2014"
  const matchWord = cleaned.match(/(\d{1,2})(?:st|nd|rd|th)?\s+([a-zA-Z]+)\s+(\d{4})/i);
  if (matchWord) {
    const [_, day, monthName, year] = matchWord;
    const months: { [key: string]: string } = {
      january: '01', jan: '01',
      february: '02', feb: '02',
      march: '03', mar: '03',
      april: '04', apr: '04',
      may: '05',
      june: '06', jun: '06',
      july: '07', jul: '07',
      august: '08', aug: '08',
      september: '09', sep: '09', sept: '09',
      october: '10', oct: '10',
      november: '11', nov: '11',
      december: '12', dec: '12'
    };
    const monthVal = months[monthName.toLowerCase()];
    if (monthVal) {
      return `${year}-${monthVal}-${day.padStart(2, '0')}`;
    }
  }
  return null;
}
