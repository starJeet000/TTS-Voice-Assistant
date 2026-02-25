// speak.js
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import fs from "fs";
import path from "path";
import 'dotenv/config';   

const client = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY
});

// Create the responses directory if it doesn't exist
const responsesDir = path.join(process.cwd(), "responses");
if (!fs.existsSync(responsesDir)) {
  fs.mkdirSync(responsesDir);
}

export async function speakText(text) {
  try {
    console.log(`Generating audio for: "${text}"...`);
    
    const audioStream = await client.textToSpeech.convert("JBFqnCBsd6RMkjVDRZzb", {
      output_format: "mp3_44100_128",
      text: text,
      model_id: "eleven_multilingual_v2"
    });

    const fileName = `response_${Date.now()}.mp3`;
    // Save the file INSIDE the responses folder
    const filePath = path.join(responsesDir, fileName);
    const filestream = fs.createWriteStream(filePath);

    for await (const chunk of audioStream) {
      filestream.write(chunk);
    }
    filestream.end();

    return new Promise((resolve, reject) => {
      filestream.on("finish", () => {
        console.log(`Audio saved to responses/${fileName}`);
        resolve(fileName); // Still return just the filename for the frontend
      });
      filestream.on("error", reject);
    });
  } catch (error) {
    console.error("Error generating speech:", error);
  }
}
