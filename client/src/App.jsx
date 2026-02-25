import { useState, useRef, useEffect } from 'react';
import { SignedIn, SignedOut, SignIn, UserButton, useAuth } from "@clerk/clerk-react";
import Sidebar from './components/sidebar';
import ChatArea from './components/ChatArea';
import InputBar from './components/InputBar';

export default function App() {

  // Extract the getToken function at the top of your component
  const { getToken } = useAuth();

  // --- LOCAL STORAGE STATE ---
  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem('leni_sessions');
    if (saved) return JSON.parse(saved);
    return [{ id: Date.now(), title: 'New Chat', messages: [], isPinned: false }];
  });

  const [activeSessionId, setActiveSessionId] = useState(sessions[0]?.id || null);

  // --- UI STATE ---
  const [input, setInput] = useState('');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [isAutoAudioEnabled, setIsAutoAudioEnabled] = useState(true);

  // --- AUDIO STATE ---
  const [playingAudioUrl, setPlayingAudioUrl] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('leni_sessions', JSON.stringify(sessions));
  }, [sessions]);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

  // --- ACTIONS ---
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
      await fetch('http://localhost:5000/api/session/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: id, audioFiles: audioFilesToDelete })
      });
    } catch (err) { console.error("Failed to delete backend files:", err); }
  };

  const renameChat = (id, e) => {
    e.stopPropagation();
    const newTitle = prompt("Enter new chat name:");
    if (newTitle) setSessions(sessions.map(s => s.id === id ? { ...s, title: newTitle } : s));
    setActiveMenuId(null);
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

  const togglePlayMessage = (url) => {
    if (playingAudioUrl === url) {
      audioRef.current.pause();
      setPlayingAudioUrl(null);
    } else {
      audioRef.current.src = url;
      audioRef.current.play();
      setPlayingAudioUrl(url);
    }
  };

  useEffect(() => {
    const handleEnded = () => setPlayingAudioUrl(null);
    if (audioRef.current) audioRef.current.addEventListener('ended', handleEnded);
    return () => { if (audioRef.current) audioRef.current.removeEventListener('ended', handleEnded); };
  }, []);

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

      const response = await fetch('http://localhost:5000/api/chat', { method: 'POST', headers: {'Authorization': `Bearer ${token}`}, body: formData });
      const data = await response.json();

      setSessions(prevSessions => prevSessions.map(session => {
        if (session.id === activeSessionId) {
          return { ...session, messages: [...session.messages, { role: 'assistant', text: data.reply, audioUrl: data.audioUrl, audioFileName: data.fileName }] };
        }
        return session;
      }));

      if (data.audioUrl && isAutoAudioEnabled && audioRef.current) {
        audioRef.current.src = data.audioUrl;
        audioRef.current.play();
        setPlayingAudioUrl(data.audioUrl);
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
      {/* WHAT HAPPENS WHEN THEY ARE LOGGED OUT */}
      <SignedOut>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#131314' }}>
          <SignIn />
        </div>
      </SignedOut>

      {/* WHAT HAPPENS WHEN THEY ARE LOGGED IN */}
      <SignedIn>
        <div style={{ display: 'flex', height: '100vh', width: '100vw', fontFamily: 'sans-serif', margin: 0, overflow: 'hidden', background: '#131314', color: '#e3e3e3' }}>

          <Sidebar
            sessions={sessions} activeSessionId={activeSessionId} setActiveSessionId={setActiveSessionId}
            isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}
            deleteChat={deleteChat} renameChat={renameChat} pinChat={pinChat} shareChat={shareChat}
            activeMenuId={activeMenuId} setActiveMenuId={setActiveMenuId}
          />

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#131314', position: 'relative' }} onClick={() => setActiveMenuId(null)}>

            {/* Main Chat Area Header */}
            <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '500', fontSize: '1.2rem', color: '#e3e3e3' }}>Steve</span>

              <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <button
                  onClick={createNewChat}
                  style={{ background: 'transparent', color: '#e3e3e3', border: '1px solid #444', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  <span>+</span> New Chat
                </button>

                <button
                  onClick={() => setIsAutoAudioEnabled(!isAutoAudioEnabled)}
                  style={{ background: isAutoAudioEnabled ? '#a8c7fa' : 'transparent', color: isAutoAudioEnabled ? '#041e49' : '#e3e3e3', border: isAutoAudioEnabled ? 'none' : '1px solid #555', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  {isAutoAudioEnabled ? '🔊 Audio ON' : '🔇 Audio OFF'}
                </button>

                {/* CLERK PROFILE PICTURE COMPONENT */}
                <UserButton afterSignOutUrl="/" />
              </div>
            </div>

            <ChatArea
              activeSession={activeSession} isLoading={isLoading}
              togglePlayMessage={togglePlayMessage} playingAudioUrl={playingAudioUrl}
            />

            <InputBar
              input={input} setInput={setInput} file={file} setFile={setFile}
              previewUrl={previewUrl} isLoading={isLoading} sendMessage={sendMessage}
            />

            <audio ref={audioRef} style={{ display: 'none' }} />
          </div>
        </div>
      </SignedIn>
    </>
  );
}
