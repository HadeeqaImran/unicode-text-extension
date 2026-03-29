import { copyTextToClipboard } from "../shared/clipboard";
import { convertText, filterStyles, getStyleById, STYLE_DEFINITIONS } from "../shared/converters";
import { getPreferences, patchPreferences } from "../shared/storage";
import type { ContentMessage, ContentResponse } from "../shared/messages";
import type { PreferredAction, SelectionCapabilities, UserPreferences } from "../shared/types";

class PopupApp {
  private preferences!: UserPreferences;
  private currentStyleId = "bold";
  private currentContext: SelectionCapabilities = {
    selectionType: "none",
    sourceText: "",
    canReplace: false,
    canInsert: false,
    canCopy: false
  };
  private root = document.getElementById("popup-root") as HTMLDivElement;
  private sourceInput = document.createElement("textarea");
  private searchInput = document.createElement("input");
  private previewLabel = document.createElement("div");
  private previewOutput = document.createElement("div");
  private styleList = document.createElement("div");
  private copyButton = document.createElement("button");
  private insertButton = document.createElement("button");
  private replaceButton = document.createElement("button");
  private saveDefaultButton = document.createElement("button");
  private preferredActionSelect = document.createElement("select");
  private enabledCheckbox = document.createElement("input");
  private autoOpenCheckbox = document.createElement("input");
  private floatingOnlyCheckbox = document.createElement("input");
  private copyAfterCheckbox = document.createElement("input");
  private contextNote = document.createElement("div");
  private status = document.createElement("div");
  private filteredStyles = STYLE_DEFINITIONS;

  async init(): Promise<void> {
    this.preferences = await getPreferences();
    this.currentStyleId = this.preferences.defaultStyleId || this.preferences.lastStyleId;
    this.buildUi();
    await this.refreshContext();
    this.refreshStyleList();
    this.refreshPreview();
    this.updateButtons();
  }

  private buildUi(): void {
    this.root.className = "utc-popup-app";

    const frame = document.createElement("div");
    frame.className = "utc-popup-frame";

    const header = document.createElement("div");
    header.className = "utc-header";
    header.innerHTML = `
      <div class="utc-title-wrap">
        <div class="utc-eyebrow">Unicode Text Converter</div>
        <h1 class="utc-title">Quick Insert</h1>
      </div>
    `;

    this.contextNote.className = "utc-context-note";

    const sourceLabel = document.createElement("label");
    sourceLabel.className = "utc-field-label";
    sourceLabel.textContent = "Text";
    sourceLabel.htmlFor = "utc-popup-source";

    this.sourceInput.className = "utc-source-input";
    this.sourceInput.id = "utc-popup-source";
    this.sourceInput.rows = 4;
    this.sourceInput.value = this.preferences.lastQuickInsertText;
    this.sourceInput.placeholder = "Type text here, or use the current page selection";
    this.sourceInput.addEventListener("input", () => {
      this.refreshPreview();
      this.refreshStyleList();
    });

    const searchWrap = document.createElement("div");
    searchWrap.className = "utc-search-wrap";
    this.searchInput.className = "utc-search-input";
    this.searchInput.type = "search";
    this.searchInput.placeholder = "Filter styles";
    this.searchInput.addEventListener("input", () => this.refreshStyleList());
    searchWrap.append(this.searchInput);

    const previewCard = document.createElement("div");
    previewCard.className = "utc-preview-card";
    this.previewLabel.className = "utc-preview-label";
    this.previewOutput.className = "utc-preview-output";
    previewCard.append(this.previewLabel, this.previewOutput);

    this.styleList.className = "utc-style-list utc-style-list-popup";

    const settings = document.createElement("section");
    settings.className = "utc-settings";

    const settingsTitle = document.createElement("div");
    settingsTitle.className = "utc-field-label";
    settingsTitle.textContent = "Preferences";

    const selectWrap = document.createElement("label");
    selectWrap.className = "utc-setting-row";
    selectWrap.textContent = "Preferred action";

    this.preferredActionSelect.className = "utc-select";
    for (const action of ["replace", "insert", "copy"] satisfies PreferredAction[]) {
      const option = document.createElement("option");
      option.value = action;
      option.textContent = action[0].toUpperCase() + action.slice(1);
      option.selected = action === this.preferences.preferredAction;
      this.preferredActionSelect.append(option);
    }
    this.preferredActionSelect.addEventListener("change", () => {
      void this.savePreferences({ preferredAction: this.preferredActionSelect.value as PreferredAction });
    });
    selectWrap.append(this.preferredActionSelect);

    const enabledLabel = this.createCheckboxRow(
      this.enabledCheckbox,
      "Enable page integration",
      this.preferences.enabled,
      (checked) => this.savePreferences({ enabled: checked })
    );

    const autoOpenLabel = this.createCheckboxRow(
      this.autoOpenCheckbox,
      "Open the picker automatically when I select text",
      this.preferences.autoOpenPickerOnSelection,
      (checked) => this.savePreferences({ autoOpenPickerOnSelection: checked })
    );

    const floatingOnlyLabel = this.createCheckboxRow(
      this.floatingOnlyCheckbox,
      "Show the floating button only",
      this.preferences.showFloatingButtonOnly,
      (checked) => this.savePreferences({ showFloatingButtonOnly: checked })
    );

    const copyAfterLabel = this.createCheckboxRow(
      this.copyAfterCheckbox,
      "Copy after replace or insert",
      this.preferences.copyAfterAction,
      (checked) => this.savePreferences({ copyAfterAction: checked })
    );

    this.saveDefaultButton.type = "button";
    this.saveDefaultButton.className = "utc-action utc-action-secondary";
    this.saveDefaultButton.textContent = "Save Current Style as Default";
    this.saveDefaultButton.addEventListener("click", () => {
      void this.savePreferences({ defaultStyleId: this.currentStyleId });
    });

    settings.append(settingsTitle, enabledLabel, selectWrap, autoOpenLabel, floatingOnlyLabel, copyAfterLabel, this.saveDefaultButton);

    this.status.className = "utc-status";

    frame.append(header, this.contextNote, sourceLabel, this.sourceInput, searchWrap, previewCard, this.styleList, settings, this.status);
    this.root.append(frame);
  }

  private createCheckboxRow(
    input: HTMLInputElement,
    labelText: string,
    checked: boolean,
    onChange: (checked: boolean) => void
  ): HTMLLabelElement {
    const label = document.createElement("label");
    label.className = "utc-checkbox-row";

    input.type = "checkbox";
    input.checked = checked;
    input.addEventListener("change", () => onChange(input.checked));

    const text = document.createElement("span");
    text.textContent = labelText;

    label.append(input, text);
    return label;
  }

  private async getActiveTabId(): Promise<number | null> {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab?.id ?? null;
  }

  private async sendToActiveTab(message: ContentMessage): Promise<ContentResponse | null> {
    const tabId = await this.getActiveTabId();
    if (tabId === null) {
      return null;
    }

    try {
      return await chrome.tabs.sendMessage(tabId, message);
    } catch {
      return null;
    }
  }

  private async refreshContext(): Promise<void> {
    if (!this.preferences.enabled) {
      this.currentContext = {
        selectionType: "none",
        sourceText: "",
        canReplace: false,
        canInsert: false,
        canCopy: false,
        message: "Page integration is disabled. You can still use manual input and copy."
      };
      this.contextNote.textContent = this.currentContext.message ?? "";
      this.updateButtons();
      return;
    }

    const response = await this.sendToActiveTab({ type: "GET_SELECTION_CONTEXT" });
    if (!response?.context) {
      this.currentContext = {
        selectionType: "none",
        sourceText: "",
        canReplace: false,
        canInsert: false,
        canCopy: false,
        message: "Page insertion is unavailable in this tab. Copy still works."
      };
      this.contextNote.textContent = this.currentContext.message ?? "Page insertion is unavailable in this tab. Copy still works.";
      return;
    }

    this.currentContext = response.context;
    this.contextNote.textContent = response.context.message ?? "Replace works in editable fields. Copy is always safe.";
    if (!this.sourceInput.value && response.context.sourceText) {
      this.sourceInput.value = response.context.sourceText;
    }
  }

  private refreshPreview(): void {
    const style = getStyleById(this.currentStyleId) ?? STYLE_DEFINITIONS[0];
    this.previewLabel.textContent = style.label;
    this.previewOutput.textContent = convertText(style.id, this.sourceInput.value || style.previewExample);
    this.updateButtons();
  }

  private refreshStyleList(): void {
    this.filteredStyles = filterStyles(this.searchInput.value);
    this.styleList.textContent = "";

    for (const style of this.filteredStyles) {
      const option = document.createElement("div");
      option.className = "utc-style-option";
      option.tabIndex = 0;
      const isSelected = style.id === this.currentStyleId;
      if (isSelected) {
        option.classList.add("is-selected");
      }
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

      const label = document.createElement("span");
      label.className = "utc-style-name";
      label.textContent = style.label;

      const preview = document.createElement("span");
      preview.className = "utc-style-preview";
      preview.textContent = convertText(style.id, this.sourceInput.value || style.previewExample);

      option.append(label, preview);

      if (isSelected) {
        const actions = document.createElement("div");
        actions.className = "utc-style-actions";
        const hasSource = this.sourceInput.value.trim().length > 0;
        const actionConfigs: Array<{
          label: string;
          primary?: boolean;
          disabled: boolean;
          run: () => Promise<void>;
        }> = [
          { label: "Replace", primary: true, disabled: !this.preferences.enabled || !hasSource || !this.currentContext.canReplace, run: () => this.applyToPage("replace") },
          { label: "Insert", disabled: !this.preferences.enabled || !hasSource || !this.currentContext.canInsert, run: () => this.applyToPage("insert") },
          { label: "Copy", disabled: !hasSource, run: () => this.copy() }
        ];

        for (const config of actionConfigs) {
          const actionButton = document.createElement("button");
          actionButton.type = "button";
          actionButton.className = `utc-style-action${config.primary ? " utc-style-action-primary" : ""}`;
          actionButton.textContent = config.label;
          actionButton.disabled = config.disabled;
          actionButton.addEventListener("click", (event) => {
            event.stopPropagation();
            void config.run();
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
    this.contextNote.textContent =
      this.currentContext.message ??
      (this.preferences.enabled ? "Replace works in editable fields. Copy is always safe." : "Page integration is disabled. You can still use manual input and copy.");
  }

  private async savePreferences(patch: Partial<UserPreferences>): Promise<void> {
    this.preferences = await patchPreferences(patch);
    await this.refreshContext();
    this.refreshPreview();
    this.refreshStyleList();
    this.status.textContent = this.preferences.enabled ? "Preferences saved." : "Page integration disabled.";
  }

  private async copy(): Promise<void> {
    const source = this.sourceInput.value;
    if (!source.trim()) {
      this.status.textContent = "Enter text before copying.";
      return;
    }

    const converted = convertText(this.currentStyleId, source);
    try {
      await copyTextToClipboard(converted);
      this.preferences = await patchPreferences({
        lastStyleId: this.currentStyleId,
        lastQuickInsertText: source,
        preferredAction: "copy"
      });
      this.status.textContent = "Copied to clipboard.";
    } catch {
      this.status.textContent = "Clipboard write failed.";
    }
  }

  private async applyToPage(action: Exclude<PreferredAction, "copy">): Promise<void> {
    const source = this.sourceInput.value;
    if (!source.trim()) {
      this.status.textContent = "Enter text before applying it to the page.";
      return;
    }

    const response = await this.sendToActiveTab({
      type: "APPLY_STYLE",
      styleId: this.currentStyleId,
      action,
      sourceText: source,
      mode: "quick"
    });

    if (!response?.ok) {
      this.status.textContent = response?.message ?? "The active tab did not accept the page action.";
      await this.refreshContext();
      this.updateButtons();
      return;
    }

    this.preferences = await getPreferences();
    this.status.textContent = action === "replace" ? "Selection replaced on the page." : "Converted text inserted at the caret.";
    await this.refreshContext();
  }
}

const popupApp = new PopupApp();
void popupApp.init();
