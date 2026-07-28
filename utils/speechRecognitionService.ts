// utils/speechRecognitionService.ts
import { LEGAL_VOCABULARY } from "./legalVocabulary";

export interface SpeechRecognitionCallbacks {
  onStart?: () => void;
  onResult?: (text: string) => void;
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
  private voiceModule: any = null;

  constructor() {
    try {
      // Dynamic require for @react-native-voice/voice if installed natively
      const Voice = require("@react-native-voice/voice").default;
      if (Voice) {
        this.voiceModule = Voice;
      }
    } catch (e) {
      // Running in Expo Go / web / test environment
      this.voiceModule = null;
    }
  }

  /**
   * Start native Android SpeechRecognizer offline dictation session
   */
  public async startListening(
    locale: string = "en-IN",
    callbacks: SpeechRecognitionCallbacks
  ): Promise<boolean> {
    if (this.isListening) {
      await this.stopListening();
    }

    this.isListening = true;

    if (this.voiceModule) {
      try {
        this.voiceModule.onSpeechStart = () => callbacks.onStart?.();
        this.voiceModule.onSpeechError = (e: any) => {
          this.isListening = false;
          callbacks.onError?.(e?.error?.message || "Speech recognition error");
        };
        this.voiceModule.onSpeechEnd = () => {
          this.isListening = false;
          callbacks.onEnd?.();
        };
        this.voiceModule.onSpeechResults = (e: any) => {
          if (e.value && e.value.length > 0) {
            const rawResult = e.value[0];
            const corrected = applyLegalVocabularyCorrection(rawResult);
            callbacks.onResult?.(corrected);
          }
        };

        // Enforce offline language recognition on Android
        await this.voiceModule.start(locale, {
          EXTRA_PREFER_OFFLINE: true,
        });
        return true;
      } catch (err) {
        this.isListening = false;
        callbacks.onError?.("Failed to launch SpeechRecognizer");
        return false;
      }
    } else {
      // Fallback / Mock environment for non-native test runs
      callbacks.onStart?.();
      return true;
    }
  }

  /**
   * Stop speech dictation session
   */
  public async stopListening(): Promise<void> {
    this.isListening = false;
    if (this.voiceModule) {
      try {
        await this.voiceModule.stop();
      } catch (e) {
        console.warn("Error stopping voice module:", e);
      }
    }
  }

  /**
   * Destroy and clean up listeners
   */
  public destroy(): void {
    this.isListening = false;
    if (this.voiceModule) {
      try {
        this.voiceModule.destroy().then(this.voiceModule.removeAllListeners);
      } catch (e) {
        // ignore
      }
    }
  }

  public getIsListening(): boolean {
    return this.isListening;
  }
}

export const speechRecognitionService = new SpeechRecognitionService();
