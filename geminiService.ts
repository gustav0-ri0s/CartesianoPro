
import { GoogleGenAI } from "@google/genai";
import { RegressionResult } from "./types";

export const getAIExplanation = async (xAxis: string, yAxis: string, result: RegressionResult): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    Actúa como un profesor de matemáticas para estudiantes de secundaria.
    Analiza la relación entre "${xAxis}" (X) y "${yAxis}" (Y).
    
    Tipo de función: ${result.type}
    Ecuación: ${result.formula}
    Ajuste R²: ${result.rSquared.toFixed(4)}
    
    INSTRUCCIONES CRÍTICAS:
    1. Comienza tu respuesta EXACTAMENTE con la frase: "Se trata de una función ${result.type}..."
    2. Si la función es logarítmica y tiene una base visible (como log2 o log10), explica brevemente qué significa esa base (por ejemplo: "cada vez que X se duplica, Y aumenta en 1").
    3. Explica qué significa esta relación para las variables "${xAxis}" y "${yAxis}".
    4. Sé muy conciso. Máximo 70 palabras.
    5. Usa un lenguaje amigable y educativo. 
    6. No menciones términos técnicos de programación ni de "ajuste de curvas", enfócate en la relación matemática.

    Responde en español.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "No se pudo generar la interpretación.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return `Se trata de una función ${result.type}. Los datos muestran un comportamiento característico de este modelo con una confianza de ${result.rSquared.toFixed(2)}.`;
  }
};
