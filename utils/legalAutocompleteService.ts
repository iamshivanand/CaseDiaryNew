// utils/legalAutocompleteService.ts

export const DEFAULT_LEGAL_PHRASES: string[] = [
  "IN THE HIGH COURT OF JUDICATURE AT BOMBAY",
  "IN THE HIGH COURT OF JUDICATURE AT ALLAHABAD",
  "IN THE HIGH COURT OF DELHI AT NEW DELHI",
  "IN THE SUPREME COURT OF INDIA",
  "IN THE COURT OF THE DISTRICT & SESSIONS JUDGE AT",
  "BEFORE THE HON'BLE COURT OF THE PRINCIPAL JUDGE, FAMILY COURT",
  "MOST RESPECTFULLY SHEWETH:",
  "THAT THE PETITIONER IS A LAW-ABIDING CITIZEN OF INDIA.",
  "THAT THE PRESENT PETITION IS BEING FILED FOR THE GRANT OF BAIL.",
  "IT IS THEREFORE PRAYED THAT THIS HON'BLE COURT MAY BE PLEASED TO",
  "GRANT BAIL TO THE APPLICANT / ACCUSED ON REASONABLE TERMS AND CONDITIONS.",
  "PASS SUCH OTHER ORDER OR ORDERS AS THIS HON'BLE COURT MAY DEEM FIT AND PROPER.",
  "AND FOR THIS ACT OF KINDNESS, THE PETITIONER AS IN DUTY BOUND SHALL EVER PRAY.",
  "AFFIDAVIT IN SUPPORT OF APPLICATION",
  "MEMORANDUM OF VAKALATNAMA AND APPEARANCE",
  "WRITTEN STATEMENT ON BEHALF OF THE DEFENDANT / RESPONDENT",
  "NOTICE UNDER SECTION 138 OF THE NEGOTIABLE INSTRUMENTS ACT, 1881",
  "APPLICATION UNDER SECTION 439 OF THE CODE OF CRIMINAL PROCEDURE, 1973",
  "PETITION UNDER ARTICLE 226 OF THE CONSTITUTION OF INDIA",
  "THE PETITIONER HAS NOT FILED ANY OTHER SIMILAR PETITION BEFORE THIS HON'BLE COURT OR SUPREME COURT OF INDIA.",
];

class TrieNode {
  children: Map<string, TrieNode> = new Map();
  isEndOfWord: boolean = false;
  phrase: string | null = null;
}

export class LegalAutocompleteService {
  private root: TrieNode = new TrieNode();

  constructor(customPhrases: string[] = DEFAULT_LEGAL_PHRASES) {
    customPhrases.forEach((phrase) => this.insert(phrase));
  }

  /**
   * Insert phrase into the autocomplete Trie engine
   */
  public insert(phrase: string): void {
    if (!phrase) return;

    let node = this.root;
    const clean = phrase.trim();
    const lower = clean.toLowerCase();

    for (let i = 0; i < lower.length; i++) {
      const char = lower[i];
      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode());
      }
      node = node.children.get(char)!;
    }
    node.isEndOfWord = true;
    node.phrase = clean;
  }

  /**
   * Get matching autocomplete suggestions for an input prefix
   */
  public getSuggestions(input: string, limit: number = 5): string[] {
    if (!input || input.trim().length < 2) return [];

    const lowerInput = input.trim().toLowerCase();
    let node = this.root;

    // Traverse to end of prefix
    for (let i = 0; i < lowerInput.length; i++) {
      const char = lowerInput[i];
      if (!node.children.has(char)) {
        return this.searchPartialWordMatches(lowerInput, limit);
      }
      node = node.children.get(char)!;
    }

    const results: string[] = [];
    this.collectAllPhrases(node, results, limit);

    if (results.length === 0) {
      return this.searchPartialWordMatches(lowerInput, limit);
    }

    return results;
  }

  private collectAllPhrases(
    node: TrieNode,
    results: string[],
    limit: number
  ): void {
    if (results.length >= limit) return;

    if (node.isEndOfWord && node.phrase) {
      results.push(node.phrase);
    }

    for (const child of node.children.values()) {
      this.collectAllPhrases(child, results, limit);
      if (results.length >= limit) break;
    }
  }

  private searchPartialWordMatches(query: string, limit: number): string[] {
    const results: string[] = [];
    for (const phrase of DEFAULT_LEGAL_PHRASES) {
      if (phrase.toLowerCase().includes(query)) {
        results.push(phrase);
        if (results.length >= limit) break;
      }
    }
    return results;
  }
}

export const legalAutocompleteService = new LegalAutocompleteService();
