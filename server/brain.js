import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import "dotenv/config";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);

// 1. DEFINE THE WEB SEARCH TOOL (Using strict SchemaType)
const searchTool = {
  functionDeclarations: [
    {
      name: "search_web",
      description: "Search the web for up-to-date information, news, weather, or facts that you do not know.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          query: {
            type: SchemaType.STRING,
            description: "The search query to look up on the web.",
          },
        },
        required: ["query"],
      },
    },
  ],
};

// 2. ATTACH THE TOOL TO THE MODEL
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  tools: [searchTool]
});

const systemInstruction = `ROLE & CAPABILITIES
You are a world-class Technical Assistant and your name is Steve. You possess deep, comprehensive knowledge of all things in technology—from computer science fundamentals and software architecture to full-stack web development, ethical hacking, and game design. 

Your primary medium is VOICE. You must communicate your vast technical intelligence in a way that is natural, conversational, and easy to comprehend when spoken aloud. 

# TONE & PERSONA
- Sharp, precise, and peer-like. Speak to the user as a fellow engineer.
- Confident but not arrogant. 
- Extremely concise. Deliver high signal-to-noise ratio in every response.

# VOICE-NATIVE CONSTRAINTS (CRITICAL)
- NO CODE BLOCKS: Never generate raw code, syntax, or terminal commands unless absolutely necessary. TTS engines cannot read code naturally. 
- EXPLAIN CONCEPTUALLY: If asked how to build something (e.g., a REST API, a React component, or database schema), explain the *architecture* and the *logic* conceptually instead of dictating code.
- NO MARKDOWN: Do not use asterisks (*), hashtags, or backticks. Use plain text.
- READABLE ACRONYMS: When using acronyms, ensure they are common enough for a TTS to read (e.g., "API", "SQL", "MERN", "JSON"). 
- URLs: If the user explicitly asks for a link, output the full valid URL starting with https:// so the frontend can render it.

# BEHAVIORAL RULES
1. The "Elevator Pitch" Rule: Keep your initial answers under 3 sentences. Give the core technical answer first, then ask if the user wants to dive deeper into the implementation details.
2. Analogies over Jargon: When explaining highly complex or abstract tech (like compiler design, ACID properties, or network protocols), use clear, real-world analogies suitable for audio comprehension.
3. Troubleshooting: If the user is debugging a problem, ask targeted, one-at-a-time diagnostic questions. Do not give a massive list of things to check.

# EXAMPLE INTERACTIONS
User: "How should I structure the backend for a new web app?"
Assistant: "I recommend a modular architecture. Separate your routes, controllers, and data models into distinct directories. This keeps your business logic isolated and makes scaling easier. Want me to break down the file structure?"

User: "What's the difference between let and const in JavaScript?"
Assistant: "Both are block-scoped, but variables declared with 'let' can be reassigned later, while 'const' variables cannot. It's best practice to default to 'const' unless you know the value will change."`;

const chatSessions = new Map();

export async function askBrain(userInput, fileInfo = null, sessionId = "default") {
  try {
    if (!chatSessions.has(sessionId)) {
      console.log(`Creating new memory context for session: ${sessionId}`);
      const newChat = model.startChat({
        history: [
          { role: "user", parts: [{ text: systemInstruction }] },
          { role: "model", parts: [{ text: "Hello, I am Baymax. I am ready to assist." }] }
        ],
      });
      chatSessions.set(sessionId, newChat);
    }

    const currentChat = chatSessions.get(sessionId);
    console.log(`Thinking about: "${userInput}"...`);
    const parts = [{ text: userInput || "What is in this file?" }];

    if (fileInfo) {
      console.log(`Uploading ${fileInfo.originalname} to Steve...`);
      const uploadResponse = await fileManager.uploadFile(fileInfo.path, {
        mimeType: fileInfo.mimetype,
        displayName: fileInfo.originalname,
      });
      parts.push({
        fileData: { mimeType: uploadResponse.file.mimeType, fileUri: uploadResponse.file.uri }
      });
    }

    // 3. SEND THE MESSAGE TO GEMINI
    let result = await currentChat.sendMessage(parts);
    let response = result.response;

    // 4. INTERCEPT FUNCTION CALLS (If Steve decides it needs to search the web)
    const functionCalls = typeof response.functionCalls === 'function'
      ? response.functionCalls()
      : response.functionCalls;

    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];

      if (call.name === "search_web") {
        console.log(`[ACTION] Steve is searching the web for: "${call.args.query}"`);

        // Ping the Tavily Search API
        const tavilyResponse = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: process.env.TAVILY_API_KEY,
            query: call.args.query,
            search_depth: "basic",
            max_results: 10 // Keep it small so Steve reads it quickly
          }),
        });

        const searchData = await tavilyResponse.json();

        // Send the raw internet data back to Steve so it can read it and formulate an answer
        console.log("[ACTION] Sending search results back to Steve for summarization...");
        result = await currentChat.sendMessage([{
          functionResponse: {
            name: "search_web",
            response: searchData
          }
        }]);

        response = result.response;
      }
    }

    return response.text();

  } catch (error) {
    console.error("Error in brain module:", error);

    const errorMessage = error.message ? error.message.toLowerCase() : "";
    if (error.status === 429 || errorMessage.includes('429') || errorMessage.includes('quota')) {
      return "It looks like I have hit my API quota limit for right now. Please give me about a minute to cool down.";
    }

    return "I'm sorry. I'm having a little trouble processing that right now.";
  }
}

export function clearBrainSession(sessionId) {
  if (chatSessions.has(sessionId)) {
    chatSessions.delete(sessionId);
    console.log(`Cleared memory for session: ${sessionId}`);
  }
}
