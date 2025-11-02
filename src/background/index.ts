chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "save-session") {
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
      const session = {
        tabs: tabs.map((tab) => ({
          title: tab.title || "Untitled Tab",
          url: tab.url,
          favicon: tab.favIconUrl || ""
        })),
        name: message.name || `Session ${new Date().toLocaleString()}`,
        createdAt: Date.now()
      };

      chrome.storage.local.get(["sessions"], (result) => {
        const sessions = result.sessions || [];
        sessions.unshift(session); // Add new session at the beginning
        chrome.storage.local.set({ sessions }, () => {
          sendResponse({ status: "success" });
        });
      });
    });

    return true;
  }

  if (message.action === "get-sessions") {
    chrome.storage.local.get(["sessions"], (result) => {
      sendResponse({ sessions: result.sessions || [] });
    });
    return true;
  }

  if (message.action === "delete-session") {
    chrome.storage.local.get(["sessions"], (result) => {
      const sessions = result.sessions || [];
      sessions.splice(message.sessionIndex, 1);
      chrome.storage.local.set({ sessions }, () => {
        sendResponse({ status: "success" });
      });
    });
    return true;
  }

  if (message.action === "update-sessions") {
    chrome.storage.local.set({ sessions: message.sessions }, () => {
      sendResponse({ status: "success" });
    });
    return true;
  }

  if (message.action === "restore-session") {
    const tabs = message.tabs;
    if (tabs && tabs.length > 0) {
      chrome.tabs.create({ url: tabs[0].url }, () => {
        for (let i = 1; i < tabs.length; i++) {
          chrome.tabs.create({ url: tabs[i].url });
        }
      });
    }
    sendResponse({ status: "success" });
    return true;
  }
});

chrome.tabs.onCreated.addListener(updateBadge);
chrome.tabs.onRemoved.addListener(updateBadge);

function updateBadge() {
  chrome.tabs.query({}, (tabs) => {
    const tabCount = tabs.length.toString();
    chrome.action.setBadgeText({ text: tabCount });
    chrome.action.setBadgeBackgroundColor({ color: "#6366f1" });
  });
}

updateBadge();
