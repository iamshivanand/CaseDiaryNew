import {
  applyLegalVocabularyCorrection,
  speechRecognitionService,
} from "../speechRecognitionService";

jest.mock("expo-speech-recognition", () => ({
  ExpoSpeechRecognitionModule: {
    requestPermissionsAsync: jest
      .fn()
      .mockResolvedValue({ status: "granted", granted: true }),
    getStateAsync: jest.fn().mockResolvedValue("inactive"),
    start: jest.fn(),
    stop: jest.fn(),
    abort: jest.fn(),
    addListener: jest.fn(() => ({ remove: jest.fn() })),
  },
  useSpeechRecognitionEvent: jest.fn(),
}));

describe("speechRecognitionService", () => {
  describe("applyLegalVocabularyCorrection", () => {
    it("should correct common phonetic misspellings into standard legal terms", () => {
      expect(applyLegalVocabularyCorrection("file the affedavit")).toBe(
        "file the Affidavit"
      );
      expect(applyLegalVocabularyCorrection("submit wakalatnama")).toBe(
        "submit Vakalatnama"
      );
      expect(applyLegalVocabularyCorrection("section 420 ip c")).toBe(
        "section 420 IPC"
      );
    });
  });

  describe("speechRecognitionService instance", () => {
    it("should handle start and stop listening cleanly in mock environment", async () => {
      const onStart = jest.fn();
      const onResult = jest.fn();
      const onError = jest.fn();

      const success = await speechRecognitionService.startListening("en-IN", {
        onStart,
        onResult,
        onError,
      });

      expect(success).toBe(true);
      expect(onStart).toHaveBeenCalled();

      await speechRecognitionService.stopListening();
      expect(speechRecognitionService.getIsListening()).toBe(false);
    });
  });
});
