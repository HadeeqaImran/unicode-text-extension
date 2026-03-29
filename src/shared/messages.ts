import type { PreferredAction, SelectionCapabilities } from "./types";

export type PickerMode = "selection" | "quick";

export type ContentMessage =
  | {
      type: "OPEN_PICKER";
      mode?: PickerMode;
    }
  | {
      type: "APPLY_LAST_STYLE";
    }
  | {
      type: "GET_SELECTION_CONTEXT";
    }
  | {
      type: "APPLY_STYLE";
      styleId: string;
      action: PreferredAction;
      sourceText?: string;
      mode?: PickerMode;
    };

export interface ContentResponse {
  ok: boolean;
  message?: string;
  convertedText?: string;
  context?: SelectionCapabilities;
}
