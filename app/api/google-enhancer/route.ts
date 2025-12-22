import { generateText } from "ai"

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

    // Generate enhanced product photo using AI
    const result = await generateText({
      model: "google/gemini-3-pro-image-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Create a professional studio product shot based on this image. Requirements:
- Isolate the ${productDescription} on a seamless, solid stark white background (#FFFFFF)
- Apply even, bright softbox lighting to eliminate harsh shadows
- Ensure high contrast and sharp focus on textures and materials
- 8K ultra-high definition quality
- Clean and commercial aesthetic suitable for e-commerce
- The product should be centered and well-composed
- No watermarks or text overlays`,
            },
            {
              type: "file",
              data: base64Data,
              mediaType: mediaType,
            },
          ],
        },
      ],
    })

    // Extract the generated image
    const generatedImages = result.files.filter((file) => file.mediaType.startsWith("image/"))

    if (generatedImages.length === 0) {
      return Response.json({ error: "No image was generated" }, { status: 500 })
    }

    const enhancedImage = generatedImages[0]

    return Response.json({
      enhancedImage: `data:${enhancedImage.mediaType};base64,${enhancedImage.base64}`,
      usage: result.usage,
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
