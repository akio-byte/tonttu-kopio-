
import { GoogleGenAI } from "@google/genai";
import { ElfStyle, GroupType, UpscaleLevel } from "../types";

export async function upscalePortrait(base64Image: string, style: ElfStyle, level: UpscaleLevel): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    UPSCALING TASK: Take this generated elven portrait and enhance it to ultra-high resolution (${level}).
    
    INSTRUCTIONS:
    1. Maintain all core facial features and identities perfectly.
    2. Enhance fine details: skin texture, fabric weave of the elven attire, individual strands of hair/fur, and the clarity of the eyes.
    3. Sharpen the magical elements: make the crystalline snowflakes more defined and the Aurora Borealis glow more luminous.
    4. Remove any subtle artifacts and produce a masterpiece suitable for large-format professional printing.
    5. The final output must be breathtakingly sharp and cinematic.
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
  
  let styleSpecifics = "";
  switch(style) {
    case 'frost':
      styleSpecifics = "STYLE: Frost and Ice. Attire is shimmering silver and icy blue velvet with crystal ornaments. Background features heavy frost, glowing ice sculptures, and a brilliant white/blue Aurora Borealis. The mood is cool and ethereal.";
      break;
    case 'forest':
      styleSpecifics = "STYLE: Woodland and Earthy. Attire is deep moss green and earthy brown wool with pinecone and leaf embroidery. Background is a thick evergreen forest with soft snow and mystical forest fireflies. The mood is natural and cozy.";
      break;
    case 'royal':
      styleSpecifics = "STYLE: Royal and Majestic. Attire is royal purple and gold with extravagant silk and silver thread. The elf hat features a large golden bell. Background is a grand, candle-lit wooden hall in Lapland with luxury decorations. The mood is noble and grand.";
      break;
    case 'classic':
    default:
      styleSpecifics = "STYLE: Classic Nordic. Attire is deep burgundy velvet with silver fur trim and a traditional tall red hat. Background is a snow-laden ancient forest at twilight with warm lanterns. The mood is traditional and heartwarming.";
      break;
  }

  const groupInstruction = groupType === 'group' 
    ? "TRANSFORM ALL PEOPLE: There are multiple people in this tourist photo. You MUST transform EVERY SINGLE PERSON into an elf. Each person should have their own unique, high-quality elven costume and hat while keeping their original facial identity perfectly recognizable. Treat this as a festive family/group vacation portrait in Lapland."
    : "TRANSFORM THE INDIVIDUAL: Transform the person in this photo into a legendary elf. Maintain their identity perfectly.";

  const prompt = `
    Create a breathtaking, ultra-high-definition cinematic portrait from the mystical heart of Lapland.
    
    ${styleSpecifics}

    ${groupInstruction}

    CORE REQUIREMENTS:
    1. IDENTITY PRESERVATION: For every person in the image, the face must be rendered with perfect clarity and 1:1 likeness. They should look exactly like themselves, but transformed into ethereal elven beings. Maintain facial structure, eyes, and expressions with sharp focus.
    
    2. THE TONTTU AESTHETIC: 
       - ELVEN FEATURES: Elegant, slightly pointed ears with fine detail. 
       - TEXTURE: Visible fabric weave, frost on the eyelashes, and subtle rosy cheeks as if touched by the Arctic cold.
    
    3. MAGICAL LIGHTING & ATMOSPHERE:
       - LIGHTING: Soft Rembrandt lighting on the face(s), complemented by a vibrant magical rim light from the Aurora Borealis. Ethereal golden hour glow.
       - MAGIC EFFECTS: Shimmering air, tiny floating crystalline snowflakes, and a subtle "sparkle" in the eyes that reflects festive lanterns.
       - TOURISM CONTEXT: This should feel like the ultimate, high-end souvenir photo from a magical trip to Rovaniemi, Lapland.
    
    4. TECHNICAL EXCELLENCE:
       - QUALITY: 8k resolution, photorealistic fantasy style, cinematic bokeh, sharp textures.
       - RESTRICTIONS: NO cartoonish proportions, NO blurry faces, NO generic AI look. It must look like a high-budget holiday movie poster.
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
