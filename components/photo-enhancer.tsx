"use client"

import type React from "react"

import { useState } from "react"
import { Upload, Sparkles, Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function PhotoEnhancer() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>("")
  const [enhancedImage, setEnhancedImage] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string>("")
  const [productDescription, setProductDescription] = useState<string>("")

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file")
      return
    }

    setSelectedFile(file)
    setError("")
    setEnhancedImage("")

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleEnhance = async () => {
    if (!selectedFile) return

    setIsProcessing(true)
    setError("")

    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64Image = e.target?.result as string

        const response = await fetch("/api/enhance-photo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: base64Image,
            productDescription: productDescription || "product",
          }),

        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Failed to enhance image")
        }

        const data = await response.json()
        setEnhancedImage(data.enhancedImage)
      }

      reader.readAsDataURL(selectedFile)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!enhancedImage) return

    const link = document.createElement("a")
    link.href = enhancedImage
    link.download = "enhanced-product-photo.png"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleProgress = (progress: number = 0) => {
    return (
      <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Processing your image...</p>
            <p className="text-xs text-muted-foreground">This may take a few moments</p>
          </div>
          <span className="text-sm font-semibold text-primary">{Math.round(progress)}%</span>
        </div>
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <Card className="border-2 border-dashed bg-card p-8">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Upload className="h-8 w-8 text-primary" />
          </div>

          <div className="text-center">
            <h3 className="mb-2 font-semibold text-card-foreground">Upload Your Product Photo</h3>
            <p className="text-sm text-muted-foreground">Supports JPG, PNG, WEBP up to 10MB</p>
          </div>

          <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" id="file-upload" />
          <label htmlFor="file-upload">
            <Button asChild>
              <span>Choose File</span>
            </Button>
          </label>

          {selectedFile && <p className="text-sm text-muted-foreground">Selected: {selectedFile.name}</p>}
        </div>
      </Card>

      {previewUrl && (
        <div className="space-y-4">
          <div>
            <label htmlFor="description" className="mb-2 block text-sm font-medium text-foreground">
              Product Description (Optional)
            </label>
            <input
              id="description"
              type="text"
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              placeholder="e.g., sneaker, watch, perfume bottle"
              className="w-full rounded-md border border-input bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h3 className="mb-4 text-lg font-semibold text-foreground">Original Photo</h3>
              <Card className="overflow-hidden bg-muted p-4">
                <img
                  src={previewUrl || "/placeholder.svg"}
                  alt="Original"
                  className="h-auto w-full rounded-md object-contain"
                />
              </Card>
            </div>

            <div>
              <h3 className="mb-4 text-lg font-semibold text-foreground">Enhanced Photo</h3>
              <Card className="overflow-hidden bg-white p-4">
                {enhancedImage ? (
                  <img
                    src={enhancedImage || "/placeholder.svg"}
                    alt="Enhanced"
                    className="h-auto w-full rounded-md object-contain"
                  />
                ) : (
                  <div className="flex min-h-[300px] items-center justify-center rounded-md bg-muted">
                    <p className="text-sm text-muted-foreground">Enhanced photo will appear here</p>
                  </div>
                )}
              </Card>
            </div>
          </div>

          {error && <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}

          <div className="flex justify-center gap-4">
            <Button onClick={handleEnhance} disabled={isProcessing} size="lg" className="gap-2">
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Enhance Photo
                </>
              )}
            </Button>

            {enhancedImage && (
              <Button onClick={handleDownload} size="lg" variant="secondary" className="gap-2">
                <Download className="h-5 w-5" />
                Download
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
