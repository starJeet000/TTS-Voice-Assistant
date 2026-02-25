export default function InputBar({ input, setInput, file, setFile, previewUrl, isLoading, sendMessage }) {
  return (
    <div style={{ padding: '20px', display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center' }}>
      
      {/* CSS for the Gemini-style image preview and hover states */}
      <style>{`
        .preview-container {
          position: relative;
          display: inline-block;
          background: #2a2b2f; /* The dark thick frame around the image */
          padding: 10px;
          border-radius: 16px;
          margin-bottom: 15px;
        }
        .preview-img {
          height: 100px; 
          border-radius: 8px;
          display: block;
          object-fit: cover;
        }
        .remove-btn {
          position: absolute;
          top: -10px;
          right: -10px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #333538;
          color: #e3e3e3;
          border: none !important;
          outline: none !important;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 14px;
          opacity: 0; /* Hidden by default */
          transition: opacity 0.2s ease, background 0.2s ease;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        }
        /* Make the X appear ONLY when hovering over the container */
        .preview-container:hover .remove-btn {
          opacity: 1; 
        }
        /* Slightly lighten the X button when hovering directly over it */
        .remove-btn:hover {
          background: #4a4d51; 
        }
      `}</style>

      <div style={{ width: '100%', maxWidth: '800px' }}>
        
        {/* The Image Preview Block */}
        {previewUrl && (
          <div className="preview-container">
            <img src={previewUrl} alt="Preview" className="preview-img" />
            <button type="button" className="remove-btn" onClick={() => setFile(null)}>
              ✕
            </button>
          </div>
        )}

        <form onSubmit={sendMessage} style={{ display: 'flex', gap: '15px', alignItems: 'center', background: '#1e1f20', borderRadius: '32px', padding: '12px 20px', width: '100%' }}>
          <label style={{ cursor: 'pointer', fontSize: '1.2rem', color: '#a0a0a0', display: 'flex', alignItems: 'center' }}>
            ＋
            <input type="file" onChange={(e) => setFile(e.target.files[0])} disabled={isLoading} style={{ display: 'none' }} key={file ? file.name : 'empty'} />
          </label>
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask Here" style={{ flex: 1, padding: '5px', border: 'none', outline: 'none', fontSize: '1rem', background: 'transparent', color: '#e3e3e3' }} disabled={isLoading} />
          <button type="submit" disabled={isLoading || (!input.trim() && !file)} style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', background: isLoading || (!input.trim() && !file) ? 'transparent' : '#a8c7fa', color: isLoading || (!input.trim() && !file) ? '#555' : '#041e49', cursor: isLoading || (!input.trim() && !file) ? 'not-allowed' : 'pointer', fontWeight: 'bold', transition: '0.2s' }}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

