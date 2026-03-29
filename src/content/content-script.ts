import { copyTextToClipboard } from "../shared/clipboard";
import { convertText, filterStyles, getStyleById, STYLE_DEFINITIONS } from "../shared/converters";
import { getPreferences, patchPreferences } from "../shared/storage";
import {
  captureCaretSnapshot,
  captureSelectionSnapshot,
  describeSelectionCapabilities,
  getSelectionRect,
  insertAtCaret,
  replaceSelection,
  type CaretSnapshot,
  type SelectionSnapshot
} from "../shared/selection";
import type { ContentMessage, ContentResponse, PickerMode } from "../shared/messages";
import type { PreferredAction, SelectionCapabilities, UserPreferences } from "../shared/types";

function debounce<T extends (...args: never[]) => void>(callback: T, delay: number): T {
  let timer: number | null = null;
  return ((...args: never[]) => {
    if (timer !== null) {
      window.clearTimeout(timer);
    }

    timer = window.setTimeout(() => callback(...args), delay);
  }) as T;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

class InlinePickerApp {
  private preferences!: UserPreferences;
  private selectionSnapshot: SelectionSnapshot = { kind: "none", text: "", rect: null };
  private caretSnapshot: CaretSnapshot | null = null;
  private currentStyleId = "bold";
  private currentMode: PickerMode = "selection";
  private currentCapabilities: SelectionCapabilities = {
    selectionType: "none",
    sourceText: "",
    canReplace: false,
    canInsert: false,
    canCopy: false
  };
  private host = document.createElement("div");
  private button = document.createElement("button");
  private popover = document.createElement("section");
  private sourceInput = document.createElement("textarea");
  private searchInput = document.createElement("input");
  private previewLabel = document.createElement("div");
  private previewOutput = document.createElement("div");
  private contextNote = document.createElement("div");
  private styleList = document.createElement("div");
  private replaceButton = document.createElement("button");
  private insertButton = document.createElement("button");
  private copyButton = document.createElement("button");
  private closeButton = document.createElement("button");
  private status = document.createElement("div");
  private isPopoverOpen = false;
  private hasSelectionContext = false;
  private dismissedSelectionSignature: string | null = null;
  private filteredStyles = STYLE_DEFINITIONS;
  private syncSelectionUiDebounced = debounce(() => this.syncSelectionUi(), 120);
  private refreshStylesDebounced = debounce(() => this.refreshStyleList(), 60);

  async init(): Promise<void> {
    this.preferences = await getPreferences();
    this.currentStyleId = this.preferences.lastStyleId;
    this.caretSnapshot = captureCaretSnapshot();
    this.buildUi();
    this.attachListeners();
  }

  private buildUi(): void {
    this.host.className = "utc-shell";
    this.host.setAttribute("data-utc-root", "true");

    this.button.type = "button";
    this.button.className = "utc-fab";
    this.button.textContent = "U";
    this.button.setAttribute("aria-label", "Open Unicode text picker");
    this.button.hidden = true;

    this.popover.className = "utc-popover";
    this.popover.setAttribute("role", "dialog");
    this.popover.setAttribute("aria-label", "Unicode text style picker");
    this.popover.hidden = true;

    const header = document.createElement("div");
    header.className = "utc-header";

    const titleWrap = document.createElement("div");
    titleWrap.className = "utc-title-wrap";

    const eyebrow = document.createElement("div");
    eyebrow.className = "utc-eyebrow";
    eyebrow.textContent = "Unicode Text Converter";

    const title = document.createElement("h2");
    title.className = "utc-title";
    title.textContent = "Style Picker";

    titleWrap.append(eyebrow, title);

    this.closeButton.type = "button";
    this.closeButton.className = "utc-close";
    this.closeButton.textContent = "×";
    this.closeButton.setAttribute("aria-label", "Close");

    header.append(titleWrap, this.closeButton);

    this.contextNote.className = "utc-context-note";

    const sourceLabel = document.createElement("label");
    sourceLabel.className = "utc-field-label";
    sourceLabel.textContent = "Quick insert";
    sourceLabel.htmlFor = "utc-source-input";

    this.sourceInput.className = "utc-source-input";
    this.sourceInput.id = "utc-source-input";
    this.sourceInput.rows = 3;
    this.sourceInput.placeholder = "Type here or convert the current selection";

    const searchWrap = document.createElement("div");
    searchWrap.className = "utc-search-wrap";

    this.searchInput.className = "utc-search-input";
    this.searchInput.type = "search";
    this.searchInput.placeholder = "Filter styles";
    this.searchInput.setAttribute("aria-label", "Filter styles");
    searchWrap.append(this.searchInput);

    const previewCard = document.createElement("div");
    previewCard.className = "utc-preview-card";
    this.previewLabel.className = "utc-preview-label";
    this.previewOutput.className = "utc-preview-output";
    previewCard.append(this.previewLabel, this.previewOutput);

    this.styleList.className = "utc-style-list";
    this.styleList.setAttribute("role", "listbox");

    this.status.className = "utc-status";

    this.popover.append(header, this.contextNote, sourceLabel, this.sourceInput, searchWrap, previewCard, this.styleList, this.status);
    this.host.append(this.button, this.popover);
    document.documentElement.append(this.host);
    this.refreshPreview();
    this.refreshStyleList();
  }

  private attachListeners(): void {
    document.addEventListener(
      "selectionchange",
      () => {
        if (!this.isUiFocused()) {
          this.caretSnapshot = captureCaretSnapshot();
          this.syncSelectionUiDebounced();
        }
      },
      true
    );

    document.addEventListener(
      "mouseup",
      (event) => {
        if (!this.isWithinUi(event.target) && !this.isUiFocused()) {
          this.caretSnapshot = captureCaretSnapshot();
          this.syncSelectionUi();
        }
      },
      true
    );

    document.addEventListener(
      "keyup",
      (event) => {
        if (!this.isWithinUi(event.target) && !this.isUiFocused()) {
          this.caretSnapshot = captureCaretSnapshot();
          this.syncSelectionUi();
        }
      },
      true
    );

    document.addEventListener(
      "focusin",
      (event) => {
        if (!this.isWithinUi(event.target)) {
          this.caretSnapshot = captureCaretSnapshot();
        }
      },
      true
    );

    window.addEventListener("scroll", () => this.reposition(), true);
    window.addEventListener("resize", () => this.reposition());

    document.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "Escape" && this.isPopoverOpen) {
          this.hidePopover();
        }
      },
      true
    );

    this.button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
    });
    this.button.addEventListener("click", () => {
      this.openPicker("selection");
    });

    this.closeButton.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    this.closeButton.addEventListener("click", () => {
      this.hidePopover();
    });

    this.sourceInput.addEventListener("input", () => {
      this.status.textContent = "";
      this.preferences.lastQuickInsertText = this.sourceInput.value;
      this.refreshPreview();
      this.updateButtons();
      this.refreshStylesDebounced();
    });

    this.searchInput.addEventListener("input", () => {
      this.refreshStylesDebounced();
    });

    chrome.runtime.onMessage.addListener((message: ContentMessage, _sender, sendResponse) => {
      void this.handleMessage(message).then(sendResponse);
      return true;
    });

    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === "sync" && changes.preferences) {
        this.preferences = { ...this.preferences, ...changes.preferences.newValue };
        this.currentStyleId = this.preferences.lastStyleId;
        if (!this.isEnabled()) {
          this.hideAllUi();
        }
        this.refreshPreview();
        this.refreshStyleList();
      }
    });
  }

  private isWithinUi(target: EventTarget | null): boolean {
    return target instanceof Node && this.host.contains(target);
  }

  private isUiFocused(): boolean {
    return this.isWithinUi(document.activeElement);
  }

  private isEnabled(): boolean {
    return this.preferences.enabled;
  }

  private hideAllUi(): void {
    this.popover.hidden = true;
    this.button.hidden = true;
    this.isPopoverOpen = false;
    this.hasSelectionContext = false;
    this.status.textContent = "";
  }

  private syncSelectionUi(): void {
    if (!this.isEnabled()) {
      this.hideAllUi();
      this.dismissedSelectionSignature = null;
      return;
    }

    const snapshot = captureSelectionSnapshot();
    const hasMeaningfulSelection = snapshot.kind !== "none" && snapshot.text.trim().length > 0;

    if (!hasMeaningfulSelection) {
      this.hasSelectionContext = false;
      this.dismissedSelectionSignature = null;
      this.button.hidden = true;
      return;
    }

    const selectionSignature = this.getSelectionSignature(snapshot);
    if (this.dismissedSelectionSignature && this.dismissedSelectionSignature === selectionSignature) {
      this.selectionSnapshot = snapshot;
      this.hasSelectionContext = true;
      this.button.hidden = true;
      return;
    }

    this.dismissedSelectionSignature = null;
    this.selectionSnapshot = snapshot;
    this.hasSelectionContext = true;
    this.currentCapabilities = describeSelectionCapabilities(this.selectionSnapshot, this.caretSnapshot);
    this.button.hidden = true;
  }

  private openPicker(mode: PickerMode): void {
    if (!this.isEnabled()) {
      this.hideAllUi();
      return;
    }

    const freshSelection = !this.isUiFocused() ? captureSelectionSnapshot() : this.selectionSnapshot;
    if (mode === "selection" && freshSelection.kind !== "none" && freshSelection.text.trim()) {
      this.selectionSnapshot = freshSelection;
      this.hasSelectionContext = true;
      this.dismissedSelectionSignature = null;
      this.sourceInput.value = freshSelection.text;
      this.currentMode = "selection";
    } else if (mode === "selection") {
      this.hideAllUi();
      this.showStatus("Select text first, then use the shortcut.");
      return;
    } else {
      this.selectionSnapshot = { kind: "none", text: "", rect: null };
      this.hasSelectionContext = false;
      this.currentMode = "quick";
      this.sourceInput.value = this.preferences.lastQuickInsertText;
    }

    if (!this.sourceInput.value && this.hasSelectionContext && this.selectionSnapshot.kind !== "none") {
      this.sourceInput.value = this.selectionSnapshot.text;
    }

    if (!this.sourceInput.value && this.preferences.lastQuickInsertText) {
      this.sourceInput.value = this.preferences.lastQuickInsertText;
    }

    this.currentCapabilities = describeSelectionCapabilities(this.selectionSnapshot, this.caretSnapshot);
    this.button.hidden = true;
    this.popover.hidden = false;
    this.isPopoverOpen = true;
    this.refreshStyleList();
    this.refreshPreview();
    this.updateButtons();
    this.reposition();
    this.searchInput.focus({ preventScroll: true });
    this.showStatus(this.currentCapabilities.message ?? "");
  }

  private hidePopover(): void {
    this.popover.hidden = true;
    this.isPopoverOpen = false;
    this.status.textContent = "";
    this.dismissedSelectionSignature = this.hasSelectionContext ? this.getSelectionSignature(this.selectionSnapshot) : null;
    this.button.hidden = true;
  }

  private getSelectionSignature(snapshot: SelectionSnapshot): string {
    switch (snapshot.kind) {
      case "text-control":
        return `${snapshot.kind}:${snapshot.start}:${snapshot.end}:${snapshot.text}`;
      case "contenteditable":
      case "page":
        return `${snapshot.kind}:${snapshot.text}`;
      default:
        return "none";
    }
  }

  private positionButton(): void {
    const rect = getSelectionRect(this.selectionSnapshot);
    if (!rect) {
      return;
    }

    const top = clamp(rect.top - 20, 8, window.innerHeight - 48);
    const left = clamp(rect.right + 8, 8, window.innerWidth - 48);
    this.button.style.top = `${top}px`;
    this.button.style.left = `${left}px`;
  }

  private reposition(): void {
    if (!this.isPopoverOpen) {
      if (!this.button.hidden) {
        this.positionButton();
      }
      return;
    }

    const rect = this.currentMode === "selection" ? getSelectionRect(this.selectionSnapshot) : null;
    const popoverWidth = 360;
    const popoverHeight = 520;

    const top = rect
      ? clamp(rect.bottom + 12, 12, Math.max(12, window.innerHeight - popoverHeight - 12))
      : clamp(window.innerHeight / 2 - popoverHeight / 2, 12, Math.max(12, window.innerHeight - popoverHeight - 12));
    const left = rect
      ? clamp(rect.left, 12, Math.max(12, window.innerWidth - popoverWidth - 12))
      : clamp(window.innerWidth / 2 - popoverWidth / 2, 12, Math.max(12, window.innerWidth - popoverWidth - 12));

    this.popover.style.top = `${top}px`;
    this.popover.style.left = `${left}px`;
  }

  private refreshPreview(): void {
    const style = getStyleById(this.currentStyleId) ?? STYLE_DEFINITIONS[0];
    const source = this.sourceInput.value || style.label;
    this.previewLabel.textContent = style.label;
    this.previewOutput.textContent = convertText(style.id, source);
  }

  private refreshStyleList(): void {
    this.filteredStyles = filterStyles(this.searchInput.value);
    this.styleList.textContent = "";

    for (const style of this.filteredStyles) {
      const option = document.createElement("div");
      option.className = "utc-style-option";
      option.dataset.styleId = style.id;
      option.setAttribute("role", "option");
      option.tabIndex = 0;
      option.setAttribute("aria-selected", String(style.id === this.currentStyleId));
      const isSelected = style.id === this.currentStyleId;
      if (isSelected) {
        option.classList.add("is-selected");
      }

      const label = document.createElement("span");
      label.className = "utc-style-name";
      label.textContent = style.label;

      const preview = document.createElement("span");
      preview.className = "utc-style-preview";
      preview.textContent = convertText(style.id, this.sourceInput.value || style.previewExample);

      option.append(label, preview);
      option.addEventListener("click", () => {
        this.currentStyleId = style.id;
        this.refreshPreview();
        this.refreshStyleList();
      });
      option.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          this.currentStyleId = style.id;
          this.refreshPreview();
          this.refreshStyleList();
        }
      });

      if (isSelected) {
        const actions = document.createElement("div");
        actions.className = "utc-style-actions";
        const hasSource = this.sourceInput.value.trim().length > 0;
        const actionConfigs: Array<{ action: PreferredAction; label: string; disabled: boolean; primary?: boolean }> = [
          { action: "replace", label: "Replace", disabled: !hasSource || !this.currentCapabilities.canReplace, primary: true },
          { action: "insert", label: "Insert", disabled: !hasSource || !this.currentCapabilities.canInsert },
          { action: "copy", label: "Copy", disabled: !hasSource }
        ];

        for (const config of actionConfigs) {
          const actionButton = document.createElement("button");
          actionButton.type = "button";
          actionButton.className = `utc-style-action${config.primary ? " utc-style-action-primary" : ""}`;
          actionButton.textContent = config.label;
          actionButton.disabled = config.disabled;
          actionButton.addEventListener("click", (event) => {
            event.stopPropagation();
            void this.applyCurrentStyle(config.action);
          });
          actions.append(actionButton);
        }

        option.append(actions);
      }

      this.styleList.append(option);
    }

    if (!this.filteredStyles.length) {
      const empty = document.createElement("div");
      empty.className = "utc-empty-state";
      empty.textContent = "No styles match that filter.";
      this.styleList.append(empty);
    }
  }

  private updateButtons(): void {
    this.currentCapabilities = describeSelectionCapabilities(this.selectionSnapshot, this.caretSnapshot);
    this.contextNote.textContent = this.currentCapabilities.message ?? "Replace works in editable fields. Copy is always safe.";
  }

  private showStatus(message: string): void {
    this.status.textContent = message;
  }

  private async applyCurrentStyle(action: PreferredAction): Promise<ContentResponse> {
    if (!this.isEnabled()) {
      const response = { ok: false, message: "Page integration is disabled. Re-enable it from the popup." };
      this.showStatus(response.message);
      return response;
    }

    const sourceText = this.sourceInput.value;
    if (!sourceText.trim()) {
      const response = { ok: false, message: "Enter text or select something first." };
      this.showStatus(response.message);
      return response;
    }

    const convertedText = convertText(this.currentStyleId, sourceText);
    let result: { ok: boolean; message?: string };

    if (action === "replace") {
      result = replaceSelection(this.selectionSnapshot, convertedText);
    } else if (action === "insert") {
      result = insertAtCaret(this.caretSnapshot, convertedText);
    } else {
      try {
        await copyTextToClipboard(convertedText);
        result = { ok: true, message: "Copied to clipboard." };
      } catch {
        result = { ok: false, message: "Clipboard write failed in this page context." };
      }
    }

    if (!result.ok) {
      this.updateButtons();
      this.showStatus(result.message ?? "The action could not be completed.");
      return { ok: false, message: result.message, convertedText, context: this.currentCapabilities };
    }

    const nextPreferences = await patchPreferences({
      lastStyleId: this.currentStyleId,
      preferredAction: action,
      lastQuickInsertText: sourceText
    });
    this.preferences = nextPreferences;

    if (this.preferences.copyAfterAction && action !== "copy") {
      try {
        await copyTextToClipboard(convertedText);
      } catch {
        this.showStatus("Applied on page, but clipboard sync failed.");
      }
    }

    if (action === "replace" || action === "insert") {
      this.hidePopover();
      this.selectionSnapshot = captureSelectionSnapshot();
      this.caretSnapshot = captureCaretSnapshot();
      this.hasSelectionContext = false;
      this.button.hidden = true;
    } else {
      this.showStatus(result.message ?? "Copied to clipboard.");
    }

    return {
      ok: true,
      message: result.message,
      convertedText,
      context: describeSelectionCapabilities(this.selectionSnapshot, this.caretSnapshot)
    };
  }

  private chooseInstantAction(capabilities: SelectionCapabilities): PreferredAction {
    const preferred = this.preferences.preferredAction;
    if (preferred === "replace" && capabilities.canReplace) {
      return "replace";
    }
    if (preferred === "insert" && capabilities.canInsert) {
      return "insert";
    }
    if (preferred === "copy" && capabilities.canCopy) {
      return "copy";
    }
    if (capabilities.canReplace) {
      return "replace";
    }
    if (capabilities.canInsert) {
      return "insert";
    }
    return "copy";
  }

  private async applyLastStyleInstantly(): Promise<ContentResponse> {
    if (!this.isEnabled()) {
      return { ok: false, message: "Page integration is disabled. Re-enable it from the popup." };
    }

    const currentSelection = captureSelectionSnapshot();
    if (currentSelection.kind !== "none" && currentSelection.text.trim()) {
      this.selectionSnapshot = currentSelection;
      this.hasSelectionContext = true;
    }

    this.caretSnapshot = captureCaretSnapshot();
    this.currentCapabilities = describeSelectionCapabilities(this.selectionSnapshot, this.caretSnapshot);
    const sourceText = this.selectionSnapshot.kind !== "none" ? this.selectionSnapshot.text : this.preferences.lastQuickInsertText;
    if (!sourceText.trim()) {
      this.openPicker("quick");
      return { ok: false, message: "No text was selected, so the quick insert panel was opened instead." };
    }

    this.currentStyleId = this.preferences.lastStyleId;
    this.sourceInput.value = sourceText;
    return this.applyCurrentStyle(this.chooseInstantAction(this.currentCapabilities));
  }

  private async handleMessage(message: ContentMessage): Promise<ContentResponse> {
    if (message.type === "GET_SELECTION_CONTEXT") {
      if (!this.isEnabled()) {
        return {
          ok: true,
          context: {
            selectionType: "none",
            sourceText: "",
            canReplace: false,
            canInsert: false,
            canCopy: false,
            message: "Page integration is disabled in the extension popup."
          }
        };
      }

      const selectionSnapshot = captureSelectionSnapshot();
      if (selectionSnapshot.kind !== "none" && selectionSnapshot.text.trim()) {
        this.selectionSnapshot = selectionSnapshot;
        this.hasSelectionContext = true;
      }

      this.caretSnapshot = captureCaretSnapshot();
      this.currentCapabilities = describeSelectionCapabilities(this.selectionSnapshot, this.caretSnapshot);
      return { ok: true, context: this.currentCapabilities };
    }

    if (message.type === "OPEN_PICKER") {
      const currentSelection = captureSelectionSnapshot();
      if (currentSelection.kind === "none" || !currentSelection.text.trim()) {
        this.hideAllUi();
        return { ok: false, message: "Select text first, then use the shortcut." };
      }

      this.openPicker(message.mode ?? "selection");
      return { ok: this.isEnabled(), message: this.isEnabled() ? undefined : "Page integration is disabled.", context: this.currentCapabilities };
    }

    if (message.type === "APPLY_LAST_STYLE") {
      return this.applyLastStyleInstantly();
    }

    if (message.type === "APPLY_STYLE") {
      const freshSelection = captureSelectionSnapshot();
      this.selectionSnapshot = freshSelection.kind !== "none" && freshSelection.text.trim() ? freshSelection : { kind: "none", text: "", rect: null };
      this.hasSelectionContext = this.selectionSnapshot.kind !== "none";
      this.caretSnapshot = captureCaretSnapshot();
      this.currentCapabilities = describeSelectionCapabilities(this.selectionSnapshot, this.caretSnapshot);
      this.currentStyleId = message.styleId;
      this.sourceInput.value =
        message.sourceText ??
        (this.selectionSnapshot.kind !== "none" ? this.selectionSnapshot.text : this.preferences.lastQuickInsertText);
      this.currentMode = message.mode ?? "selection";
      this.refreshPreview();
      this.updateButtons();
      return this.applyCurrentStyle(message.action);
    }

    return { ok: false, message: "Unknown message." };
  }
}

const app = new InlinePickerApp();
void app.init();
