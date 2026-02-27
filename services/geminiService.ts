
import { GoogleGenAI, Type, GenerateContentResponse, FunctionDeclaration, ThinkingLevel } from "@google/genai";
import { SalesData, AIProductSuggestion, BrandIdentity, Product } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const isAIConfigured = () => !!apiKey;

// ============================================================================
// 🚀 ADVANCED DEV UTILITIES (v0.2)
// These wrappers expose Gemini 3.1 Pro's most powerful features for developers.
// ============================================================================

/**
 * Advanced retry mechanism with exponential backoff.
 */
export async function retryOperation<T>(operation: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    const isRateLimit = error?.status === 429 || error?.code === 429 || error?.message?.includes('429') || error?.message?.includes('quota');
    if (retries > 0 && isRateLimit) {
        console.warn(`Quota exceeded/Rate limit. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return retryOperation(operation, retries - 1, delay * 2);
    }
    throw error;
  }
}

/**
 * Generates strictly typed structured data using Gemini 3.1 JSON Schema capabilities.
 * @template T The expected return type.
 */
export async function generateStructuredData<T>(
  prompt: string, 
  schema: any, 
  model = "gemini-3.1-pro-preview",
  systemInstruction?: string
): Promise<T | null> {
  if (!isAIConfigured()) return null;
  try {
    const response = await retryOperation<GenerateContentResponse>(() => ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema
      }
    }));
    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch (error) {
    console.error(`[Gemini Structured Data Error]:`, error);
    return null;
  }
}

/**
 * Advanced Agent Execution with Function Calling (Tools).
 * Allows the model to execute local functions to gather data before answering.
 */
export interface AgentTool {
  declaration: FunctionDeclaration;
  execute: (args: any) => Promise<any> | any;
}

export async function executeAgentTask(
  prompt: string,
  tools: AgentTool[],
  model = "gemini-3.1-pro-preview"
): Promise<string> {
    if (!isAIConfigured()) return "AI not configured.";
    
    try {
        const functionDeclarations = tools.map(t => t.declaration);
        
        // Initial call
        const response = await retryOperation(() => ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                tools: [{ functionDeclarations }]
            }
        }));

        // Check if the model wants to call a function
        if (response.functionCalls && response.functionCalls.length > 0) {
            const call = response.functionCalls[0];
            const tool = tools.find(t => t.declaration.name === call.name);
            
            if (tool) {
                // Execute the local function
                const result = await tool.execute(call.args);
                
                // Send the result back to the model
                const followUpPrompt = `
                    Original Request: ${prompt}
                    Tool Called: ${call.name}
                    Tool Result: ${JSON.stringify(result)}
                    
                    Based on the tool result, provide the final answer.
                `;
                
                const finalResponse = await retryOperation(() => ai.models.generateContent({
                    model,
                    contents: followUpPrompt
                }));
                
                return finalResponse.text || "Task completed with tools, but no text returned.";
            }
        }

        return response.text || "No response generated.";
    } catch (error) {
        console.error("[Gemini Agent Error]:", error);
        return "Agent encountered an error.";
    }
}

/**
 * Executes a complex reasoning task using Gemini 3.1 Pro's Thinking Level.
 * Ideal for deep analysis, coding, or complex math.
 */
export async function executeComplexReasoning(prompt: string): Promise<string> {
    if (!isAIConfigured()) return "AI not configured.";
    try {
        const response = await retryOperation(() => ai.models.generateContent({
            model: "gemini-3.1-pro-preview",
            contents: prompt,
            config: {
                thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
            }
        }));
        return response.text || "";
    } catch (error) {
        console.error("[Gemini Reasoning Error]:", error);
        return "Reasoning failed.";
    }
}

/**
 * Streams content back for real-time UI updates.
 */
export async function* streamContent(prompt: string, model = "gemini-3.1-pro-preview") {
    if (!isAIConfigured()) return;
    try {
        const responseStream = await ai.models.generateContentStream({
            model,
            contents: prompt
        });
        for await (const chunk of responseStream) {
            yield chunk.text;
        }
    } catch (error) {
        console.error("[Gemini Stream Error]:", error);
    }
}

// ============================================================================
// 🛍️ REFACTORED APP FEATURES (Using the new v0.2 Dev Utilities)
// ============================================================================

export const generateProductDetails = async (productName: string, category: string): Promise<AIProductSuggestion | null> => {
  const prompt = `Act as an e-commerce expert. Generate a compelling product description, a suggested price (USD), relevant tags, and a short marketing hook for a product named "${productName}" in the category "${category}". Keep the description under 80 words.`;
  
  const schema = {
    type: Type.OBJECT,
    properties: {
      description: { type: Type.STRING },
      price: { type: Type.NUMBER },
      tags: { type: Type.ARRAY, items: { type: Type.STRING } },
      marketingHook: { type: Type.STRING }
    },
    required: ["description", "price", "tags", "marketingHook"]
  };

  return generateStructuredData<AIProductSuggestion>(prompt, schema, "gemini-3.1-pro-preview");
};

export const generateBrandStrategy = async (storeName: string, category: string): Promise<Partial<BrandIdentity> | null> => {
  const prompt = `Act as a world-class Brand Strategist. Create a brand identity for an online store named "${storeName}" in the "${category}" industry. Provide a Mission Statement, a Vision Statement, 3 Core Values, and a Tone of Voice description.`;
  
  const schema = {
    type: Type.OBJECT,
    properties: {
      mission: { type: Type.STRING },
      vision: { type: Type.STRING },
      values: { type: Type.ARRAY, items: { type: Type.STRING } },
      toneOfVoice: { type: Type.STRING }
    },
    required: ["mission", "vision", "values", "toneOfVoice"]
  };

  return generateStructuredData<Partial<BrandIdentity>>(prompt, schema, "gemini-3.1-pro-preview");
};

export const analyzeSalesData = async (data: SalesData[]): Promise<string> => {
  if (!isAIConfigured()) return "AI Configuration missing. Please set API_KEY.";
  const dataStr = JSON.stringify(data.slice(-7)); 
  const prompt = `
    Analyze the following sales data for the last 7 days of an online store:
    ${dataStr}
    
    Provide a concise summary (max 3 sentences) of the trend and 2 actionable tips to improve sales next week.
    Format the output as simple text, not Markdown.
  `;
  
  // Using complex reasoning for data analysis
  return executeComplexReasoning(prompt);
};

export const generateStoreConcept = async (topic: string): Promise<string | null> => {
  if (!isAIConfigured()) return "Please set API_KEY to use AI features.";
  try {
    const response = await retryOperation<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `Generate a catchy store tagline and a one-sentence visual theme description for an online store that sells: ${topic}. Return in format: "Tagline: [tagline] | Theme: [description]"`,
    }));
    return response.text || "Could not generate concept.";
  } catch (error: any) {
    console.error("Gemini Concept Gen Error:", error);
    return "Error generating concept.";
  }
};

// --- Arena / Betting Feature ---

export interface DuelScenario {
    productName: string;
    productContext: string;
    optionA: string;
    optionB: string;
    winner: 'A' | 'B';
    reason: string;
    odds: number;
}

export const generateDuelScenario = async (category: string): Promise<DuelScenario | null> => {
    const prompt = `
        Act as a master marketing psychologist.
        1. Invent a hypothetical e-commerce product in the "${category}" niche.
        2. Create two different marketing headlines (Subject Lines or Ad Hooks) for this product.
           - One should be "Good/Standard".
           - One should be "Excellent/High-Converting" based on principles like urgency, social proof, or emotional hook.
        3. Determine which one is better (The Winner).
        4. Explain WHY it is better in one concise sentence.
        5. Assign "Odds" (multiplier) between 1.5 and 2.5 based on how obvious the win is (Higher odds = harder to guess).
    `;

    const schema = {
        type: Type.OBJECT,
        properties: {
            productName: { type: Type.STRING },
            productContext: { type: Type.STRING, description: "Short description of what the product is" },
            optionA: { type: Type.STRING },
            optionB: { type: Type.STRING },
            winner: { type: Type.STRING, enum: ["A", "B"] },
            reason: { type: Type.STRING },
            odds: { type: Type.NUMBER }
        },
        required: ["productName", "productContext", "optionA", "optionB", "winner", "reason", "odds"]
    };

    return generateStructuredData<DuelScenario>(prompt, schema, "gemini-3.1-pro-preview");
};

// --- Brand Persona Simulator ---

export const chatWithBrandPersona = async (message: string, history: {role: string, text: string}[], identity: BrandIdentity, storeName: string): Promise<string> => {
    if (!isAIConfigured()) return "AI not configured.";

    try {
        const systemPrompt = `
            You are NOT an AI assistant. You ARE the physical embodiment of the brand "${storeName}".
            
            Your Brand Identity:
            - Mission: ${identity.mission}
            - Values: ${identity.values.join(", ")}
            - Tone of Voice: ${identity.toneOfVoice}
            
            Rules:
            1. Respond STRICTLY in the tone of voice defined above.
            2. If the tone is "witty", be witty. If "professional", be professional.
            3. Defend your brand values if challenged.
            4. Keep responses concise (under 50 words) unless asked for more.
            5. Do not break character.
        `;

        const chat = ai.chats.create({
            model: "gemini-3.1-pro-preview",
            config: { systemInstruction: systemPrompt }
        });
        
        const response = await retryOperation<GenerateContentResponse>(() => chat.sendMessage({
            message: message
        }));

        return response.text || "...";
    } catch (e) {
        console.error("Brand Chat Error", e);
        return "I'm having a bit of an identity crisis right now. Try again.";
    }
};

// --- Social Content Studio ---

export interface SocialPostContent {
    caption: string;
    hashtags: string[];
    visualDescription: string;
    estimatedReach: string;
    bestTime: string;
}

export const generateSocialPost = async (product: Product, platform: string, identity: BrandIdentity): Promise<SocialPostContent | null> => {
    const prompt = `
        Create a viral social media post for the platform "${platform}".
        
        Product: ${product.title} - ${product.description}
        Brand Tone: ${identity.toneOfVoice}
        
        Output JSON with:
        1. caption: High converting copy, include emojis.
        2. hashtags: 5 relevant tags.
        3. visualDescription: A short description of what the image/video should look like (e.g. "Close up shot with soft lighting").
        4. estimatedReach: A fictional estimate (e.g. "1.2k - 5k").
        5. bestTime: Best time to post today.
    `;

    const schema = {
        type: Type.OBJECT,
        properties: {
            caption: { type: Type.STRING },
            hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
            visualDescription: { type: Type.STRING },
            estimatedReach: { type: Type.STRING },
            bestTime: { type: Type.STRING }
        },
        required: ["caption", "hashtags", "visualDescription", "estimatedReach", "bestTime"]
    };

    return generateStructuredData<SocialPostContent>(prompt, schema, "gemini-3.1-pro-preview");
}

