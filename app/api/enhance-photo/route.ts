import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import OpenAI from "openai"

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const { image, productDescription } = await req.json()

    if (!image) {
      return Response.json({ error: "No image provided" }, { status: 400 })
    }

    // Extract base64 data and media type
    const base64Match = image.match(/^data:(.+);base64,(.+)$/)
    if (!base64Match) {
      return Response.json({ error: "Invalid image format" }, { status: 400 })
    }

    const mediaType = base64Match[1]
    const base64Data = base64Match[2]

    // Step 1: Use GPT-4o Vision to analyze the image and create a detailed prompt
    const analysisResult = await generateText({
      model: openai("gpt-4o-mini"),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              image: `data:${mediaType};base64,${base64Data}`,
            },
            {
              type: "text",
              text: `You are a professional product photography expert. Analyze this product image carefully and create a highly detailed, precise prompt for DALL-E 3.

CRITICAL REQUIREMENT: The product itself must appear EXACTLY as shown in the reference image. Only the BACKGROUND should be changed. Do NOT alter, modify, or recreate the product - preserve it identically.

Product Information: ${productDescription || "Analyze the product from the image"}

ANALYSIS TASK:
1. Examine the product in detail:
   - Exact colors, shades, and tones (be very specific)
   - Precise materials and surface textures
   - Exact shape, proportions, and dimensions
   - All visible features, buttons, labels, text, logos, branding
   - Current lighting on the product (preserve the product's appearance)
   - Any unique characteristics or details

2. Identify the current background:
   - Describe what needs to be replaced
   - Note any shadows or reflections that should be removed

OUTPUT PROMPT REQUIREMENTS:
Create a DALL-E 3 prompt that:
- Describes the product with EXTREME precision to match the reference image exactly
- Specifies "seamless pure white background (#FFFFFF), no shadows, no gradients, clean studio background"
- States "The product appears exactly as shown in the reference image"
- Includes "Professional product photography, e-commerce style"
- Emphasizes "Preserve all product details, colors, textures, and features exactly as shown"
- Specifies "Remove background only, keep product unchanged"
- Adds "High resolution, sharp focus, commercial photography quality"
- Includes "Centered composition, clean white background, no text overlays, no watermarks"

The prompt must ensure DALL-E 3 recreates the EXACT same product but with a clean white studio background. Be extremely specific about product details to ensure accuracy.`,
            },
          ],
        },
      ],
    })

    const detailedPrompt = analysisResult.text

    // Step 2: Use DALL-E 3 to generate the enhanced image using OpenAI SDK directly
    const openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const imageResponse = await openaiClient.images.generate({
      model: "dall-e-3",
      prompt: detailedPrompt,
      size: "1024x1024",
      quality: "hd",
      n: 1,
    })

    const imageData = imageResponse.data?.[0]
    if (!imageData?.url) {
      return Response.json({ error: "No image URL returned from DALL-E" }, { status: 500 })
    }

    // Convert the image URL to base64 for consistency with the frontend
    const imageFetchResponse = await fetch(imageData.url)
    const imageBuffer = await imageFetchResponse.arrayBuffer()
    const imageBase64 = Buffer.from(imageBuffer).toString("base64")

    // Extract usage information - AI SDK v5 uses a different structure
    const usage = analysisResult.usage
    const promptTokens = usage && "promptTokens" in usage ? (usage as any).promptTokens : 0
    const completionTokens = usage && "completionTokens" in usage ? (usage as any).completionTokens : 0

    return Response.json({
      enhancedImage: `data:image/png;base64,${imageBase64}`,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      },
    })
  } catch (error) {
    console.error("Error enhancing photo:", error)
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Failed to enhance photo",
      },
      { status: 500 },
    )
  }
}
