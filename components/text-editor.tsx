"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Download,
  Palette,
  Minus,
  Plus,
} from "lucide-react"

const PRESET_COLORS = [
  { name: "Ink", value: "#09090b" },
  { name: "Slate", value: "#64748b" },
  { name: "Indigo", value: "#4f46e5" },
  { name: "Emerald", value: "#059669" },
  { name: "Crimson", value: "#dc2626" },
  { name: "Amber", value: "#d97706" }
]

export function TextEditor() {
  const [html, setHtml] = useState("")
  const [plainText, setPlainText] = useState("")
  const [title, setTitle] = useState("")
  const [activeStyles, setActiveStyles] = useState({
    bold: false,
    italic: false,
    underline: false,
    align: "left" as "left" | "center" | "right" | "justify",
    color: "#737373",
    fontSize: 11,
  })

  const editorRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Sync state values on input
  const handleInput = () => {
    if (editorRef.current) {
      setHtml(editorRef.current.innerHTML)
      setPlainText(editorRef.current.innerText || "")
    }
  }

  // Format selections using execCommand
  const toggleStyle = (property: "bold" | "italic" | "underline") => {
    if (editorRef.current && document.activeElement !== editorRef.current) {
      editorRef.current.focus()
    }
    document.execCommand(property, false)
    updateToolbarFromSelection()
    handleInput()
  }

  const setAlignment = (align: "left" | "center" | "right" | "justify") => {
    if (editorRef.current && document.activeElement !== editorRef.current) {
      editorRef.current.focus()
    }
    if (align === "left") document.execCommand("justifyLeft", false)
    else if (align === "center") document.execCommand("justifyCenter", false)
    else if (align === "right") document.execCommand("justifyRight", false)
    else if (align === "justify") document.execCommand("justifyFull", false)
    updateToolbarFromSelection()
    handleInput()
  }

  const changeColor = (color: string) => {
    if (editorRef.current && document.activeElement !== editorRef.current) {
      editorRef.current.focus()
    }
    document.execCommand("foreColor", false, color)
    updateToolbarFromSelection()
    handleInput()
  }

  const changeFontSize = (delta: number) => {
    if (editorRef.current && document.activeElement !== editorRef.current) {
      editorRef.current.focus()
    }
    const newSize = Math.max(8, Math.min(72, activeStyles.fontSize + delta))

    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0 && !selection.getRangeAt(0).collapsed) {
      const range = selection.getRangeAt(0)
      const span = document.createElement("span")
      span.style.fontSize = `${newSize}px`

      try {
        span.appendChild(range.extractContents())
        range.insertNode(span)

        // Reselect wrapped contents
        selection.removeAllRanges()
        const newRange = document.createRange()
        newRange.selectNodeContents(span)
        selection.addRange(newRange)
      } catch (e) {
        console.error(e)
      }
    }

    setActiveStyles(prev => ({ ...prev, fontSize: newSize }))
    handleInput()
  }

  // Update button active state from selection
  const updateToolbarFromSelection = useCallback(() => {
    if (typeof window === "undefined" || !editorRef.current) return

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const anchorNode = selection.anchorNode
    if (!anchorNode || !editorRef.current.contains(anchorNode)) return

    const bold = document.queryCommandState("bold")
    const italic = document.queryCommandState("italic")
    const underline = document.queryCommandState("underline")

    let align: "left" | "center" | "right" | "justify" = "left"
    if (document.queryCommandState("justifyCenter")) align = "center"
    else if (document.queryCommandState("justifyRight")) align = "right"
    else if (document.queryCommandState("justifyFull")) align = "justify"

    let color = "#737373"
    try {
      const queriedColor = document.queryCommandValue("foreColor")
      if (queriedColor) {
        color = queriedColor
      }
    } catch (e) { }

    let fontSize = 11
    try {
      let node = anchorNode.nodeType === Node.TEXT_NODE ? anchorNode.parentElement : anchorNode as HTMLElement
      if (node) {
        const computedStyle = window.getComputedStyle(node)
        fontSize = Math.round(parseFloat(computedStyle.fontSize))
      }
    } catch (e) { }

    setActiveStyles({
      bold,
      italic,
      underline,
      align,
      color,
      fontSize,
    })
  }, [])

  useEffect(() => {
    const handleSelectionChange = () => {
      updateToolbarFromSelection()
    }
    document.addEventListener("selectionchange", handleSelectionChange)
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange)
    }
  }, [updateToolbarFromSelection])

  // Download high-resolution PNG using SVG foreignObject to preserve all HTML/CSS styles
  const downloadAsPNG = useCallback(() => {
    const editor = editorRef.current
    if (!editor) return

    const htmlContent = editor.innerHTML
    if (!htmlContent || htmlContent.trim() === "" || htmlContent === "<br>") return

    const computed = window.getComputedStyle(editor)
    const paddingLeft = parseFloat(computed.paddingLeft || "0")
    const paddingRight = parseFloat(computed.paddingRight || "0")
    const paddingTop = parseFloat(computed.paddingTop || "0")
    const paddingBottom = parseFloat(computed.paddingBottom || "0")

    const exportWidth = Math.ceil(Math.max(1, (editor.clientWidth || 600) - paddingLeft - paddingRight))
    const exportHeight = Math.ceil(Math.max(1, (editor.scrollHeight || 400) - paddingTop - paddingBottom))
    const dpr = 3 // 3x output scale for premium high-resolution quality

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = exportWidth * dpr
    canvas.height = exportHeight * dpr
    canvas.style.width = `${exportWidth}px`
    canvas.style.height = `${exportHeight}px`

    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Clone the editor node to serialize safely as strict XML XHTML
    const clone = editor.cloneNode(true) as HTMLDivElement
    clone.removeAttribute("class")
    clone.removeAttribute("id")
    clone.removeAttribute("contenteditable")
    clone.removeAttribute("placeholder")
    clone.setAttribute("xmlns", "http://www.w3.org/1999/xhtml")

    // Set custom clean styling on cloned wrapper
    clone.style.cssText = "font-family: system-ui, -apple-system, sans-serif; font-size: 11px; color: #737373; line-height: 21px; word-wrap: break-word; white-space: pre-wrap; width: 100%; height: 100%; box-sizing: border-box; background: transparent; padding: 0; margin: 0;"

    // Inject style reset inside clone to force transparency on all elements and strip pasted backgrounds
    const styleEl = document.createElement("style")
    styleEl.textContent = "* { background: transparent !important; background-color: transparent !important; margin: 0; padding: 0; }"
    clone.insertBefore(styleEl, clone.firstChild)

    const serializer = new XMLSerializer()
    const xmlContent = serializer.serializeToString(clone)

    // Assemble the SVG with transparent background and no padding
    const svgString = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${exportWidth}" height="${exportHeight}">
        <foreignObject width="100%" height="100%">
          ${xmlContent}
        </foreignObject>
      </svg>
    `

    const img = new Image()
    img.crossOrigin = "anonymous"

    // Convert SVG string to base64 Data URL to prevent tainted canvas issue
    const base64Svg = window.btoa(unescape(encodeURIComponent(svgString)))
    const dataUrl = `data:image/svg+xml;base64,${base64Svg}`

    img.onload = () => {
      ctx.drawImage(img, 0, 0, exportWidth, exportHeight)

      try {
        // Read pixels to calculate precise text bounding box and crop extra space
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imgData.data
        let minX = canvas.width
        let minY = canvas.height
        let maxX = 0
        let maxY = 0
        let found = false

        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            const alpha = data[(y * canvas.width + x) * 4 + 3]
            if (alpha > 0) {
              if (x < minX) minX = x
              if (x > maxX) maxX = x
              if (y < minY) minY = y
              if (y > maxY) maxY = y
              found = true
            }
          }
        }

        let exportCanvas = canvas

        if (found) {
          // Add a small safety padding around the text
          const padding = 12
          const cropMinX = Math.max(0, minX - padding)
          const cropMinY = Math.max(0, minY - padding)
          const cropMaxX = Math.min(canvas.width - 1, maxX + padding)
          const cropMaxY = Math.min(canvas.height - 1, maxY + padding)

          const cropWidth = cropMaxX - cropMinX + 1
          const cropHeight = cropMaxY - cropMinY + 1

          const cropCanvas = document.createElement("canvas")
          cropCanvas.width = cropWidth
          cropCanvas.height = cropHeight
          const cropCtx = cropCanvas.getContext("2d")
          if (cropCtx) {
            cropCtx.drawImage(canvas, cropMinX, cropMinY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight)
            exportCanvas = cropCanvas
          }
        }

        exportCanvas.toBlob((blob) => {
          if (blob) {
            const downloadUrl = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = downloadUrl
            a.download = title ? `${title}.png` : "text-editor-export.png"
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(downloadUrl)
          }
        }, "image/png")
      } catch (err) {
        console.error("Failed to export image due to tainted canvas or crop error", err)
      }
    }

    img.onerror = (err) => {
      console.error("Error loading SVG image inside canvas", err)
    }

    img.src = dataUrl
  }, [title])

  const chars = plainText.length
  const words = plainText.trim() === "" ? 0 : plainText.trim().split(/\s+/).length

  return (
    <div className="w-full flex-1 flex flex-col min-h-0 gap-4">
      <Card className="p-4 bg-white border border-zinc-200/80 shadow-xs rounded-xl shrink-0">
        <div className="flex flex-wrap items-center gap-3">
          {/* Text Formatting */}
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleStyle("bold")}
              className={`h-9 w-9 p-0 transition-all duration-200 rounded-md ${activeStyles.bold
                ? "bg-zinc-900 text-white border-zinc-900 hover:bg-zinc-800 shadow-xs"
                : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                }`}
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleStyle("italic")}
              className={`h-9 w-9 p-0 transition-all duration-200 rounded-md ${activeStyles.italic
                ? "bg-zinc-900 text-white border-zinc-900 hover:bg-zinc-800 shadow-xs"
                : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                }`}
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleStyle("underline")}
              className={`h-9 w-9 p-0 transition-all duration-200 rounded-md ${activeStyles.underline
                ? "bg-zinc-900 text-white border-zinc-900 hover:bg-zinc-800 shadow-xs"
                : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                }`}
            >
              <Underline className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6 bg-zinc-200" />

          {/* Font Size */}
          <div className="flex items-center gap-1.5 bg-zinc-50 rounded-md p-1 border border-zinc-200 h-9">
            <Button
              variant="outline"
              size="sm"
              onClick={() => changeFontSize(-1)}
              className="h-7 w-7 p-0 border-0 hover:bg-zinc-200/60 bg-transparent text-zinc-600 hover:text-zinc-900 transition-all flex items-center justify-center"
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs font-semibold min-w-[2.5rem] text-center px-1 py-0.5 bg-white rounded border border-zinc-200 text-zinc-800">
              {activeStyles.fontSize}px
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => changeFontSize(1)}
              className="h-7 w-7 p-0 border-0 hover:bg-zinc-200/60 bg-transparent text-zinc-600 hover:text-zinc-900 transition-all flex items-center justify-center"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6 bg-zinc-200" />

          {/* Alignment */}
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAlignment("left")}
              className={`h-9 w-9 p-0 transition-all duration-200 rounded-md ${activeStyles.align === "left"
                ? "bg-zinc-900 text-white border-zinc-900 hover:bg-zinc-800 shadow-xs"
                : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                }`}
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAlignment("center")}
              className={`h-9 w-9 p-0 transition-all duration-200 rounded-md ${activeStyles.align === "center"
                ? "bg-zinc-900 text-white border-zinc-900 hover:bg-zinc-800 shadow-xs"
                : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                }`}
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAlignment("right")}
              className={`h-9 w-9 p-0 transition-all duration-200 rounded-md ${activeStyles.align === "right"
                ? "bg-zinc-900 text-white border-zinc-900 hover:bg-zinc-800 shadow-xs"
                : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                }`}
            >
              <AlignRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAlignment("justify")}
              className={`h-9 w-9 p-0 transition-all duration-200 rounded-md ${activeStyles.align === "justify"
                ? "bg-zinc-900 text-white border-zinc-900 hover:bg-zinc-800 shadow-xs"
                : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                }`}
            >
              <AlignJustify className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6 bg-zinc-200" />

          {/* Color Picker with Presets */}
          <div className="flex items-center gap-2 bg-zinc-50 rounded-md p-1 border border-zinc-200 h-9 px-2">
            <Palette className="h-3.5 w-3.5 text-zinc-500" />
            <div className="flex items-center gap-1.5 border-r border-zinc-200 pr-1.5 mr-1.5">
              {PRESET_COLORS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => changeColor(preset.value)}
                  title={preset.name}
                  className={`w-4 h-4 rounded-full border transition-all duration-200 hover:scale-110 cursor-pointer ${activeStyles.color.toLowerCase() === preset.value.toLowerCase()
                    ? "border-zinc-900 ring-2 ring-zinc-900/10 scale-105"
                    : "border-transparent"
                    }`}
                  style={{ backgroundColor: preset.value }}
                />
              ))}
            </div>
            <div className="relative flex items-center justify-center">
              <input
                type="color"
                value={activeStyles.color}
                onChange={(e) => changeColor(e.target.value)}
                className="w-5 h-5 rounded-full border border-zinc-300 cursor-pointer shadow-xs overflow-hidden p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none"
                title="Custom Color"
              />
            </div>
          </div>

          <Separator orientation="vertical" className="h-6 bg-zinc-200" />

          {/* Title Input Field */}
          <div className="flex items-center h-9">
            <Input
              type="text"
              placeholder="Image title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-40 h-9 bg-white border-zinc-200 text-xs focus-visible:ring-zinc-950 placeholder:text-zinc-400 focus-visible:border-zinc-400"
            />
          </div>

          {/* Export */}
          <Button
            onClick={downloadAsPNG}
            className="bg-zinc-900 hover:bg-zinc-800 text-white shadow-xs transition-all px-4 h-9 border-0 rounded-md font-medium text-xs sm:text-sm gap-2 ml-auto"
            size="sm"
          >
            <Download className="h-4 w-4" />
            Export PNG
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0 overflow-hidden">
        {/* Text Editor */}
        <Card className="p-5 bg-white border border-zinc-200/80 shadow-xs flex flex-col h-full rounded-xl overflow-hidden">
          {/* Header with macOS controls */}
          <div className="flex items-center justify-between mb-3 shrink-0">
            <h3 className="text-xs font-semibold tracking-wider uppercase text-zinc-400">Editor</h3>
            <div className="flex gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-400/80"></span>
              <span className="w-2 h-2 rounded-full bg-yellow-400/80"></span>
              <span className="w-2 h-2 rounded-full bg-green-400/80"></span>
            </div>
          </div>
          <div
            ref={editorRef}
            contentEditable={true}
            onInput={handleInput}
            className="w-full flex-1 border border-zinc-100 outline-none bg-zinc-50/20 text-zinc-600 placeholder:text-zinc-400 focus:ring-0 focus:border-zinc-200 rounded-lg p-4 transition-all overflow-y-auto min-h-[150px]"
            {...{ placeholder: "Start typing your text here..." }}
            style={{
              fontSize: "11px",
              lineHeight: "21px",
              color: "#737373",
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}
          />
          {/* Bottom Status bar */}
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-100 text-[11px] text-zinc-400 font-mono shrink-0">
            <span>PLAIN TEXT</span>
            <div className="flex items-center gap-3">
              <span>{chars} chars</span>
              <span>{words} words</span>
            </div>
          </div>
        </Card>

        {/* Preview */}
        <Card className="p-5 bg-white border border-zinc-200/80 shadow-xs flex flex-col h-full rounded-xl overflow-hidden">
          {/* Header with macOS controls */}
          <div className="flex items-center justify-between mb-3 shrink-0">
            <h3 className="text-xs font-semibold tracking-wider uppercase text-zinc-400">Preview</h3>
            <div className="flex gap-1.5">
              <span className="w-2 h-2 rounded-full bg-zinc-200"></span>
              <span className="w-2 h-2 rounded-full bg-zinc-200"></span>
              <span className="w-2 h-2 rounded-full bg-zinc-200"></span>
            </div>
          </div>
          <div
            className="flex-1 overflow-y-auto rounded-lg border border-zinc-100 p-6 bg-zinc-50/50 shadow-inner"
            style={{
              fontFamily: "system-ui, -apple-system, sans-serif",
              fontSize: "11px",
              lineHeight: "21px",
              color: "#737373",
              maxWidth: "100%",
              wordWrap: "break-word",
              whiteSpace: "pre-wrap",
            }}
          >
            {html.trim() !== "" && html !== "<br>" ? (
              <div dangerouslySetInnerHTML={{ __html: html }} />
            ) : (
              <div className="flex h-full items-center justify-center text-zinc-300 italic text-sm select-none">
                Your styled text will preview here
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Hidden Canvas for Export */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}