import { GoogleGenAI } from "@google/genai";
import { AnalysisResponse, VisualStyle } from "../types";

// Helper to ensure we get a fresh client, potentially with a user-selected key
const getAiClient = async () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const checkApiKeySelection = async (): Promise<boolean> => {
  const win = window as any;
  if (win.aistudio && typeof win.aistudio.hasSelectedApiKey === 'function') {
    return await win.aistudio.hasSelectedApiKey();
  }
  return true; // Fallback if not running in the specific AI Studio environment wrapper
};

export const openApiKeySelection = async (): Promise<void> => {
  const win = window as any;
  if (win.aistudio && typeof win.aistudio.openSelectKey === 'function') {
    await win.aistudio.openSelectKey();
  }
};

export const analyzeVideoContent = async (
  videoUrl: string,
  style: VisualStyle,
  customStylePrompt?: string
): Promise<AnalysisResponse> => {
  const ai = await getAiClient();
  
  // Use gemini-3-pro-preview for complex reasoning, thinking, and better adherence to search grounding instructions
  const model = "gemini-3-pro-preview";

  let styleDescription = "";
  switch (style) {
    case VisualStyle.WHITEBOARD:
      styleDescription = "A clean, hand-drawn whiteboard style infographic. White background, black marker lines, simple doodles, red accent highlights. Professional yet playful educational drawing.";
      break;
    case VisualStyle.NOTEBOOK:
      styleDescription = "A sketch on lined notebook paper. Blue ballpoint pen aesthetic, scribbles, doodles, handwritten text annotations. Academic and messy but legible.";
      break;
    case VisualStyle.CUSTOM:
      styleDescription = customStylePrompt || "A creative data visualization.";
      break;
  }

  // Attempt to extract video ID to assist the search
  let videoId = "";
  try {
    if (videoUrl.includes("v=")) {
      videoId = videoUrl.split("v=")[1].split("&")[0];
    } else if (videoUrl.includes("youtu.be/")) {
      videoId = videoUrl.split("youtu.be/")[1].split("?")[0];
    }
  } catch (e) {
    // Ignore extraction errors
  }
  
  const searchHint = videoId ? `(Video ID: ${videoId})` : "";

  const prompt = `
    I need to create a visual summary for a YouTube video located at: ${videoUrl} ${searchHint}

    TASK:
    1. USE the 'googleSearch' tool to find specific information about this video.
       - Search for the specific Video ID "${videoId}".
       - Locate the video Title, Channel, and a textual summary or transcript.
    2. VERIFY: You must find content that specifically matches this Video ID. 
       - Do NOT hallucinate content based on keywords in the URL.
       - Do NOT provide generic advice. 
       - If you cannot find the specific video details (title + content), return an error.
    3. GENERATE:
       - Summarize the ACTUAL video content into 3 key bullet points.
       - Create a detailed image generation prompt adhering to this style: "${styleDescription}".
    
    Output Format (JSON Only):
    {
      "videoTitle": "The exact title of the video found",
      "summary": "1. [Key Point 1]\n2. [Key Point 2]\n3. [Key Point 3]",
      "imagePrompt": "The detailed image generation prompt..."
    }
    OR
    {
      "error": "Reason why video content could not be verified..."
    }

    Return ONLY valid JSON. No markdown formatting.
  `;

  const response = await ai.models.generateContent({
    model: model,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      // responseMimeType cannot be used with googleSearch
      systemInstruction: "You are an AI video analyst. Your primary goal is to accurately retrieve and visualize the specific content of YouTube videos given a URL. You must strictly verify that the content you find matches the specific video ID provided.",
      thinkingConfig: {
        thinkingBudget: 32768, // Max budget for gemini-3-pro-preview as requested for deep reasoning
      }
    },
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI analysis.");

  // Clean up potential markdown formatting from the response
  let jsonStr = text.trim();
  
  // Robust JSON extraction
  // 1. Try extracting from markdown code blocks first
  const markdownMatch = jsonStr.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (markdownMatch && markdownMatch[1]) {
    jsonStr = markdownMatch[1];
  } else {
    // 2. If no markdown blocks, look for the first '{' and last '}'
    const startIndex = jsonStr.indexOf('{');
    const endIndex = jsonStr.lastIndexOf('}');
    
    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      jsonStr = jsonStr.substring(startIndex, endIndex + 1);
    }
  }

  try {
    const data = JSON.parse(jsonStr);
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    // Ensure we have the expected fields
    if (!data.summary || !data.imagePrompt) {
       throw new Error("Incomplete analysis data received.");
    }

    return data as AnalysisResponse;
  } catch (e: any) {
    console.error("Failed to parse JSON", text);
    
    // Check for common natural language error responses from the model
    const lowerText = text.toLowerCase();
    if (
      lowerText.includes("unavailable") || 
      lowerText.includes("restricted") || 
      lowerText.includes("cannot access") || 
      lowerText.includes("unable to access") ||
      lowerText.includes("sorry")
    ) {
      throw new Error(text);
    }
    
    // If we threw a specific error above (data.error), rethrow it
    if (e.message && !e.message.includes("JSON")) {
       throw e;
    }

    throw new Error("AI analysis failed to produce valid data. The video might be inaccessible or the response format was invalid.");
  }
};

export const generateInfographic = async (imagePrompt: string): Promise<string> => {
  const ai = await getAiClient();
  
  // Using gemini-3-pro-image-preview for high quality output
  const model = "gemini-3-pro-image-preview";

  const response = await ai.models.generateContent({
    model: model,
    contents: {
      parts: [{ text: imagePrompt }],
    },
    config: {
      imageConfig: {
        aspectRatio: "16:9",
        imageSize: "2K", 
      },
    },
  });

  // Extract image
  if (response.candidates && response.candidates[0].content.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData && part.inlineData.data) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  }

  throw new Error("No image data found in response.");
};