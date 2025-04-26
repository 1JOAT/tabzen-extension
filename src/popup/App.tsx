import React, { useEffect, useState } from "react";
import "../styles.css";

interface Tab {
  url: string;
  title: string;
  favicon?: string;
}

interface Session {
  tabs: Tab[];
  name: string;
  createdAt: number;
}

const App = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newSessionName, setNewSessionName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedSessions, setExpandedSessions] = useState<number[]>([]);

  const saveSession = () => {
    setIsLoading(true);
    const name = newSessionName.trim() || `Session ${sessions.length + 1}`;
    
    chrome.runtime.sendMessage({ 
      action: "save-session", 
      name: name 
    }, (response) => {
      if (response?.status === "success") {
        getSessions();
        setNewSessionName("");
      }
      setIsLoading(false);
    });
  };

  const getSessions = () => {
    chrome.runtime.sendMessage({ action: "get-sessions" }, (response) => {
      setSessions(response.sessions || []);
      if (response.sessions?.length && expandedSessions.length === 0) {
        setExpandedSessions([0]);
      }
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
    updatedSessions[sessionIndex].tabs = updatedSessions[sessionIndex].tabs.filter(tab => tab.url !== url);

    chrome.runtime.sendMessage({ 
      action: "update-sessions", 
      sessions: updatedSessions 
    }, (response) => {
      if (response?.status === "success") {
        getSessions();
      }
    });
  };

  const restoreSession = (sessionIndex: number) => {
    const sessionTabs = sessions[sessionIndex].tabs;
    
    chrome.runtime.sendMessage({ 
      action: "restore-session", 
      tabs: sessionTabs 
    });
  };

  const closeAllTabs = (sessionIndex: number) => {
    const tabsToClose = sessions[sessionIndex].tabs;

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
    if (confirm("Are you sure you want to delete this session?")) {
      chrome.runtime.sendMessage({ 
        action: "delete-session", 
        sessionIndex 
      }, (response) => {
        if (response?.status === "success") {
          getSessions();
        }
      });
    }
  };

  const renameSession = (sessionIndex: number, newName: string) => {
    const updatedSessions = [...sessions];
    updatedSessions[sessionIndex].name = newName;

    chrome.runtime.sendMessage({ 
      action: "update-sessions", 
      sessions: updatedSessions 
    }, (response) => {
      if (response?.status === "success") {
        getSessions();
      }
    });
  };

  const toggleSessionExpansion = (index: number) => {
    setExpandedSessions(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  const filteredSessions = sessions.filter(session => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    if (session.name.toLowerCase().includes(searchLower)) return true;
    
    return session.tabs.some(tab => 
      tab.title.toLowerCase().includes(searchLower) || 
      tab.url.toLowerCase().includes(searchLower)
    );
  });

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  useEffect(() => {
    getSessions();
  }, []);

  return (
    <div className="tabzen-container">
      <header className="tabzen-header">
        <div className="logo-container">
          <span className="logo">🧠</span>
          <h1 className="app-title">Tabzen</h1>
        </div>

        <div className="search-container">
          <input
            type="text"
            placeholder="Search sessions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </header>

      <div className="save-session-area">
        <input
          type="text"
          placeholder="Session name (optional)"
          value={newSessionName}
          onChange={(e) => setNewSessionName(e.target.value)}
          className="session-name-input"
        />
        <button 
          onClick={saveSession} 
          className="save-button" 
          disabled={isLoading}
        >
          {isLoading ? "Saving..." : "Save Current Tabs"}
        </button>
      </div>

      {filteredSessions.length === 0 ? (
        <div className="empty-state">
          <p>No sessions saved yet.</p>
          <p className="empty-hint">Save your first tab session to get started!</p>
        </div>
      ) : (
        <div className="sessions-container">
          {filteredSessions.map((session, index) => (
            <div key={index} className="session-card">
              <div 
                className="session-header" 
                onClick={() => toggleSessionExpansion(index)}
              >
                <div className="session-title-area">
                  <h2 className="session-title">{session.name}</h2>
                  <div className="session-meta">
                    <span>{session.tabs.length} tabs</span>
                    <span className="session-date">{formatDate(session.createdAt)}</span>
                  </div>
                </div>
                <div className="session-expand-icon">
                  {expandedSessions.includes(index) ? '▼' : '►'}
                </div>
              </div>

              {expandedSessions.includes(index) && (
                <>
                  <ul className="tabs-list">
                    {session.tabs.map((tab, i) => (
                      <li key={i} className="tab-item">
                        <div className="tab-content">
                          {tab.favicon && (
                            <img src={tab.favicon} alt="" className="tab-favicon" />
                          )}
                          <a 
                            href={tab.url} 
                            title={tab.url}
                            target="_blank" 
                            rel="noreferrer" 
                            className="tab-link"
                          >
                            {tab.title}
                          </a>
                        </div>
                        <button 
                          className="close-tab-button" 
                          onClick={(e) => {
                            e.stopPropagation();
                            closeTab(index, tab.url);
                          }}
                          title="Close tab"
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="session-actions">
                    <button 
                      className="action-button restore-button" 
                      onClick={() => restoreSession(index)}
                      title="Open all tabs from this session"
                    >
                      <span className="button-icon">↗️</span>
                      <span>Restore</span>
                    </button>
                    <button 
                      className="action-button close-all-button" 
                      onClick={() => closeAllTabs(index)}
                      title="Close all tabs from this session"
                    >
                      <span className="button-icon">🚪</span>
                      <span>Close All</span>
                    </button>
                    <button 
                      className="action-button rename-button" 
                      onClick={() => {
                        const newName = prompt("Enter new name:", session.name);
                        if (newName) renameSession(index, newName);
                      }}
                      title="Rename this session"
                    >
                      <span className="button-icon">✏️</span>
                      <span>Rename</span>
                    </button>
                    <button 
                      className="action-button delete-button" 
                      onClick={() => deleteSession(index)}
                      title="Delete this session"
                    >
                      <span className="button-icon">🗑️</span>
                      <span>Delete</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default App;