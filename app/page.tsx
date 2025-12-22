import PhotoEnhancer from "@/components/photo-enhancer"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h1 className="mb-4 font-sans text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
            Studio Quality
            <br />
            <span className="text-balance">AI Product Photos</span>
          </h1>
          <p className="mx-auto max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
            Transform your product photos into professional studio shots with perfect lighting and seamless white
            backgrounds in seconds.
          </p>
        </div>

        <PhotoEnhancer />
      </div>
    </main>
  )
}
