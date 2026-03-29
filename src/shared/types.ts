export type StyleCategory =
  | "enclosed"
  | "mathematical"
  | "symbolic"
  | "effects"
  | "directional";

export type PreferredAction = "replace" | "insert" | "copy";

export interface StyleDefinition {
  id: string;
  label: string;
  category: StyleCategory;
  previewExample: string;
  supportsReplace: boolean;
  supportsCopy: boolean;
  keywords: string[];
  convert: (input: string) => string;
}

export interface UserPreferences {
  enabled: boolean;
  lastStyleId: string;
  defaultStyleId: string;
  preferredAction: PreferredAction;
  autoOpenPickerOnSelection: boolean;
  showFloatingButtonOnly: boolean;
  copyAfterAction: boolean;
  lastQuickInsertText: string;
}

export interface SelectionCapabilities {
  selectionType: "none" | "text-control" | "contenteditable" | "page";
  sourceText: string;
  canReplace: boolean;
  canInsert: boolean;
  canCopy: boolean;
  message?: string;
}

export const DEFAULT_STYLE_ID = "bold";

export const DEFAULT_PREFERENCES: UserPreferences = {
  enabled: true,
  lastStyleId: DEFAULT_STYLE_ID,
  defaultStyleId: DEFAULT_STYLE_ID,
  preferredAction: "replace",
  autoOpenPickerOnSelection: true,
  showFloatingButtonOnly: false,
  copyAfterAction: false,
  lastQuickInsertText: ""
};
