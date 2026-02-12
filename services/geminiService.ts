
import { GoogleGenAI } from "@google/genai";
import { ElfStyle, GroupType, UpscaleLevel } from "../types";

const STYLE_ANCHORS: Record<ElfStyle, string> = {
  classic: `Traditional Lapland Christmas portrait. Deep red velvet elf coat with subtle gold trim, warm fur accents, knitted details. Background: softly lit wooden cabin interior or gentle snowy forest bokeh. Warm, cozy, cinematic winter lighting.`,
  frost: `Arctic frost elf portrait. Icy-blue and white winter clothing with fur trim, subtle aurora glow accents. Background: snowy landscape with soft northern lights bokeh. Cool, crisp lighting but natural skin tones.`,
  forest: `Northern forest elf portrait. Earthy greens and dark reds, wool and leather textures, pine and snow elements. Background: spruce forest, soft snowfall, warm lantern bokeh. Natural, storybook realism.`,
  royal: `Festive royal elf portrait. Elegant deep red / burgundy attire, refined gold embroidery, luxurious fur trim. Background: subtle winter palace / grand cabin vibe with soft candlelight bokeh. Premium portrait look, but still realistic.`
};

/**
 * Common instructions for health and beautification to ensure consistent "healthy" look.
 */
const HEALTH_RULES = `
  BEAUTIFICATION & RADIANCE (CRITICAL):
  - The person must look exceptionally healthy, rested, and vibrant.
  - Remove all dark circles under the eyes completely.
  - Softly smooth out deep wrinkles, frown lines, and skin imperfections while keeping natural skin pores visible (no waxy/plastic look).
  - Even out skin tone for a clear, glowing complexion.
  - Eyes should be bright, clear, and sharp.
  - The transformation should look like the person spent a month resting in the pure Arctic air.
`;

export async function upscalePortrait(base64Image: string, style: ElfStyle, level: UpscaleLevel): Promise<string> {
  if (!process.env.API_KEY) throw new Error("API_KEY is missing");
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const styleAnchor = STYLE_ANCHORS[style];

  const prompt = `
    TASK: Enhance and upscale the provided generated portrait to ${level} resolution.
    
    IDENTITY PRESERVATION:
    - You MUST maintain the person's identity 100%. No changes to facial structure, bone structure, or ethnic features.
    - Keep the same pose and expression.
    
    ${HEALTH_RULES}

    QUALITY ENHANCEMENT:
    - Sharpen facial features (lashes, iris, eyebrows) naturally.
    - Remove compression artifacts, noise, and color banding.
    - Ensure lighting consistency across the face.

    STYLE LOCK:
    ${styleAnchor}

    NEGATIVE CONSTRAINTS:
    - No text, no watermarks, no logos, no UI elements.
    - No plastic/waxy skin. No "AI dream" artifacts.
    - No extra limbs or duplicated features.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image.split(',')[1],
              mimeType: 'image/png',
            },
          },
          { text: prompt },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "3:4",
          imageSize: level
        }
      }
    });

    const imageUrl = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;

    if (!imageUrl) {
      throw new Error("Magic failed to manifest the image.");
    }

    return `data:image/png;base64,${imageUrl}`;
  } catch (error: any) {
    console.error("Upscaling service error:", error);
    throw error;
  }
}

export async function transformToElf(base64Image: string, style: ElfStyle = 'classic', groupType: GroupType = 'single'): Promise<string> {
  if (!process.env.API_KEY) throw new Error("API_KEY is missing");
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const styleAnchor = STYLE_ANCHORS[style];

  const prompt = `
    TASK: Transform the person(s) in the photo into realistic Lapland Christmas elves.
    
    IDENTITY RULES:
    - Preserve face identity exactly. The person must be recognizable to their family.
    - Keep age, gender, and basic facial structure unchanged.
    
    ${HEALTH_RULES}

    STYLE SPECIFICATIONS:
    - Replace clothing with high-quality elven attire: ${styleAnchor}
    - Keep proportions realistic. This is a high-end photograph, not an illustration.

    COMPOSITION:
    - Use a 3:4 portrait aspect ratio.
    - ${groupType === 'group' ? 'Transform every single person in the group coherently.' : 'Focus on the main subject.'}

    NEGATIVE CONSTRAINTS:
    - No cartoonish features, no pointy ears (unless subtle and realistic).
    - No text, no symbols, no logos, no extra fingers.
    - No face swapping or identity drift.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image.split(',')[1],
              mimeType: 'image/png',
            },
          },
          { text: prompt },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "3:4",
          imageSize: "1K"
        }
      }
    });

    const imageUrl = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;

    if (!imageUrl) {
      throw new Error("Tontun taika ei tuottanut kuvaa. Tarkista API-avaimen oikeudet.");
    }

    return `data:image/png;base64,${imageUrl}`;
  } catch (error: any) {
    console.error("Transformation service error:", error);
    throw error;
  }
}
