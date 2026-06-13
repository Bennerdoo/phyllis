import { GoogleGenerativeAI, Schema } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set in environment variables.");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

export async function getGeminiModel(systemInstruction?: string) {
    return genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
        systemInstruction
    }); // Using stable, fast model
}

export async function generateText(prompt: string, systemInstruction?: string, temperature?: number) {
    if (!apiKey) return "Error: Gemini API Key not configured.";

    try {
        const model = await getGeminiModel(systemInstruction);
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: temperature !== undefined ? temperature : 0.7,
            }
        });
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Gemini Generation Error:", error);
        return "Error generating content.";
    }
}

export async function generateStructuredJSON(
    prompt: string,
    schema: Schema,
    systemInstruction?: string,
    temperature?: number
): Promise<any> {
    if (!apiKey) throw new Error("Gemini API Key not configured.");

    try {
        const model = await getGeminiModel(systemInstruction);
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: schema,
                temperature: temperature !== undefined ? temperature : 0.1,
            }
        });
        const response = await result.response;
        const text = response.text();
        return JSON.parse(text);
    } catch (error) {
        console.error("Gemini Structured Generation Error:", error);
        throw error;
    }
}

