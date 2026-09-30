import { Node, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    pageBreak: {
      /**
       * Insert a court page break
       */
      setPageBreak: () => ReturnType;
    };
  }
}

export const PageBreakExtension = Node.create({
  name: "pageBreak",

  group: "block",

  atom: true,

  selectable: true,

  draggable: false,

  parseHTML() {
    return [
      {
        tag: "div[data-page-break]",
      },
      {
        tag: "div.court-page-break",
      },
      {
        tag: "hr.court-page-break",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-page-break": "true",
        class: "court-page-break",
      }),
      [
        "div",
        { class: "court-page-break-inner no-print" },
        [
          "div",
          { class: "court-page-break-line" },
        ],
        [
          "div",
          { class: "court-page-break-badge" },
          [
            "span",
            { class: "court-page-break-icon" },
            "📄",
          ],
          [
            "span",
            { class: "court-page-break-text" },
            "PAGE BREAK • अगली शीट (Ctrl + Enter)",
          ],
        ],
        [
          "div",
          { class: "court-page-break-line" },
        ],
      ],
    ];
  },

  addCommands() {
    return {
      setPageBreak:
        () =>
        ({ chain, state }) => {
          const { selection } = state;
          const { $from } = selection;

          // Insert the pageBreak node followed by an empty paragraph so the user can immediately continue typing on the new sheet
          return chain()
            .insertContentAt($from.pos, [
              { type: this.name },
              { type: "paragraph" },
            ])
            .focus()
            .run();
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Enter": () => this.editor.commands.setPageBreak(),
    };
  },
});

export default PageBreakExtension;
