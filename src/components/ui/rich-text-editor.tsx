"use client"

import * as React from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import { TextStyle } from "@tiptap/extension-text-style"
import Link from "@tiptap/extension-link"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { Bold, Italic, Underline as UnderlineIcon, Link as LinkIcon } from "lucide-react"

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  minHeight?: string
}

function RichTextEditor({
  value,
  onChange,
  placeholder = "Enter content...",
  className,
  disabled = false,
  minHeight = "120px",
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800',
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange(html)
    },
    editable: !disabled,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: cn(
          "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 prose prose-sm max-w-none focus:outline-none px-3 py-2 text-base md:text-sm",
          className
        ),
        style: `min-height: ${minHeight}`,
      },
    },
  })

  // Update editor content when value prop changes
  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false })
    }
  }, [editor, value])

  const addLink = React.useCallback(() => {
    if (!editor) return
    
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)

    // cancelled
    if (url === null) {
      return
    }

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    // update link
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  if (!editor) {
    return null
  }

  return (
    <div className={cn(
      "border-input focus-within:border-ring focus-within:ring-ring/50 w-full rounded-md border bg-transparent shadow-xs transition-[color,box-shadow] focus-within:ring-[3px]",
      disabled && "opacity-50 cursor-not-allowed",
      className
    )}>
      {/* Toolbar */}
      <div className="border-b border-border px-3 py-2 flex gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive("bold") && "bg-accent text-accent-foreground"
          )}
          disabled={disabled}
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive("italic") && "bg-accent text-accent-foreground"
          )}
          disabled={disabled}
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive("underline") && "bg-accent text-accent-foreground"
          )}
          disabled={disabled}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addLink}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive("link") && "bg-accent text-accent-foreground"
          )}
          disabled={disabled}
          title="Add Link"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Editor Content */}
      <div className="relative">
        <EditorContent 
          editor={editor}
          className="prose prose-sm max-w-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:border-none"
        />
        {editor.isEmpty && placeholder && (
          <div className="pointer-events-none absolute top-3 left-3 text-muted-foreground">
            {placeholder}
          </div>
        )}
      </div>
    </div>
  )
}

export { RichTextEditor }
export type { RichTextEditorProps }