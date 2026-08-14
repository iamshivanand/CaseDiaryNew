// utils/__tests__/legalAutocompleteService.test.ts
import {
  LegalAutocompleteService,
  DEFAULT_LEGAL_PHRASES,
} from "../legalAutocompleteService";

describe("legalAutocompleteService", () => {
  let service: LegalAutocompleteService;

  beforeEach(() => {
    service = new LegalAutocompleteService(DEFAULT_LEGAL_PHRASES);
  });

  it("should return empty array if input query is too short", () => {
    expect(service.getSuggestions("a")).toEqual([]);
    expect(service.getSuggestions("")).toEqual([]);
  });

  it("should return suggestions for matching legal phrase prefixes", () => {
    const suggestions = service.getSuggestions("IN THE HIGH");
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0]).toContain("IN THE HIGH COURT OF");
  });

  it("should handle partial word matches", () => {
    const suggestions = service.getSuggestions("PRAYED");
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0]).toContain("IT IS THEREFORE PRAYED");
  });
});
