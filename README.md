# Multimodal TTS (Text-To-Speech) AI Voice Assistant 🌐🤖

A fully functional, voice-native AI assistant built on a decoupled architecture. It features persistent memory, real-time web search capabilities, and secure modern authentication.

## 🚀 Architecture & Tech Stack
* **Frontend:** React (Vite), CSS Custom Themes
* **Backend:** Node.js, Express (ES6 Modules), Multer for file handling, Nodemon for auto restart the server
* **Authentication:** Clerk (Stateless JWT verification via `@clerk/express`)
* **AI Brain:** Google Gemini 2.5 Flash (Function Calling, Multimodal processing)
* **Voice Synthesis:** ElevenLabs API
* **Live Search Agent:** Tavily AI API

## ✨ Key Features
* **Real-Time Web Scraping:** Uses AI function-calling to hit the Tavily API, pulling live news, weather, and data.
* **Smart URL Parsing:** Seamlessly delivers clickable links in the React UI while filtering them out of the ElevenLabs TTS payload for natural audio playback.
* **Secure API Routes:** Express backend is completely locked down using Clerk's middleware and JWT cryptographic verification.
* **Local Storage Management:** Automatically handles and cleans up audio and image buffers on the server side.

## 🛠️ Local Setup Instructions

**1. Clone the repository:**
```bash
git clone https://github.com/starJeet000/TTS-Voice-Assistant.git

cd TTS-Voice-Assistant
```

**2. Install dependencies for both environments:**
```bash
cd client && npm install

cd ../server && npm install
```

**3. Set up your Environment Variables:**
* Create a `.env` file in the `client` directory based on `client/.env.example`.
* Create a `.env` file in the `server` directory based on `server/.env.example`.
* You will need free API keys from [Clerk](https://clerk.com), [Gemini](https://aistudio.google.com/), [ElevenLabs](https://elevenlabs.io/), and [Tavily](https://tavily.com/).


**4. Start the development servers:**

*Open two terminal windows. One for **Frontend(client)** and one for **Backend(server)***

**Terminal 1: Start the Express backend**
```bash
cd server  
npm run start
```

**Terminal 2: Start the React frontend**
```bash
cd client  
npm run dev
```
