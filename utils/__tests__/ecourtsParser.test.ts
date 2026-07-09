import { ecourtsParserJS, convertIndianDateToLocal, parseRawECourtsData, parseECourtsTxtFile, checkDuplicateCases } from '../ecourtsParser';
import { fuzzyMapCaseKeys, checkDuplicateAndDiffCases } from '../caseMapper';

describe('ecourtsParser utils', () => {
  describe('convertIndianDateToLocal', () => {
    it('should convert DD-MM-YYYY format to YYYY-MM-DD', () => {
      expect(convertIndianDateToLocal('15-06-2026')).toBe('2026-06-15');
      expect(convertIndianDateToLocal('05-09-2025')).toBe('2025-09-05');
    });

    it('should convert DD/MM/YYYY format to YYYY-MM-DD', () => {
      expect(convertIndianDateToLocal('25/12/2026')).toBe('2026-12-25');
      expect(convertIndianDateToLocal('01/01/2024')).toBe('2024-01-01');
    });

    it('should handle single digit days and months by padding with zero', () => {
      expect(convertIndianDateToLocal('5-2-2026')).toBe('2026-02-05');
      expect(convertIndianDateToLocal('9/7/2025')).toBe('2025-07-09');
    });

    it('should return null for invalid formats', () => {
      expect(convertIndianDateToLocal('2026-06-15')).toBeNull();
      expect(convertIndianDateToLocal('June 15, 2026')).toBeNull();
      expect(convertIndianDateToLocal('15-June-2026')).toBeNull();
    });

    it('should return null for empty/falsy inputs', () => {
      expect(convertIndianDateToLocal('')).toBeNull();
      expect(convertIndianDateToLocal(null as any)).toBeNull();
      expect(convertIndianDateToLocal(undefined as any)).toBeNull();
    });
  });

  describe('ecourtsParserJS extraction script & parseRawECourtsData mapping', () => {
    let mockPostMessage: jest.Mock;
    let mockTables: any[];
    let mockHeadings: any[];

    // Helper to create a mock row object
    const createMockRow = (label: string, value: string) => {
      const mockCells = [
        { innerText: label, textContent: label },
        { innerText: value, textContent: value }
      ];
      return {
        querySelectorAll: (query: string) => {
          if (query === 'td, th') {
            return mockCells;
          }
          return [];
        }
      };
    };

    // Helper to create a mock table object
    const createMockTable = (rowsData: { label: string; value: string }[]) => {
      const mockRows = rowsData.map(d => createMockRow(d.label, d.value));
      return {
        querySelectorAll: (query: string) => {
          if (query === 'tr') {
            return mockRows;
          }
          return [];
        }
      };
    };

    beforeEach(() => {
      mockPostMessage = jest.fn();
      mockTables = [];
      mockHeadings = [];

      // Mock the global window and document objects
      (global as any).window = {
        ReactNativeWebView: {
          postMessage: mockPostMessage,
        }
      };

      (global as any).document = {
        querySelectorAll: (query: string) => {
          if (query === 'table') {
            return mockTables;
          }
          if (query.includes('h1') || query.includes('.court_name')) {
            return mockHeadings;
          }
          return [];
        }
      };
    });

    afterEach(() => {
      delete (global as any).window;
      delete (global as any).document;
    });

    it('should do nothing if no tables exist in the DOM', () => {
      eval(ecourtsParserJS);
      expect(mockPostMessage).not.toHaveBeenCalled();
    });

    it('should successfully parse case details from standard eCourts tables', () => {
      mockTables.push(createMockTable([
        { label: 'Case Type', value: 'Criminal Appeal' },
        { label: 'Filing Number', value: '12345/2026' },
        { label: 'CNR Number', value: 'DLDH010001232026' },
        { label: 'Case Number', value: 'CRA/100/2026' },
        { label: 'Next Hearing Date', value: '15-06-2026' },
        { label: 'Petitioner / Plaintiff', value: 'John Doe' },
        { label: 'Respondent / Defendant', value: 'Jane Smith' },
        { label: 'Filing Date', value: '01-01-2026' },
        { label: 'Presiding Officer', value: 'Justice S. K. Kaul' },
        { label: 'Under Section', value: 'Section 302 IPC' },
      ]));

      mockHeadings.push({ innerText: 'High Court of Delhi', textContent: 'High Court of Delhi' });

      eval(ecourtsParserJS);

      expect(mockPostMessage).toHaveBeenCalledTimes(1);
      const payload = JSON.parse(mockPostMessage.mock.calls[0][0]);
      expect(payload.status).toBe('success');

      // Call the dynamic mapper
      const parsedData = parseRawECourtsData(payload.data);
      expect(parsedData).toEqual({
        case_type_name: 'Criminal Appeal',
        filingNumber: '12345/2026',
        CNRNumber: 'DLDH010001232026',
        case_number: 'CRA/100/2026',
        NextDate: '15-06-2026',
        FirstParty: 'John Doe',
        OppositeParty: 'Jane Smith',
        dateFiled: '01-01-2026',
        JudgeName: 'Justice S. K. Kaul',
        Undersection: 'Section 302 IPC',
        court_name: 'High Court of Delhi',
        CaseTitle: 'John Doe vs. Jane Smith',
        crime_year: '2026',
        rawTables: expect.any(Array),
      });
    });

    it('should handle missing fields gracefully', () => {
      mockTables.push(createMockTable([
        { label: 'CNR Number', value: 'MHCB010098762025' },
        { label: 'Petitioner', value: 'Only Petitioner' },
      ]));

      eval(ecourtsParserJS);

      expect(mockPostMessage).toHaveBeenCalledTimes(1);
      const payload = JSON.parse(mockPostMessage.mock.calls[0][0]);
      expect(payload.status).toBe('success');

      const parsedData = parseRawECourtsData(payload.data);
      expect(parsedData).toEqual({
        CNRNumber: 'MHCB010098762025',
        FirstParty: 'Only Petitioner',
        CaseTitle: 'Only Petitioner',
        rawTables: expect.any(Array),
      });
    });

    it('should parse CNR Number removing inner whitespace and extracting 16-character code', () => {
      mockTables.push(createMockTable([
        { label: 'CNR Number', value: '   UPBR 01003153 2014 (Note the CNR number for future reference)   ' },
      ]));

      eval(ecourtsParserJS);

      expect(mockPostMessage).toHaveBeenCalledTimes(1);
      const payload = JSON.parse(mockPostMessage.mock.calls[0][0]);
      expect(payload.status).toBe('success');

      const parsedData = parseRawECourtsData(payload.data);
      expect(parsedData.CNRNumber).toBe('UPBR010031532014');
    });

    it('should extract details from multi-column rows', () => {
      const createMockRowWithCells = (cellValues: string[]) => {
        const mockCells = cellValues.map(val => ({ innerText: val, textContent: val }));
        return {
          querySelectorAll: (query: string) => {
            if (query === 'td, th') return mockCells;
            return [];
          }
        };
      };
      
      const mockRows = [
        createMockRowWithCells(['Case Type', 'Sessions Trial']),
        createMockRowWithCells(['Filing Number', '', 'Filing Date', '15-04-2014']),
        createMockRowWithCells(['Registration Number', '100355/2014', 'Registration Date', '26-04-2014']),
      ];
      
      mockTables.push({
        querySelectorAll: (query: string) => {
          if (query === 'tr') return mockRows;
          return [];
        }
      });

      eval(ecourtsParserJS);

      expect(mockPostMessage).toHaveBeenCalledTimes(1);
      const payload = JSON.parse(mockPostMessage.mock.calls[0][0]);
      expect(payload.status).toBe('success');

      const parsedData = parseRawECourtsData(payload.data);
      expect(parsedData.case_type_name).toBe('Sessions Trial');
      expect(parsedData.dateFiled).toBe('15-04-2014');
      expect(parsedData.case_number).toBe('100355/2014');
    });

    it('should parse Acts and Sections from tabular Acts tables', () => {
      const createMockRowWithCells = (cellValues: string[]) => {
        const mockCells = cellValues.map(val => ({ innerText: val, textContent: val }));
        return {
          querySelectorAll: (query: string) => {
            if (query === 'td, th') return mockCells;
            return [];
          }
        };
      };

      const mockRows = [
        createMockRowWithCells(['Under Act(s)', 'Under Section(s)']),
        createMockRowWithCells(['Criminal Law Amendment Act', '308ipc']),
      ];

      mockTables.push({
        querySelectorAll: (query: string) => {
          if (query === 'tr') return mockRows;
          return [];
        }
      });

      eval(ecourtsParserJS);

      expect(mockPostMessage).toHaveBeenCalledTimes(1);
      const payload = JSON.parse(mockPostMessage.mock.calls[0][0]);
      expect(payload.status).toBe('success');

      const parsedData = parseRawECourtsData(payload.data);
      expect(parsedData.Undersection).toBe('308ipc (Criminal Law Amendment Act)');
    });

    it('should clean petitioner and respondent names (removing advocate details and numbering) from vertical tables', () => {
      const createMockRowWithCells = (cellValues: string[]) => {
        const mockCells = cellValues.map(val => ({ innerText: val, textContent: val }));
        return {
          querySelectorAll: (query: string) => {
            if (query === 'td, th') return mockCells;
            return [];
          }
        };
      };

      const mockRows = [
        createMockRowWithCells(['Petitioner and Advocate']),
        createMockRowWithCells(['1) state of up\n   Advocate- ADGC-7']),
        createMockRowWithCells(['Respondent and Advocate']),
        createMockRowWithCells(['1) Gopendra pal\n   Advocate - Anuj Kumar Gangwar'])
      ];

      mockTables.push({
        querySelectorAll: (query: string) => {
          if (query === 'tr') return mockRows;
          return [];
        }
      });

      eval(ecourtsParserJS);

      expect(mockPostMessage).toHaveBeenCalledTimes(1);
      const payload = JSON.parse(mockPostMessage.mock.calls[0][0]);
      expect(payload.status).toBe('success');

      const parsedData = parseRawECourtsData(payload.data);
      expect(parsedData.FirstParty).toBe('state of up');
      expect(parsedData.OppositeParty).toBe('Gopendra pal');
      expect(parsedData.CaseTitle).toBe('state of up vs. Gopendra pal');
    });

    it('should extract Next Hearing Date and skip First Hearing Date', () => {
      mockTables.push(createMockTable([
        { label: 'First Hearing Date', value: '18th December 2014' },
        { label: 'Next Hearing Date', value: '16th June 2026' }
      ]));

      eval(ecourtsParserJS);

      expect(mockPostMessage).toHaveBeenCalledTimes(1);
      const payload = JSON.parse(mockPostMessage.mock.calls[0][0]);
      expect(payload.status).toBe('success');

      const parsedData = parseRawECourtsData(payload.data);
      expect(parsedData.NextDate).toBe('16th June 2026');
    });

    it('should parse court name from headings with various keywords', () => {
      mockTables.push(createMockTable([
        { label: 'CNR Number', value: 'UPBR010031532014' }
      ]));

      mockHeadings.push({ innerText: 'District and Session Judge', textContent: 'District and Session Judge' });

      eval(ecourtsParserJS);

      expect(mockPostMessage).toHaveBeenCalledTimes(1);
      const payload = JSON.parse(mockPostMessage.mock.calls[0][0]);
      expect(payload.status).toBe('success');

      const parsedData = parseRawECourtsData(payload.data);
      expect(parsedData.court_name).toBe('District and Session Judge');
    });

    it('should handle errors during evaluation gracefully', () => {
      (global as any).document.querySelectorAll = () => {
        throw new Error('Query error');
      };

      eval(ecourtsParserJS);

      expect(mockPostMessage).toHaveBeenCalledTimes(1);
      const payload = JSON.parse(mockPostMessage.mock.calls[0][0]);
      expect(payload.status).toBe('error');
      expect(payload.message).toContain('Query error');
    });
  });

  describe('parseECourtsTxtFile', () => {
    it('should parse legacy character-delimited records correctly', () => {
      const text = 'UPBR010031532014 | State vs Gopendra | 15-07-2026 | XIII th ADJ';
      const cases = parseECourtsTxtFile(text);
      expect(cases.length).toBe(1);
      expect(cases[0].CNRNumber).toBe('UPBR010031532014');
      expect(cases[0].CaseTitle).toBe('State vs Gopendra');
      expect(cases[0].NextDate).toBe('2026-07-15');
      expect(cases[0].court_name).toBe('XIII th ADJ');
    });

    it('should parse official eCourts JSON array backup files correctly', () => {
      const caseObj = {
        cino: 'UPBR010031532014',
        type_name: 'Sessions Trial',
        case_no: '203601003552014',
        reg_year: 2014,
        reg_no: 100355,
        petparty_name: 'state of up',
        resparty_name: 'Gopendra pal',
        establishment_name: 'District and Sessions Judge',
        date_next_list: '2026-07-15',
        date_last_list: '2026-07-01',
        court_no_desg_name: 'XIII th ADJ',
        note: 'Vakalatnama submitted'
      };
      const rawText = JSON.stringify([JSON.stringify(caseObj)]);
      const cases = parseECourtsTxtFile(rawText);
      expect(cases.length).toBe(1);
      expect(cases[0].CNRNumber).toBe('UPBR010031532014');
      expect(cases[0].CaseTitle).toBe('state of up vs. Gopendra pal');
      expect(cases[0].case_number).toBe('100355/2014');
      expect(cases[0].court_name).toBe('XIII th ADJ, District and Sessions Judge');
      expect(cases[0].case_type_name).toBe('Sessions Trial');
      expect(cases[0].case_year).toBe('2014');
      expect(cases[0].NextDate).toBe('2026-07-15');
      expect(cases[0].PreviousDate).toBe('2026-07-01');
      expect(cases[0].CaseNotes).toBe('Vakalatnama submitted');
      expect(cases[0].Accussed).toBe('Gopendra pal');
      expect(cases[0].CaseStatus).toBe('Active');
    });
  });

  describe('checkDuplicateCases', () => {
    const existing = [
      { CNRNumber: 'UPBR010031532014', case_number: '100355/2014', court_name: 'XIII th ADJ' },
      { CNRNumber: null, case_number: '55/2020', court_name: 'District Court' }
    ];

    it('should identify duplicate by matching CNRNumber', () => {
      const parsed = [
        { CaseTitle: 'Test case 1', ClientName: 'A', FirstParty: 'A', OppositeParty: 'B', CNRNumber: 'upbr-0100-3153-2014' }
      ];
      const result = checkDuplicateCases(parsed, existing);
      expect(result[0].alreadyExists).toBe(true);
    });

    it('should identify duplicate by matching case_number and court_name', () => {
      const parsed = [
        { CaseTitle: 'Test case 2', ClientName: 'A', FirstParty: 'A', OppositeParty: 'B', case_number: '55 / 2020', court_name: 'District  Court' }
      ];
      const result = checkDuplicateCases(parsed, existing);
      expect(result[0].alreadyExists).toBe(true);
    });

    it('should not identify as duplicate if CNR is empty or NA', () => {
      const parsed = [
        { CaseTitle: 'Test case 3', ClientName: 'A', FirstParty: 'A', OppositeParty: 'B', CNRNumber: 'N/A' },
        { CaseTitle: 'Test case 4', ClientName: 'A', FirstParty: 'A', OppositeParty: 'B', CNRNumber: '' }
      ];
      const result = checkDuplicateCases(parsed, existing);
      expect(result[0].alreadyExists).toBe(false);
      expect(result[1].alreadyExists).toBe(false);
    });

    it('should not identify as duplicate if only case_number matches but court_name differs', () => {
      const parsed = [
        { CaseTitle: 'Test case 5', ClientName: 'A', FirstParty: 'A', OppositeParty: 'B', case_number: '55/2020', court_name: 'High Court' }
      ];
      const result = checkDuplicateCases(parsed, existing);
      expect(result[0].alreadyExists).toBe(false);
    });
  });

  describe('fuzzyMapCaseKeys', () => {
    it('should fuzzy match case properties and normalize fields', () => {
      const raw = {
        CINO: 'UPBR010031532014',
        type_name: 'Sessions Trial',
        district_name: 'Bareilly',
        state_name: 'Uttar Pradesh',
        "police-station": 'Baradari',
        "under-section": '302 IPC',
        date_next_list: '15-07-2026',
        "judge-name": 'XIII th ADJ',
        note: 'Some notes here'
      };

      const mapped = fuzzyMapCaseKeys(raw);
      expect(mapped.CNRNumber).toBe('UPBR010031532014');
      expect(mapped.case_type_name).toBe('Sessions Trial');
      expect(mapped.district).toBe('Bareilly');
      expect(mapped.state).toBe('Uttar Pradesh');
      expect(mapped.policeStationName).toBe('Baradari');
      expect(mapped.Undersection).toBe('302 IPC');
      expect(mapped.NextDate).toBe('2026-07-15');
      expect(mapped.JudgeName).toBe('XIII th ADJ');
      expect(mapped.CaseNotes).toBe('Some notes here');
    });
  });

  describe('checkDuplicateAndDiffCases', () => {
    const existing = [
      { id: 1, CNRNumber: 'UPBR010031532014', case_number: '100355/2014', court_name: 'XIII th ADJ', NextDate: '2026-07-15', CaseNotes: 'old note', ClientName: 'Client' }
    ];

    it('should detect updates when database fields differ from parsed case', () => {
      const parsed = [
        { CaseTitle: 'Test', ClientName: 'Client', FirstParty: 'Client', OppositeParty: 'Opposite', CNRNumber: 'UPBR010031532014', NextDate: '2026-07-20', CaseNotes: 'new note' }
      ];

      const result = checkDuplicateAndDiffCases(parsed, existing);
      expect(result[0].alreadyExists).toBe(true);
      expect(result[0].hasUpdates).toBe(true);
      expect(result[0].dbCaseId).toBe(1);
      expect(result[0].changes).toBeDefined();
      expect(result[0].changes?.NextDate).toEqual({ oldValue: '2026-07-15', newValue: '2026-07-20' });
      expect(result[0].changes?.CaseNotes).toEqual({ oldValue: 'old note', newValue: 'new note' });
    });

    it('should not detect updates if parsed case fields are identical to database', () => {
      const parsed = [
        { CaseTitle: 'Test', ClientName: 'Client', FirstParty: 'Client', OppositeParty: 'Opposite', CNRNumber: 'UPBR010031532014', NextDate: '2026-07-15', CaseNotes: 'old note' }
      ];

      const result = checkDuplicateAndDiffCases(parsed, existing);
      expect(result[0].alreadyExists).toBe(true);
      expect(result[0].hasUpdates).toBe(false);
      expect(result[0].changes).toBeUndefined();
    });
  });
});
