import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import type{ Transaction, Product } from "../types";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

const MODEL_NAME = 'gemini-2.5-flash';

export const analyzeBusinessHealth = async (
  transactions: Transaction[],
  products: Product[]
): Promise<string> => {
  try {
    const sales = transactions.filter(t => t.type === 'Sale');
    const expenses = transactions.filter(t => t.type === 'Expense');
    const totalRevenue = sales.reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const lowStockItems = products.filter(p => p.stock <= p.minStockLevel).map(p => p.name).join(', ');

    const prompt = `
      Act as a senior retail business analyst. Analyze the following summary data for "RetailPilot Store".
      
      Data Summary:
      - Total Revenue (Current Period): $${totalRevenue}
      - Total Expenses: $${totalExpenses}
      - Net Profit: $${totalRevenue - totalExpenses}
      - Sales Count: ${sales.length}
      - Critical Low Stock Items: ${lowStockItems || 'None'}

      Provide a concise, 3-bullet point executive summary of the business health. 
      Focus on actionable advice regarding cashflow and inventory. 
      Keep it professional and encouraging.
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return response.text || "Unable to generate insights at this time.";
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return "AI Insights are currently unavailable. Please check your network or API key.";
  }
};

export const parseReceiptImage = async (base64Image: string): Promise<{ merchant: string; date: string; total: number; items: string[] }> => {
  try {
    const prompt = `
      Analyze this receipt image. Extract the following information in JSON format:
      1. Merchant Name
      2. Date (YYYY-MM-DD format if possible, otherwise as appears)
      3. Total Amount (number only)
      4. List of main items purchased (array of strings)

      Return strictly JSON.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg', // Assuming jpeg for simplicity in this demo, usually should match input
              data: base64Image
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            merchant: { type: Type.STRING },
            date: { type: Type.STRING },
            total: { type: Type.NUMBER },
            items: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini OCR Error:", error);
    throw error;
  }
};