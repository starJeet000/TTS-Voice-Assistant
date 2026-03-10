export default function Sidebar({
  sessions, activeSessionId, setActiveSessionId,
  isSidebarOpen, setIsSidebarOpen,
  deleteChat, renameChat, pinChat, shareChat,
  activeMenuId, setActiveMenuId
}) {
  const sortedSessions = [...sessions].sort((a, b) => (b.isPinned === a.isPinned) ? 0 : b.isPinned ? 1 : -1);

  return (
    <div style={{
      width: isSidebarOpen ? '260px' : '65px', 
      transition: 'width 0.3s ease',
      background: '#1e1f20',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      position: 'relative' // REQUIRED for the absolute button trick to work!
    }}>

      <style>{`
        .hamburger-btn {
          background: transparent;
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
          -webkit-tap-highlight-color: transparent;
          color: #e3e3e3;
          font-size: 1.5rem;
          cursor: pointer;
          width: 45px;          
          height: 45px;         
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .hamburger-btn:focus {
          outline: none !important;
          border: none !important;
        }
      `}</style>

      {/* Hamburger Button Anchored to the Right Edge */}
      <button
        className="hamburger-btn"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        style={{
          position: 'absolute',
          top: '15px',
          right: '10px', // Perfectly slides alongside the expanding/collapsing sidebar!
          zIndex: 100
        }}
      >
        ☰
      </button>

      {/* Invisible spacer so the fixed button doesn't overlap the first chat entry */}
      <div style={{ height: '75px', flexShrink: 0 }}></div>

      {isSidebarOpen && (
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '5px', padding: '0 10px' }}>
          {sortedSessions.map(session => (
            <div key={session.id} style={{ position: 'relative' }}>
              <div
                onClick={() => { setActiveSessionId(session.id); setActiveMenuId(null); }}
                style={{
                  padding: '12px', background: session.id === activeSessionId ? '#333538' : 'transparent',
                  borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}
              >
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', color: '#e3e3e3' }}>
                  {session.isPinned && <span style={{ marginRight: '5px' }}>📌</span>}
                  {session.title}
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === session.id ? null : session.id); }}
                  style={{ background: 'transparent', border: 'none', color: '#a0a0a0', cursor: 'pointer', fontSize: '1.2rem', padding: '0 5px' }}
                >
                  ⋮
                </button>
              </div>

              {activeMenuId === session.id && (
                <div style={{ position: 'absolute', right: '10px', top: '40px', background: '#2a2b2e', border: '1px solid #444', borderRadius: '8px', zIndex: 10, padding: '5px', display: 'flex', flexDirection: 'column', gap: '5px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                  <button onClick={(e) => shareChat(session, e)} style={{ background: 'transparent', border: 'none', color: '#e3e3e3', cursor: 'pointer', textAlign: 'left', padding: '8px 12px' }}>Share</button>
                  <button onClick={(e) => renameChat(session.id, e)} style={{ background: 'transparent', border: 'none', color: '#e3e3e3', cursor: 'pointer', textAlign: 'left', padding: '8px 12px' }}>Rename</button>
                  <button onClick={(e) => pinChat(session.id, e)} style={{ background: 'transparent', border: 'none', color: '#e3e3e3', cursor: 'pointer', textAlign: 'left', padding: '8px 12px' }}>{session.isPinned ? 'Unpin' : 'Pin'}</button>
                  <button onClick={(e) => deleteChat(session.id, e)} style={{ background: 'transparent', border: 'none', color: '#ff6b6b', cursor: 'pointer', textAlign: 'left', padding: '8px 12px' }}>Delete</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}