// server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors"; 
import { GoogleGenAI } from "@google/genai";

dotenv.config({ debug: true });

console.log("GEMINI_API_KEY:", process.env.GEMINI_API_KEY);

const app = express();

app.use(cors()); //ALLOW REQUESTS FROM EXPO / MOBILE
app.use(express.json());

// Create client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.post("/ask", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt is required" });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
    });

    const textFromResponse =
      (typeof response.text === "function" && response.text()) ||
      response?.response?.text?.() ||
      response?.candidates?.[0]?.content?.parts?.[0]?.text ||
      null;

    if (!textFromResponse) {
      console.log("Full raw response:", JSON.stringify(response, null, 2));
      return res.json({ reply: "No response text (see server logs)" });
    }

    console.log("Gemini reply:", textFromResponse);
    res.json({ reply: textFromResponse });
  } catch (err) {
    console.error("Gemini API Error:", err);
    res.status(500).json({ error: "Something went wrong." });
  }
});

//  BIND TO 0.0.0.0 FOR EXPO ACCESS
const PORT = 3000;
app.listen(PORT, "0.0.0.0", () =>
   console.log(` Server running: http://0.0.0.0:${PORT}`)
);
