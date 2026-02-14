
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getLocationInsights(lat: number, lng: number, colony: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Proporciona información breve y relevante sobre la zona de ${colony} en Ixtapaluca, Estado de México (ubicación aproximada ${lat}, ${lng}). Menciona puntos de referencia importantes, hospitales cercanos, escuelas o zonas comerciales que un oficial de policía debería conocer al realizar un operativo en esta ubicación.`,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: lat,
              longitude: lng
            }
          }
        }
      },
    });

    return {
      text: response.text,
      grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks
    };
  } catch (error) {
    console.error("Error fetching location insights:", error);
    return null;
  }
}
