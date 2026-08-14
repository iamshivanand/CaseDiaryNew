// utils/tiptapBundleEntry.js
import { Editor, Extension, Node, Mark } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';

export {
  Editor,
  Extension,
  Node,
  Mark,
  StarterKit,
  Table,
  TableRow,
  TableCell,
  TableHeader,
  Underline,
  Placeholder,
};

// Also attach to window.Tiptap for global execution in WebView
if (typeof window !== 'undefined') {
  window.Tiptap = {
    Editor,
    Extension,
    Node,
    Mark,
    StarterKit,
    Table,
    TableRow,
    TableCell,
    TableHeader,
    Underline,
    Placeholder,
  };
}
