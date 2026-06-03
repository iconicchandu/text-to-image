import { TextEditor } from "@/components/text-editor"

export default function Home() {
  return (
    <main className="h-screen bg-transparent overflow-hidden flex flex-col transition-colors duration-300">
      <div className="flex flex-col flex-1 max-w-7xl w-full mx-auto px-4 py-4 overflow-hidden gap-4">
        <div className="flex items-center justify-between border-b border-zinc-200/50 pb-3 shrink-0">
          <div>
            <h1 className="text-xl font-extrabold text-zinc-900 tracking-tight flex items-center gap-2">
              <span>Text to Image</span>
              <span className="text-[10px] font-semibold bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded-full uppercase tracking-wider">Editor</span>
            </h1>
            <p className="text-zinc-500 text-xs hidden sm:block">
              Convert styled text paragraphs into instant high-resolution PNG images.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-4 text-[11px] text-zinc-500 font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-zinc-100 text-zinc-600 flex items-center justify-center text-[10px] font-bold">1</span>
              <span>Format selection</span>
            </div>
            <span className="text-zinc-300">•</span>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-zinc-100 text-zinc-600 flex items-center justify-center text-[10px] font-bold">2</span>
              <span>Preview</span>
            </div>
            <span className="text-zinc-300">•</span>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-zinc-100 text-zinc-600 flex items-center justify-center text-[10px] font-bold">3</span>
              <span>Download PNG</span>
            </div>
          </div>
        </div>
        <TextEditor />
      </div>
    </main>
  )
}
