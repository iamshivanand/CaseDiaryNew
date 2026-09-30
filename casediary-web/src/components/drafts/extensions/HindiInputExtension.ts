import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import {
  transliterateWord,
  REMINGTON_MAP,
  INSCRIPT_MAP,
  HindiTypingMode,
} from "./hindiTransliteration";

export const hindiPluginKey = new PluginKey("hindiInputPlugin");

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    hindiInput: {
      /**
       * Set the active Hindi typing mode ('phonetic' | 'remington' | 'inscript' | 'off')
       */
      setHindiMode: (mode: HindiTypingMode) => ReturnType;
      /**
       * Toggle Hindi typing on and off (Ctrl+M)
       */
      toggleHindiMode: () => ReturnType;
    };
  }
}

export interface HindiInputOptions {
  defaultMode: HindiTypingMode;
  onModeChange?: (mode: HindiTypingMode) => void;
}

export interface HindiInputStorage {
  mode: HindiTypingMode;
  lastActiveMode: HindiTypingMode;
  onModeChange?: (mode: HindiTypingMode) => void;
}

export const HindiInputExtension = Extension.create<HindiInputOptions, HindiInputStorage>({
  name: "hindiInput",

  addOptions() {
    return {
      defaultMode: "off",
      onModeChange: undefined,
    };
  },

  addStorage() {
    return {
      mode: this.options.defaultMode || "off",
      lastActiveMode: "phonetic",
      onModeChange: this.options.onModeChange,
    };
  },

  addCommands() {
    return {
      setHindiMode:
        (mode: HindiTypingMode) =>
        ({ editor }) => {
          this.storage.mode = mode;
          if (mode !== "off") {
            this.storage.lastActiveMode = mode;
          }
          if (this.storage.onModeChange) {
            this.storage.onModeChange(mode);
          }
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("casediary:hindi-mode-change", { detail: { mode } })
            );
          }
          return true;
        },

      toggleHindiMode:
        () =>
        ({ editor, commands }) => {
          const nextMode: HindiTypingMode =
            this.storage.mode === "off" ? this.storage.lastActiveMode || "phonetic" : "off";
          return commands.setHindiMode(nextMode);
        },
    };
  },

  addProseMirrorPlugins() {
    const extension = this;
    let compositionBuffer = "";
    let compositionStartPos: number | null = null;

    const resetComposition = () => {
      compositionBuffer = "";
      compositionStartPos = null;
    };

    return [
      new Plugin({
        key: hindiPluginKey,
        props: {
          handleTextInput(view, from, to, text) {
            const mode = extension.storage.mode;
            if (mode === "off") {
              resetComposition();
              return false;
            }

            // 1. Remington (Kruti Dev / High Court Typewriter) Mode
            if (mode === "remington") {
              resetComposition();
              const mapped = REMINGTON_MAP[text];
              if (mapped) {
                // Smart typewriter 'f' (ि) prefix logic:
                // If previous char in document was 'ि' (\u093F) and user types a consonant,
                // reorder them to proper Unicode order (consonant + \u093F)
                const prevChar = from > 0 ? view.state.doc.textBetween(from - 1, from) : "";
                if (prevChar === "\u093F") {
                  const tr = view.state.tr.replaceWith(
                    from - 1,
                    to,
                    view.state.schema.text(mapped + "\u093F")
                  );
                  view.dispatch(tr);
                  return true;
                }

                const tr = view.state.tr.replaceWith(from, to, view.state.schema.text(mapped));
                view.dispatch(tr);
                return true;
              }
              return false;
            }

            // 2. InScript Mode
            if (mode === "inscript") {
              resetComposition();
              const mapped = INSCRIPT_MAP[text];
              if (mapped) {
                const tr = view.state.tr.replaceWith(from, to, view.state.schema.text(mapped));
                view.dispatch(tr);
                return true;
              }
              return false;
            }

            // 3. Phonetic (हिंग्लिश / ध्वन्यात्मक) Mode
            if (mode === "phonetic") {
              // Letters a-z or A-Z: active composition stream
              if (/^[a-zA-Z]$/.test(text)) {
                if (compositionBuffer === "" || compositionStartPos === null) {
                  compositionStartPos = from;
                  compositionBuffer = text;
                } else {
                  compositionBuffer += text;
                }

                const hindiText = transliterateWord(compositionBuffer);
                const tr = view.state.tr.replaceWith(
                  compositionStartPos,
                  to,
                  view.state.schema.text(hindiText)
                );
                view.dispatch(tr);
                return true;
              }

              // Non-alphabetic character (Space, Punctuation, Number): commit active word
              if (compositionBuffer.length > 0) {
                resetComposition();
              }

              // Typing '|' in Hindi court documents turns into Devanagari danda '।'
              if (text === "|") {
                const tr = view.state.tr.replaceWith(from, to, view.state.schema.text("।"));
                view.dispatch(tr);
                return true;
              }

              return false;
            }

            return false;
          },

          handleKeyDown(view, event) {
            // Global Keyboard Shortcut: Ctrl+M or Cmd+M to toggle Hindi/English typing
            if ((event.ctrlKey || event.metaKey) && (event.key === "m" || event.key === "M")) {
              event.preventDefault();
              extension.editor.commands.toggleHindiMode();
              return true;
            }

            const mode = extension.storage.mode;
            if (mode !== "phonetic") {
              resetComposition();
              return false;
            }

            // In Phonetic mode, handle Backspace within active composition word
            if (event.key === "Backspace") {
              if (compositionBuffer.length > 1 && compositionStartPos !== null) {
                compositionBuffer = compositionBuffer.slice(0, -1);
                const hindiText = transliterateWord(compositionBuffer);
                const tr = view.state.tr.replaceWith(
                  compositionStartPos,
                  view.state.selection.to,
                  view.state.schema.text(hindiText)
                );
                view.dispatch(tr);
                event.preventDefault();
                return true;
              } else if (compositionBuffer.length === 1) {
                resetComposition();
                return false; // Let browser delete the remaining character normally
              }
            }

            // Word committing keys: Space, Enter, Tab, Escape
            if ([" ", "Enter", "Tab", "Escape"].includes(event.key)) {
              resetComposition();
              return false;
            }

            // Caret movement keys
            if (
              [
                "ArrowLeft",
                "ArrowRight",
                "ArrowUp",
                "ArrowDown",
                "Home",
                "End",
                "PageUp",
                "PageDown",
              ].includes(event.key)
            ) {
              resetComposition();
              return false;
            }

            return false;
          },

          handleClick() {
            resetComposition();
            return false;
          },
        },
      }),
    ];
  },
});

export default HindiInputExtension;
