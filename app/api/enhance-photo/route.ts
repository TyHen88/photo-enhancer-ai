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
              text: `Analyze this product image and create a detailed, precise prompt for generating a professional studio product shot. 

The product is: ${productDescription || "a product"}

Requirements for the enhanced image:
- Isolate the product on a seamless, solid stark white background (#FFFFFF)
- Apply even, bright softbox lighting to eliminate harsh shadows
- Ensure high contrast and sharp focus on textures and materials
- 8K ultra-high definition quality
- Clean and commercial aesthetic suitable for e-commerce
- The product should be centered and well-composed
- No watermarks or text overlays

Describe the product in detail (colors, materials, textures, shape, size, key features) and create a comprehensive prompt that DALL-E 3 can use to generate the enhanced studio shot. Focus on the product's visual characteristics and how it should appear in the final image.`,
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
