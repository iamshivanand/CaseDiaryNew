// utils/speechRecognitionService.ts
import { LEGAL_VOCABULARY } from "./legalVocabulary";
import { ExpoSpeechRecognitionModule } from "expo-speech-recognition";

export interface SpeechRecognitionCallbacks {
  onStart?: () => void;
  onResult?: (text: string) => void;
  onFullResult?: (fullTranscript: string) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

/**
 * Common phonetic / STT misinterpretations mapped to standard legal terminology
 */
const LEGAL_PHONETIC_CORRECTIONS: Record<string, string> = {
  "affedavit": "Affidavit",
  "affidavid": "Affidavit",
  "effidavit": "Affidavit",
  "vacalatnama": "Vakalatnama",
  "wakalatnama": "Vakalatnama",
  "vakalat nama": "Vakalatnama",
  "suomoto": "Suo Moto",
  "suo moto": "Suo Moto",
  "ip c": "IPC",
  "i p c": "IPC",
  "cr pc": "CrPC",
  "c r p c": "CrPC",
  "c p c": "CPC",
  "n i act": "NI Act",
  "ni act": "NI Act",
  "highcourt": "High Court",
  "supremecourt": "Supreme Court",
  "bailapp": "Bail Application",
  "bail app": "Bail Application",
  "stay order": "Stay Order",
  "interim order": "Interim Order",
  "sheweth": "SHEWETH",
  "sheweth as under": "SHEWETH AS UNDER:",
  "prayed that": "PRAYED THAT",
};

/**
 * Applies legal domain vocabulary correction to raw speech recognition output
 */
export const applyLegalVocabularyCorrection = (rawText: string): string => {
  if (!rawText) return "";

  let cleaned = rawText.trim();

  // 1. Replace phonetic misspellings from dictionary
  Object.keys(LEGAL_PHONETIC_CORRECTIONS).forEach((key) => {
    const regex = new RegExp(`\\b${key}\\b`, "gi");
    cleaned = cleaned.replace(regex, LEGAL_PHONETIC_CORRECTIONS[key]);
  });

  // 2. Cross-reference with LEGAL_VOCABULARY entries for exact case matching
  LEGAL_VOCABULARY.forEach((entry) => {
    const term = entry.english;
    const regex = new RegExp(`\\b${term}\\b`, "gi");
    cleaned = cleaned.replace(regex, term);
  });

  return cleaned;
};

class SpeechRecognitionService {
  private isListening: boolean = false;
  private listeners: any[] = [];
  private lastProcessedTranscript: string = "";

  constructor() {}

  /**
   * Start native speech dictation session using ExpoSpeechRecognitionModule
   */
  public async startListening(
    locale: string = "en-IN",
    callbacks: SpeechRecognitionCallbacks
  ): Promise<boolean> {
    if (this.isListening) {
      await this.stopListening();
    }

    try {
      if (!ExpoSpeechRecognitionModule) {
        callbacks.onError?.("Speech recognition module unavailable");
        return false;
      }

      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) {
        callbacks.onError?.("Microphone permission required for voice dictation");
        return false;
      }

      // Clear existing listeners
      this.destroy();

      this.isListening = true;
      this.lastProcessedTranscript = "";
      callbacks.onStart?.();

      const moduleAny = ExpoSpeechRecognitionModule as any;
      const resultSub = moduleAny.addListener ? moduleAny.addListener("result", (event: any) => {
        if (event.results && event.results.length > 0) {
          const rawResult = (event.results[0]?.transcript || "").trim();
          if (rawResult) {
            const correctedFull = applyLegalVocabularyCorrection(rawResult);
            callbacks.onFullResult?.(correctedFull);

            let delta = "";
            if (this.lastProcessedTranscript && rawResult.toLowerCase().startsWith(this.lastProcessedTranscript.toLowerCase())) {
              delta = rawResult.slice(this.lastProcessedTranscript.length).trim();
            } else if (!this.lastProcessedTranscript) {
              delta = rawResult;
            }

            if (delta.length > 0) {
              const correctedDelta = applyLegalVocabularyCorrection(delta);
              callbacks.onResult?.(correctedDelta);
              this.lastProcessedTranscript = rawResult;
            }
          }
        }
      }) : null;

      const errorSub = moduleAny.addListener ? moduleAny.addListener("error", (event: any) => {
        this.isListening = false;
        callbacks.onError?.(event?.error || "Speech recognition error");
      }) : null;

      const endSub = moduleAny.addListener ? moduleAny.addListener("end", () => {
        this.isListening = false;
        callbacks.onEnd?.();
      }) : null;

      this.listeners.push(resultSub, errorSub, endSub);

      ExpoSpeechRecognitionModule.start({
        lang: locale,
        interimResults: true,
        maxAlternatives: 1,
        addsPunctuation: true,
      });

      return true;
    } catch (err: any) {
      this.isListening = false;
      callbacks.onError?.(err?.message || "Failed to start speech dictation");
      return false;
    }
  }

  /**
   * Stop speech dictation session
   */
  public async stopListening(): Promise<void> {
    this.isListening = false;
    try {
      if (ExpoSpeechRecognitionModule) {
        ExpoSpeechRecognitionModule.stop();
      }
    } catch (e) {
      console.warn("Error stopping speech recognition:", e);
    }
  }

  /**
   * Destroy and clean up listeners
   */
  public destroy(): void {
    this.isListening = false;
    this.listeners.forEach((sub) => {
      try {
        sub?.remove?.();
      } catch (e) {
        // ignore
      }
    });
    this.listeners = [];
  }

  public getIsListening(): boolean {
    return this.isListening;
  }
}

export const speechRecognitionService = new SpeechRecognitionService();
export default speechRecognitionService;
