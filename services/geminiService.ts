
import { GoogleGenAI } from "@google/genai";
import { ElfStyle, GroupType, UpscaleLevel } from "../types";

const STYLE_ANCHORS: Record<ElfStyle, string> = {
  classic: `Traditional Lapland Christmas portrait. Deep red velvet elf coat with subtle gold trim, warm fur accents, knitted details. Background: softly lit wooden cabin interior or gentle snowy forest bokeh. Warm, cozy, cinematic winter lighting.`,
  frost: `Arctic frost elf portrait. Icy-blue and white winter clothing with fur trim, subtle aurora glow accents. Background: snowy landscape with soft northern lights bokeh. Cool, crisp lighting but natural skin tones.`,
  forest: `Northern forest elf portrait. Earthy greens and dark reds, wool and leather textures, pine and snow elements. Background: spruce forest, soft snowfall, warm lantern bokeh. Natural, storybook realism.`,
  royal: `Festive royal elf portrait. Elegant deep red / burgundy attire, refined gold embroidery, luxurious fur trim. Background: subtle winter palace / grand cabin vibe with soft candlelight bokeh. Premium portrait look, but still realistic.`
};

export async function upscalePortrait(base64Image: string, style: ElfStyle, level: UpscaleLevel): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const styleAnchor = STYLE_ANCHORS[style];

  const prompt = `
    TASK: Enhance and upscale the provided generated portrait while preserving identity and the chosen style.

    CRITICAL PRESERVATION:
    - Preserve face identity exactly. Do NOT alter facial structure, age, gender, or skin tone.
    - Improve sharpness and clarity naturally (eyes, eyelashes, eyebrows, hair edges).
    - Remove artifacts: banding, noise blobs, smudges, warped areas.
    - Keep the same clothing and style direction.

    BEAUTIFICATION & HEALTH:
    - Ensure skin looks healthy, radiant, and well-rested. 
    - Diminish dark circles under eyes and softly smooth out excessive wrinkles without making the face look waxy or "plastic".
    - The person should look vibrant and healthy while remaining 100% recognizable.

    STYLE LOCK:
    ${styleAnchor}

    NEGATIVE CONSTRAINTS:
    - No changes to face proportions or expression.
    - No new text, no watermark, no logos.
    - No plastic skin, no over-smoothing, no heavy beauty filters.
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

    let imageUrl = '';
    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!imageUrl) {
      throw new Error("Upscaling magic failed to produce an image.");
    }

    return imageUrl;
  } catch (error: any) {
    console.error("Upscaling failed:", error);
    throw error;
  }
}

export async function transformToElf(base64Image: string, style: ElfStyle = 'classic', groupType: GroupType = 'single'): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const styleAnchor = STYLE_ANCHORS[style];

  let prompt = "";

  if (groupType === 'group') {
    prompt = `
      TASK: Transform ALL people in the provided group photo into realistic Lapland Christmas elves.

      IDENTITY & FACE (CRITICAL):
      - Preserve each person’s face identity exactly.
      - Keep faces natural, correctly proportioned, and clearly visible.
      - Use the same elf style for everyone.

      BEAUTIFICATION & HEALTH:
      - Improve skin appearance to look healthy and radiant.
      - Diminish dark circles under eyes and softly smooth wrinkles on all faces.
      - People should look like refreshed, vibrant versions of themselves.

      STYLE:
      ${styleAnchor}

      BACKGROUND CONTROL:
      - Simple winter background consistent with the style, not distracting.

      NEGATIVE CONSTRAINTS:
      - No text, no symbols, no logos.
      - No extra faces, no missing faces.
      - No extra limbs, no cartoon style.
    `;
  } else {
    prompt = `
      TASK: Transform the person in the image into a realistic Lapland Christmas elf.

      IDENTITY & FACE (CRITICAL):
      - Preserve face identity exactly (same facial structure, age, gender, skin tone).
      - Portrait framing (head-and-shoulders or waist-up).

      BEAUTIFICATION & HEALTH:
      - Improve the person's appearance to look very healthy and radiant.
      - Diminish dark circles under the eyes and softly smooth out deep wrinkles and skin imperfections.
      - The result should be a vibrant, healthy-looking elf version of the original person.

      STYLE:
      ${styleAnchor}

      NEGATIVE CONSTRAINTS (ABSOLUTE):
      - No text, no symbols, no logos, no watermarks.
      - No extra faces, no extra limbs.
      - No cartoon, no anime, no illustration, no plastic skin.
    `;
  }

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

    let imageUrl = '';
    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!imageUrl) {
      throw new Error("Tontun taika ei tuottanut kuvaa. Tarkista API-avaimen oikeudet.");
    }

    return imageUrl;
  } catch (error: any) {
    console.error("Magic failed:", error);
    throw error;
  }
}
