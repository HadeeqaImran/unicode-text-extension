import { getStyleById } from "../shared/converters";
import { ensurePreferences, getPreferences } from "../shared/storage";
import type { ContentMessage } from "../shared/messages";

const CONTEXT_MENU_PICKER = "open-style-picker";
const CONTEXT_MENU_LAST_STYLE = "convert-last-style";
let bootPromise: Promise<void> | null = null;

function removeAllContextMenus(): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.contextMenus.removeAll(() => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }

      resolve();
    });
  });
}

function createContextMenu(createProperties: chrome.contextMenus.CreateProperties): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.contextMenus.create(createProperties, () => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }

      resolve();
    });
  });
}

async function sendToTab(tabId: number, message: ContentMessage): Promise<void> {
  try {
    await chrome.tabs.sendMessage(tabId, message);
  } catch (error) {
    console.warn("Unable to reach content script", error);
  }
}

async function withActiveTab(run: (tabId: number) => Promise<void>): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id !== undefined) {
    await run(tab.id);
  }
}

async function refreshContextMenus(): Promise<void> {
  const preferences = await getPreferences();
  await removeAllContextMenus();
  if (!preferences.enabled) {
    return;
  }

  const lastStyleLabel = getStyleById(preferences.lastStyleId)?.label ?? "Last Used Style";
  await createContextMenu({
    id: CONTEXT_MENU_LAST_STYLE,
    title: `Convert with ${lastStyleLabel}`,
    contexts: ["selection"]
  });
  await createContextMenu({
    id: CONTEXT_MENU_PICKER,
    title: "Open Unicode Style Picker",
    contexts: ["selection"]
  });
}

async function boot(): Promise<void> {
  await ensurePreferences();
  await refreshContextMenus();
}

function queueBoot(): Promise<void> {
  if (bootPromise) {
    return bootPromise;
  }

  bootPromise = boot().finally(() => {
    bootPromise = null;
  });
  return bootPromise;
}

chrome.runtime.onInstalled.addListener(() => {
  void queueBoot();
});

chrome.runtime.onStartup.addListener(() => {
  void queueBoot();
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (tab?.id === undefined) {
    return;
  }

  void getPreferences().then((preferences) => {
    if (!preferences.enabled) {
      return;
    }

    if (info.menuItemId === CONTEXT_MENU_LAST_STYLE) {
      void sendToTab(tab.id!, { type: "APPLY_LAST_STYLE" });
      return;
    }

    if (info.menuItemId === CONTEXT_MENU_PICKER) {
      void sendToTab(tab.id!, { type: "OPEN_PICKER", mode: "selection" });
    }
  });
});

chrome.commands.onCommand.addListener((command) => {
  void getPreferences().then((preferences) => {
    if (!preferences.enabled) {
      return;
    }

    if (command === "open-style-picker") {
      void withActiveTab(async (tabId) => {
        await sendToTab(tabId, { type: "OPEN_PICKER", mode: "selection" });
      });
      return;
    }

    if (command === "apply-last-style") {
      void withActiveTab(async (tabId) => {
        await sendToTab(tabId, { type: "APPLY_LAST_STYLE" });
      });
    }
  });
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "sync" && changes.preferences) {
    void queueBoot();
  }
});

void queueBoot();
