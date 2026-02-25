export default function ChatArea({ activeSession, isLoading, togglePlayMessage, playingAudioUrl }) {
  
  // UPGRADED: Parses URLs into clickable links and preserves paragraph formatting
  const renderTextWithLinks = (text) => {
    if (!text) return null;
    
    // Regex to detect http and https URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    
    // Split by newlines first to keep Leni's list formatting intact
    return text.split('\n').map((line, lineIndex) => {
      const parts = line.split(urlRegex);
      
      return (
        <span key={lineIndex}>
          {parts.map((part, partIndex) => {
            if (part.match(urlRegex)) {
              return (
                <a 
                  key={partIndex} 
                  href={part} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ color: '#a8c7fa', textDecoration: 'underline', wordBreak: 'break-all' }}
                >
                  {part}
                </a>
              );
            }
            return part;
          })}
          {/* Add a line break after each paragraph/list item */}
          <br />
        </span>
      );
    });
  };

  return (
    <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      <style>{`
        .visualizer { display: flex; gap: 3px; align-items: center; height: 15px; margin-left: 10px; }
        .bar { width: 3px; background: #a8c7fa; border-radius: 2px; animation: bounce 1s infinite ease-in-out; }
        .bar:nth-child(1) { animation-delay: 0s; }
        .bar:nth-child(2) { animation-delay: 0.2s; }
        .bar:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bounce { 0%, 100% { height: 4px; } 50% { height: 15px; } }
      `}</style>

      <div style={{ width: '100%', maxWidth: '800px' }}>
        {(!activeSession || activeSession.messages.length === 0) && (
          <div style={{ textAlign: 'center', color: '#a0a0a0', marginTop: '150px', fontSize: '1.5rem', fontWeight: '500' }}>
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: '10px' }}>✨</span>
            Where should we start?
          </div>
        )}

        {activeSession?.messages.map((msg, index) => (
          <div key={index} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', margin: '20px 0' }}>
            <div style={{ background: msg.role === 'user' ? '#1e1f20' : 'transparent', color: '#e3e3e3', padding: msg.role === 'user' ? '12px 20px' : '10px 0', borderRadius: '20px', maxWidth: '85%', fontSize: '1rem', lineHeight: '1.6', wordBreak: 'break-word' }}>
              
              {msg.previewUrl && <img src={msg.previewUrl} alt="attachment" style={{ maxWidth: '300px', borderRadius: '12px', marginBottom: '10px', display: 'block' }} />}
              {msg.fileName && !msg.previewUrl && <div style={{ fontSize: '0.8em', fontStyle: 'italic', marginBottom: '6px', background: '#333538', padding: '6px 10px', borderRadius: '6px', display: 'inline-block' }}>📎 {msg.fileName}</div>}
              
              {/* THIS IS WHERE THE MAGIC HAPPENS */}
              <div>{renderTextWithLinks(msg.text)}</div>

              {msg.role === 'assistant' && msg.audioUrl && (
                <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
                  <button 
                    onClick={() => togglePlayMessage(msg.audioUrl)}
                    style={{ background: '#333538', color: '#e3e3e3', border: 'none', padding: '6px 12px', borderRadius: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem' }}
                  >
                    {playingAudioUrl === msg.audioUrl ? '⏸ Pause' : '▶ Play'}
                  </button>
                  
                  {playingAudioUrl === msg.audioUrl && (
                    <div className="visualizer">
                      <div className="bar"></div>
                      <div className="bar"></div>
                      <div className="bar"></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && <div style={{ padding: '10px 0', color: '#a0a0a0', fontStyle: 'italic' }}>Thinking...</div>}
      </div>
    </div>
  );
}