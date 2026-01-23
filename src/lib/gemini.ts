import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set in environment variables.");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

export async function getGeminiModel() {
    return genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" }); // Using a fast, capable model
}

export async function generateText(prompt: string) {
    if (!apiKey) return "Error: Gemini API Key not configured.";

    try {
        const model = await getGeminiModel();
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Gemini Generation Error:", error);
        return "Error generating content.";
    }
}
