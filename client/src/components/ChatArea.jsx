export default function ChatArea({ 
  activeSession, isLoading, togglePlayMessage, playingAudioId, isAudioPlaying, 
  messagesEndRef, handleCopy, copiedId, 
  editingMessageIndex, setEditingMessageIndex, editDraft, setEditDraft, handleResubmitEdit 
}) {
  
  const renderTextWithLinks = (text) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split('\n').map((line, lineIndex) => {
      const parts = line.split(urlRegex);
      return (
        <span key={lineIndex}>
          {parts.map((part, partIndex) => {
            if (part.match(urlRegex)) {
              return (
                <a key={partIndex} href={part} target="_blank" rel="noopener noreferrer" style={{ color: '#a8c7fa', textDecoration: 'underline', wordBreak: 'break-all' }}>
                  {part}
                </a>
              );
            }
            return part;
          })}
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
        
        .action-button:hover { color: '#e3e3e3' !important; }
      `}</style>

      <div style={{ width: '100%', maxWidth: '800px' }}>
        {(!activeSession || activeSession.messages.length === 0) && (
          <div style={{ textAlign: 'center', color: '#a0a0a0', marginTop: '150px', fontSize: '1.5rem', fontWeight: '500' }}>
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: '10px' }}>✨</span>
            Where should we start?
          </div>
        )}

        {activeSession?.messages.map((msg, index) => (
          <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', margin: '20px 0' }}>
            
            <div style={{ background: msg.role === 'user' ? '#1e1f20' : 'transparent', color: '#e3e3e3', padding: msg.role === 'user' ? '12px 20px' : '10px 0', borderRadius: '20px', maxWidth: '85%', fontSize: '1rem', lineHeight: '1.6', wordBreak: 'break-word' }}>
              
              {editingMessageIndex === index ? (
                <div style={{ minWidth: '300px', width: '100%' }}>
                  <textarea 
                    value={editDraft} 
                    onChange={(e) => setEditDraft(e.target.value)}
                    style={{ width: '100%', background: '#131314', color: '#e3e3e3', border: '1px solid #333538', borderRadius: '10px', padding: '12px', minHeight: '100px', fontFamily: 'inherit', resize: 'vertical' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                    <button onClick={() => setEditingMessageIndex(null)} style={{ background: 'transparent', color: '#a0a0a0', border: 'none', cursor: 'pointer', padding: '8px 12px' }}>Cancel</button>
                    <button onClick={() => handleResubmitEdit(index, editDraft)} style={{ background: '#a8c7fa', color: '#041e49', border: 'none', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}>Save & Submit</button>
                  </div>
                </div>
              ) : (
                <>
                  {msg.previewUrl && <img src={msg.previewUrl} alt="attachment" style={{ maxWidth: '300px', borderRadius: '12px', marginBottom: '10px', display: 'block' }} />}
                  {msg.fileName && !msg.previewUrl && <div style={{ fontSize: '0.8em', fontStyle: 'italic', marginBottom: '6px', background: '#333538', padding: '6px 10px', borderRadius: '6px', display: 'inline-block' }}>📎 {msg.fileName}</div>}
                  
                  <div>{renderTextWithLinks(msg.text)}</div>

                  {/* FIXED AUDIO BUTTON LOGIC (Backward Compatible) */}
                  {msg.role === 'assistant' && (msg.audioFileName || msg.audioUrl) && (
                    <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
                      <button 
                        onClick={() => {
                          const targetFile = msg.audioFileName || msg.audioUrl.split('/').pop();
                          togglePlayMessage(targetFile);
                        }}
                        style={{ background: '#333538', color: '#e3e3e3', border: 'none', padding: '6px 12px', borderRadius: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem' }}
                      >
                        {playingAudioId === (msg.audioFileName || msg.audioUrl?.split('/').pop()) && isAudioPlaying ? '⏸ Pause' : 
                        (playingAudioId === (msg.audioFileName || msg.audioUrl?.split('/').pop()) ? '▶ Resume' : '▶ Play')}
                      </button>
                      
                      {playingAudioId === (msg.audioFileName || msg.audioUrl?.split('/').pop()) && isAudioPlaying && (
                        <div className="visualizer">
                          <div className="bar"></div>
                          <div className="bar"></div>
                          <div className="bar"></div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {editingMessageIndex !== index && (
              <div style={{ display: 'flex', gap: '15px', marginTop: '8px', fontSize: '0.85rem', padding: msg.role === 'user' ? '0 10px' : '0' }}>
                
                {msg.role === 'user' && (
                  <button 
                    onClick={() => { setEditingMessageIndex(index); setEditDraft(msg.text); }} 
                    className="action-button"
                    style={{ cursor: 'pointer', background: 'none', border: 'none', color: '#a0a0a0', display: 'flex', alignItems: 'center', gap: '4px', padding: '0', transition: 'color 0.2s' }}
                  >
                    ✏️ Edit
                  </button>
                )}

                <button 
                  onClick={() => handleCopy(msg.text, index)} 
                  className="action-button"
                  style={{ cursor: 'pointer', background: 'none', border: 'none', color: '#a0a0a0', display: 'flex', alignItems: 'center', gap: '4px', padding: '0', transition: 'color 0.2s' }}
                >
                  {copiedId === index ? '✅ Copied!' : '📋 Copy'}
                </button>
              </div>
            )}
            
          </div>
        ))}
        {isLoading && <div style={{ padding: '10px 0', color: '#a0a0a0', fontStyle: 'italic' }}>Thinking...</div>}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}