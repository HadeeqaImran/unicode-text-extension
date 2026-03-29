import type { SelectionCapabilities } from "./types";

type TextControl = HTMLInputElement | HTMLTextAreaElement;

export type SelectionSnapshot =
  | {
      kind: "none";
      text: "";
      rect: DOMRect | null;
    }
  | {
      kind: "text-control";
      element: TextControl;
      text: string;
      start: number;
      end: number;
      rect: DOMRect;
    }
  | {
      kind: "contenteditable";
      root: HTMLElement;
      text: string;
      range: Range;
      rect: DOMRect;
    }
  | {
      kind: "page";
      text: string;
      range: Range;
      rect: DOMRect;
    };

export type CaretSnapshot =
  | {
      kind: "text-control";
      element: TextControl;
      start: number;
      end: number;
    }
  | {
      kind: "contenteditable";
      root: HTMLElement;
      range: Range;
    };

export interface MutationResult {
  ok: boolean;
  message?: string;
}

const TEXT_INPUT_TYPES = new Set([
  "text",
  "search",
  "url",
  "tel",
  "password",
  "email",
  "number"
]);

function isTextControl(element: Element | null): element is TextControl {
  if (!element) {
    return false;
  }

  if (element instanceof HTMLTextAreaElement) {
    return true;
  }

  return element instanceof HTMLInputElement && TEXT_INPUT_TYPES.has(element.type);
}

function dispatchValueEvents(element: TextControl | HTMLElement): void {
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

function findEditableRoot(node: Node | null): HTMLElement | null {
  if (!node) {
    return null;
  }

  const base = node instanceof HTMLElement ? node : node.parentElement;
  return base?.closest('[contenteditable=""], [contenteditable="true"], [contenteditable="plaintext-only"]') ?? null;
}

function cloneRange(range: Range): Range {
  return range.cloneRange();
}

function getRangeRect(range: Range): DOMRect {
  const rect = range.getBoundingClientRect();
  if (rect.width || rect.height) {
    return rect;
  }

  const clientRect = range.getClientRects()[0];
  if (clientRect) {
    return clientRect;
  }

  return new DOMRect(window.innerWidth / 2, window.innerHeight / 2, 0, 0);
}

export function getSelectionRect(snapshot: SelectionSnapshot): DOMRect | null {
  return snapshot.rect ?? null;
}

export function captureSelectionSnapshot(doc: Document = document): SelectionSnapshot {
  const activeElement = doc.activeElement;

  if (isTextControl(activeElement)) {
    const start = activeElement.selectionStart ?? 0;
    const end = activeElement.selectionEnd ?? 0;
    if (end > start) {
      return {
        kind: "text-control",
        element: activeElement,
        text: activeElement.value.slice(start, end),
        start,
        end,
        rect: activeElement.getBoundingClientRect()
      };
    }
  }

  const selection = doc.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return { kind: "none", text: "", rect: null };
  }

  const range = selection.getRangeAt(0);
  const text = selection.toString();
  if (!text) {
    return { kind: "none", text: "", rect: null };
  }

  const rect = getRangeRect(range);
  const editableRoot = findEditableRoot(range.commonAncestorContainer);
  if (editableRoot) {
    return {
      kind: "contenteditable",
      root: editableRoot,
      text,
      range: cloneRange(range),
      rect
    };
  }

  return {
    kind: "page",
    text,
    range: cloneRange(range),
    rect
  };
}

export function captureCaretSnapshot(doc: Document = document): CaretSnapshot | null {
  const activeElement = doc.activeElement;
  if (isTextControl(activeElement)) {
    return {
      kind: "text-control",
      element: activeElement,
      start: activeElement.selectionStart ?? activeElement.value.length,
      end: activeElement.selectionEnd ?? activeElement.value.length
    };
  }

  const selection = doc.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const editableRoot = findEditableRoot(range.commonAncestorContainer);
  if (!editableRoot) {
    return null;
  }

  const caretRange = cloneRange(range);
  caretRange.collapse(false);
  return {
    kind: "contenteditable",
    root: editableRoot,
    range: caretRange
  };
}

export function describeSelectionCapabilities(
  selectionSnapshot: SelectionSnapshot,
  caretSnapshot: CaretSnapshot | null
): SelectionCapabilities {
  if (selectionSnapshot.kind === "none") {
    return {
      selectionType: "none",
      sourceText: "",
      canReplace: false,
      canInsert: caretSnapshot !== null,
      canCopy: false,
      message: caretSnapshot ? "No text is selected. You can still quick-insert at the saved caret." : "Select text or place the cursor in an editable field."
    };
  }

  if (selectionSnapshot.kind === "page") {
    return {
      selectionType: "page",
      sourceText: selectionSnapshot.text,
      canReplace: false,
      canInsert: caretSnapshot !== null,
      canCopy: true,
      message:
        caretSnapshot !== null
          ? "Page text is read-only, so replace is disabled. You can still insert at the saved caret or copy the result."
          : "Page text is read-only, so copy is the safe fallback."
    };
  }

  if (selectionSnapshot.kind === "contenteditable") {
    return {
      selectionType: "contenteditable",
      sourceText: selectionSnapshot.text,
      canReplace: true,
      canInsert: caretSnapshot !== null,
      canCopy: true
    };
  }

  return {
    selectionType: "text-control",
    sourceText: selectionSnapshot.text,
    canReplace: true,
    canInsert: caretSnapshot !== null,
    canCopy: true
  };
}

export function replaceSelection(snapshot: SelectionSnapshot, replacement: string): MutationResult {
  if (snapshot.kind === "none") {
    return { ok: false, message: "There is no editable selection to replace." };
  }

  if (snapshot.kind === "page") {
    return { ok: false, message: "This page selection is not editable. Copy the converted text instead." };
  }

  if (snapshot.kind === "text-control") {
    if (!snapshot.element.isConnected) {
      return { ok: false, message: "The original input is no longer available." };
    }

    snapshot.element.focus({ preventScroll: true });
    snapshot.element.setRangeText(replacement, snapshot.start, snapshot.end, "end");
    dispatchValueEvents(snapshot.element);
    return { ok: true };
  }

  if (!snapshot.root.isConnected) {
    return { ok: false, message: "The editable region is no longer available." };
  }

  const selection = document.getSelection();
  if (!selection) {
    return { ok: false, message: "Unable to access the current selection." };
  }

  snapshot.root.focus({ preventScroll: true });
  selection.removeAllRanges();
  selection.addRange(cloneRange(snapshot.range));
  const activeRange = selection.getRangeAt(0);
  activeRange.deleteContents();
  const textNode = document.createTextNode(replacement);
  activeRange.insertNode(textNode);
  const caretRange = document.createRange();
  caretRange.setStartAfter(textNode);
  caretRange.collapse(true);
  selection.removeAllRanges();
  selection.addRange(caretRange);
  dispatchValueEvents(snapshot.root);
  return { ok: true };
}

export function insertAtCaret(caretSnapshot: CaretSnapshot | null, text: string): MutationResult {
  if (!caretSnapshot) {
    return { ok: false, message: "No editable caret is available for insertion." };
  }

  if (caretSnapshot.kind === "text-control") {
    if (!caretSnapshot.element.isConnected) {
      return { ok: false, message: "The original input is no longer available." };
    }

    caretSnapshot.element.focus({ preventScroll: true });
    caretSnapshot.element.setRangeText(text, caretSnapshot.start, caretSnapshot.end, "end");
    dispatchValueEvents(caretSnapshot.element);
    return { ok: true };
  }

  if (!caretSnapshot.root.isConnected) {
    return { ok: false, message: "The editable region is no longer available." };
  }

  const selection = document.getSelection();
  if (!selection) {
    return { ok: false, message: "Unable to access the current selection." };
  }

  caretSnapshot.root.focus({ preventScroll: true });
  const range = cloneRange(caretSnapshot.range);
  selection.removeAllRanges();
  selection.addRange(range);
  range.deleteContents();
  const textNode = document.createTextNode(text);
  range.insertNode(textNode);
  const caretRange = document.createRange();
  caretRange.setStartAfter(textNode);
  caretRange.collapse(true);
  selection.removeAllRanges();
  selection.addRange(caretRange);
  dispatchValueEvents(caretSnapshot.root);
  return { ok: true };
}
