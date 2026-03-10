import { useState, useRef, useEffect } from 'react';
import { SignedIn, SignedOut, SignIn, UserButton, useAuth } from "@clerk/clerk-react";
import Sidebar from './components/sidebar';
import ChatArea from './components/ChatArea';
import InputBar from './components/InputBar';

export default function App() {
  const { getToken } = useAuth();

  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem('leni_sessions');
    if (saved) return JSON.parse(saved);
    return [{ id: Date.now(), title: 'New Chat', messages: [], isPinned: false }];
  });

  const [activeSessionId, setActiveSessionId] = useState(sessions[0]?.id || null);

  const [input, setInput] = useState('');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [isAutoAudioEnabled, setIsAutoAudioEnabled] = useState(true);
  
  const [copiedId, setCopiedId] = useState(null);
  const [editingMessageIndex, setEditingMessageIndex] = useState(null);
  const [editDraft, setEditDraft] = useState('');

  // --- NEW: CUSTOM RENAME MODAL STATE ---
  const [renameModal, setRenameModal] = useState({ isOpen: false, id: null, draftTitle: '' });

  // --- UPGRADED: BULLETPROOF AUDIO STATE ---
  const [playingAudioId, setPlayingAudioId] = useState(null); 
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('leni_sessions', JSON.stringify(sessions));
  }, [sessions]);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeSession?.messages]);

  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    const handleEnded = () => { setIsAudioPlaying(false); setPlayingAudioId(null); };
    const handlePause = () => setIsAudioPlaying(false);
    const handlePlay = () => setIsAudioPlaying(true);

    audioEl.addEventListener('ended', handleEnded);
    audioEl.addEventListener('pause', handlePause);
    audioEl.addEventListener('play', handlePlay);

    return () => { 
      audioEl.removeEventListener('ended', handleEnded); 
      audioEl.removeEventListener('pause', handlePause);
      audioEl.removeEventListener('play', handlePlay);
    };
  }, []);

  const togglePlayMessage = (fileName) => {
    if (!fileName || !audioRef.current) return;

    const fullUrl = `${import.meta.env.VITE_API_URL}/audio/${fileName}`;

    if (playingAudioId === fileName) {
      if (audioRef.current.paused) {
        audioRef.current.play().catch(e => console.error("Play error:", e));
        setIsAudioPlaying(true);
      } else {
        audioRef.current.pause();
        setIsAudioPlaying(false);
      }
    } else {
      audioRef.current.src = fullUrl;
      setPlayingAudioId(fileName);
      setIsAudioPlaying(true); 
      audioRef.current.play().catch(e => {
        console.error("Playback failed. Backend might be asleep or URL is dead.", e);
        setIsAudioPlaying(false);
      });
    }
  };

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedId(index);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleResubmitEdit = async (index, newText) => {
    setEditingMessageIndex(null);
    if (!newText.trim()) return;

    const sessionToUpdate = sessions.find(s => s.id === activeSessionId);
    const updatedMessages = sessionToUpdate.messages.slice(0, index + 1);
    updatedMessages[index].text = newText;

    setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: updatedMessages } : s));
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('message', newText);
      formData.append('sessionId', activeSessionId.toString());
      const token = await getToken();

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat`, { method: 'POST', headers: {'Authorization': `Bearer ${token}`}, body: formData });
      const data = await response.json();

      setSessions(prev => prev.map(session => {
        if (session.id === activeSessionId) {
          return { ...session, messages: [...session.messages, { role: 'assistant', text: data.reply, audioUrl: data.audioUrl, audioFileName: data.fileName }] };
        }
        return session;
      }));

      if (data.fileName && isAutoAudioEnabled && audioRef.current) {
        const fullUrl = `${import.meta.env.VITE_API_URL}/audio/${data.fileName}`;
        audioRef.current.src = fullUrl;
        setPlayingAudioId(data.fileName);
        setIsAudioPlaying(true);
        audioRef.current.play().catch(e => console.error("Audio block:", e));
      }
    } catch (error) {
      console.error(error);
    } finally { 
      setIsLoading(false); 
    }
  };

  const createNewChat = () => {
    const newSession = { id: Date.now(), title: 'New Chat', messages: [], isPinned: false };
    setSessions([newSession, ...sessions]);
    setActiveSessionId(newSession.id);
    setActiveMenuId(null);
  };

  const deleteChat = async (id, e) => {
    e.stopPropagation();
    const sessionToDelete = sessions.find(s => s.id === id);
    const audioFilesToDelete = sessionToDelete.messages.filter(msg => msg.audioFileName).map(msg => msg.audioFileName);

    const updatedSessions = sessions.filter(s => s.id !== id);
    if (updatedSessions.length === 0) {
      const newSession = { id: Date.now(), title: 'New Chat', messages: [], isPinned: false };
      setSessions([newSession]);
      setActiveSessionId(newSession.id);
    } else {
      setSessions(updatedSessions);
      if (activeSessionId === id) setActiveSessionId(updatedSessions[0].id);
    }
    setActiveMenuId(null);

    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/session/delete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: id, audioFiles: audioFilesToDelete }) });         
    } catch (err) { console.error("Failed to delete backend files:", err); }
  };

  // --- NEW: RENAME LOGIC ---
  const renameChat = (id, e) => {
    e.stopPropagation();
    const sessionToRename = sessions.find(s => s.id === id);
    setRenameModal({ isOpen: true, id: id, draftTitle: sessionToRename ? sessionToRename.title : '' });
    setActiveMenuId(null);
  };

  const saveRename = () => {
    if (renameModal.draftTitle.trim()) {
      setSessions(sessions.map(s => s.id === renameModal.id ? { ...s, title: renameModal.draftTitle } : s));
    }
    setRenameModal({ isOpen: false, id: null, draftTitle: '' });
  };

  const pinChat = (id, e) => {
    e.stopPropagation();
    setSessions(sessions.map(s => s.id === id ? { ...s, isPinned: !s.isPinned } : s));
    setActiveMenuId(null);
  };

  const shareChat = (session, e) => {
    e.stopPropagation();
    const textToShare = session.messages.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n\n');
    navigator.clipboard.writeText(textToShare);
    alert("Chat transcript copied to clipboard!");
    setActiveMenuId(null);
  };

  useEffect(() => {
    if (!file) { setPreviewUrl(null); return; }
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result);
      reader.readAsDataURL(file);
    } else { setPreviewUrl(null); }
  }, [file]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() && !file) return;

    const userMessage = input;
    const attachedFile = file;
    const currentPreview = previewUrl;

    setInput(''); setFile(null); setIsLoading(true);

    setSessions(prevSessions => prevSessions.map(session => {
      if (session.id === activeSessionId) {
        const isFirstMessage = session.messages.length === 0;
        const newTitle = isFirstMessage && userMessage ? userMessage.substring(0, 25) + '...' : session.title;
        return { ...session, title: newTitle, messages: [...session.messages, { role: 'user', text: userMessage || "Sent an attachment.", fileName: attachedFile?.name, previewUrl: currentPreview }] };
      }
      return session;
    }));

    try {
      const formData = new FormData();
      formData.append('message', userMessage);
      formData.append('sessionId', activeSessionId.toString());
      if (attachedFile) formData.append('attachment', attachedFile);
      const token = await getToken();

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat`, { method: 'POST', headers: {'Authorization': `Bearer ${token}`}, body: formData });
      const data = await response.json();

      setSessions(prevSessions => prevSessions.map(session => {
        if (session.id === activeSessionId) {
          return { ...session, messages: [...session.messages, { role: 'assistant', text: data.reply, audioUrl: data.audioUrl, audioFileName: data.fileName }] };
        }
        return session;
      }));

      if (data.fileName && isAutoAudioEnabled && audioRef.current) {
        const fullUrl = `${import.meta.env.VITE_API_URL}/audio/${data.fileName}`;
        audioRef.current.src = fullUrl;
        setPlayingAudioId(data.fileName);
        setIsAudioPlaying(true);
        audioRef.current.play().catch(e => console.error("Audio block:", e));
      }

    } catch (error) {
      setSessions(prevSessions => prevSessions.map(session => {
        if (session.id === activeSessionId) return { ...session, messages: [...session.messages, { role: 'assistant', text: "Sorry, I'm offline right now." }] };
        return session;
      }));
    } finally { setIsLoading(false); }
  };

  return (
    <>
      <SignedOut>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#131314' }}>
          <SignIn />
        </div>
      </SignedOut>

      <SignedIn>
        <div style={{ display: 'flex', height: '100vh', width: '100vw', fontFamily: 'sans-serif', margin: 0, overflow: 'hidden', background: '#131314', color: '#e3e3e3' }}>

          <Sidebar
            sessions={sessions} activeSessionId={activeSessionId} setActiveSessionId={setActiveSessionId}
            isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}
            deleteChat={deleteChat} renameChat={renameChat} pinChat={pinChat} shareChat={shareChat}
            activeMenuId={activeMenuId} setActiveMenuId={setActiveMenuId}
          />

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#131314', position: 'relative' }} onClick={() => setActiveMenuId(null)}>

            <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '500', fontSize: '1.2rem', color: '#e3e3e3' }}>Steve</span>

              <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <button onClick={createNewChat} style={{ background: 'transparent', color: '#e3e3e3', border: '1px solid #444', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span>+</span> New Chat
                </button>

                <button onClick={() => setIsAutoAudioEnabled(!isAutoAudioEnabled)} style={{ background: isAutoAudioEnabled ? '#a8c7fa' : 'transparent', color: isAutoAudioEnabled ? '#041e49' : '#e3e3e3', border: isAutoAudioEnabled ? 'none' : '1px solid #555', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}>
                  {isAutoAudioEnabled ? '🔊 Audio ON' : '🔇 Audio OFF'}
                </button>

                <UserButton afterSignOutUrl="/" />
              </div>
            </div>

            <ChatArea
              activeSession={activeSession} isLoading={isLoading}
              togglePlayMessage={togglePlayMessage} playingAudioId={playingAudioId} isAudioPlaying={isAudioPlaying}
              messagesEndRef={messagesEndRef} handleCopy={handleCopy} copiedId={copiedId}
              editingMessageIndex={editingMessageIndex} setEditingMessageIndex={setEditingMessageIndex}
              editDraft={editDraft} setEditDraft={setEditDraft} handleResubmitEdit={handleResubmitEdit}
            />

            <InputBar
              input={input} setInput={setInput} file={file} setFile={setFile}
              previewUrl={previewUrl} isLoading={isLoading} sendMessage={sendMessage}
            />

            <audio ref={audioRef} style={{ display: 'none' }} />
          </div>
        </div>

        {/* --- CUSTOM RENAME MODAL --- */}
        {renameModal.isOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, backdropFilter: 'blur(2px)' }}>
            <div style={{ background: '#1e1f20', padding: '24px', borderRadius: '12px', width: '320px', border: '1px solid #333538', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
              <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#e3e3e3', fontSize: '1.1rem', fontWeight: '500' }}>Rename Chat</h3>
              <input 
                autoFocus
                value={renameModal.draftTitle} 
                onChange={(e) => setRenameModal({...renameModal, draftTitle: e.target.value})}
                onKeyDown={(e) => e.key === 'Enter' && saveRename()} 
                style={{ width: '100%', padding: '12px', background: '#131314', color: '#e3e3e3', border: '1px solid #444', borderRadius: '8px', marginBottom: '20px', boxSizing: 'border-box', outline: 'none', fontSize: '1rem' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button onClick={() => setRenameModal({ isOpen: false, id: null, draftTitle: '' })} style={{ background: 'transparent', color: '#a0a0a0', border: 'none', cursor: 'pointer', padding: '8px 16px', borderRadius: '20px', transition: 'background 0.2s' }}>Cancel</button>
                <button onClick={saveRename} style={{ background: '#a8c7fa', color: '#041e49', border: 'none', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}>Save</button>
              </div>
            </div>
          </div>
        )}

      </SignedIn>
    </>
  );
}