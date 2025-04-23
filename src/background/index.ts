chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "save-session") {
      chrome.tabs.query({ currentWindow: true }, (tabs) => {
        const session = tabs.map((tab) => ({
          title: tab.title,
          url: tab.url,
        }));
  
        chrome.storage.local.get(["sessions"], (result) => {
          const sessions = result.sessions || [];
          sessions.push(session);
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
  });
  