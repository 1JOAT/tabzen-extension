import React, { useEffect, useState } from "react";
import "../styles.css";

interface Tab {
  url: string;
  title: string;
}

const App = () => {
  const [sessions, setSessions] = useState<Tab[][]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const saveSession = () => {
    setIsLoading(true);
    chrome.runtime.sendMessage({ action: "save-session" }, (response) => {
      if (response?.status === "success") {
        getSessions();
      }
      setIsLoading(false);
    });
  };

  const getSessions = () => {
    chrome.runtime.sendMessage({ action: "get-sessions" }, (response) => {
      setSessions(response.sessions || []);
    });
  };

  const closeTab = (sessionIndex: number, url: string) => {
    chrome.tabs.query({}, (tabs) => {
      const tabToClose = tabs.find((tab) => tab.url === url);
      if (tabToClose) {
        chrome.tabs.remove(tabToClose.id!);
      }
    });

    const updatedSessions = [...sessions];
    updatedSessions[sessionIndex] = updatedSessions[sessionIndex].filter(tab => tab.url !== url);

    chrome.runtime.sendMessage({ action: "update-sessions", sessions: updatedSessions }, (response) => {
      if (response?.status === "success") {
        getSessions();
      }
    });
  };

  const closeAllTabs = (sessionIndex: number) => {
    const tabsToClose = sessions[sessionIndex];

    chrome.tabs.query({}, (openTabs) => {
      tabsToClose.forEach(({ url }) => {
        const match = openTabs.find(tab => tab.url === url);
        if (match) {
          chrome.tabs.remove(match.id!);
        }
      });
    });

    deleteSession(sessionIndex);
  };

  const deleteSession = (sessionIndex: number) => {
    chrome.runtime.sendMessage({ action: "delete-session", sessionIndex }, (response) => {
      if (response?.status === "success") {
        getSessions();
      }
    });
  };

  useEffect(() => {
    getSessions();
  }, []);

  return (
    <div className="popup-container">
      <h1 className="title">🧠 Tabzen</h1>
      <button onClick={saveSession} className="save-button" disabled={isLoading}>
        {isLoading ? "Saving..." : "Save Current Session"}
      </button>

      {sessions.length === 0 ? (
        <p>No sessions saved yet.</p>
      ) : (
        sessions.map((session, index) => (
          <div key={index} className="session-card">
            <h2 className="session-title">Session {index + 1}</h2>
            <ul>
              {session.map((tab, i) => (
                <li key={i} className="tab-item">
                  <a href={tab.url} target="_blank" rel="noreferrer">{tab.title}</a>
                  <button className="close-button" onClick={() => closeTab(index, tab.url)}>
                    ❌
                  </button>
                </li>
              ))}
            </ul>
            <button className="delete-button" onClick={() => deleteSession(index)}>🗑 Delete</button>
            <button className="delete-button" onClick={() => closeAllTabs(index)}>🚪 Close All Tabs</button>
          </div>
        ))
      )}
    </div>
  );
};

export default App;
