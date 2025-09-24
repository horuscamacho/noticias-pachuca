"use client"

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { TextAlign } from '@tiptap/extension-text-align'
import { Link } from '@tiptap/extension-link'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { BulletList } from '@tiptap/extension-bullet-list'
import { OrderedList } from '@tiptap/extension-ordered-list'
import { ListItem } from '@tiptap/extension-list-item'
import { Button } from "@/components/ui/button"
import { Toggle } from "@/components/ui/toggle"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Link as LinkIcon,
  Palette,
  Code,
  Quote,
  Undo,
  Redo,
  Eye,
  EyeOff,
  Type,
  Braces
} from "lucide-react"
import { useState, useCallback, useEffect } from 'react'
import { cn } from "@/lib/utils"

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
  showPreview?: boolean
}

const TEMPLATE_VARIABLES = [
  "{{title}}",
  "{{content}}",
  "{{context}}",
  "{{author}}",
  "{{date}}",
  "{{category}}",
  "{{source}}"
]

const PROMPT_COLORS = [
  { name: "Default", value: "hsl(var(--foreground))" },
  { name: "Primary", value: "hsl(var(--primary))" },
  { name: "Secondary", value: "hsl(var(--muted-foreground))" },
  { name: "Accent", value: "hsl(var(--accent-foreground))" },
  { name: "Success", value: "oklch(0.7 0.15 142)" },
  { name: "Warning", value: "oklch(0.8 0.15 85)" },
  { name: "Error", value: "oklch(0.65 0.18 25)" },
]

export function RichTextEditor({
  content,
  onChange,
  placeholder = "Escribe tu prompt aquí...",
  className,
  showPreview = true
}: RichTextEditorProps) {
  const [isPreview, setIsPreview] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")
  const [isLinkOpen, setIsLinkOpen] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary hover:underline',
        },
      }),
      TextStyle,
      Color,
      BulletList.configure({
        HTMLAttributes: {
          class: 'list-disc list-inside',
        },
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: 'list-decimal list-inside',
        },
      }),
      ListItem,
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm max-w-none focus:outline-none",
          "min-h-[200px] p-4 border rounded-md",
          "prose-headings:text-foreground prose-p:text-foreground",
          "prose-strong:text-foreground prose-em:text-foreground",
          "prose-code:text-foreground prose-blockquote:text-foreground",
          "prose-ul:text-foreground prose-ol:text-foreground",
          "prose-li:text-foreground"
        ),
      },
    },
  })

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  const setLink = useCallback(() => {
    if (!editor) return

    if (linkUrl) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run()
    } else {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    }

    setLinkUrl("")
    setIsLinkOpen(false)
  }, [editor, linkUrl])

  const insertVariable = (variable: string) => {
    if (!editor) return
    editor.chain().focus().insertContent(variable + " ").run()
  }

  if (!editor) {
    return (
      <div className="border rounded-md p-4 min-h-[200px] flex items-center justify-center text-muted-foreground">
        Cargando editor...
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Toolbar */}
      <div className="border rounded-md p-2">
        <div className="flex flex-wrap items-center gap-1">
          {/* Text Formatting */}
          <div className="flex items-center gap-1">
            <Toggle
              size="sm"
              pressed={editor.isActive('bold')}
              onPressedChange={() => editor.chain().focus().toggleBold().run()}
            >
              <Bold className="h-4 w-4" />
            </Toggle>
            <Toggle
              size="sm"
              pressed={editor.isActive('italic')}
              onPressedChange={() => editor.chain().focus().toggleItalic().run()}
            >
              <Italic className="h-4 w-4" />
            </Toggle>
            <Toggle
              size="sm"
              pressed={editor.isActive('strike')}
              onPressedChange={() => editor.chain().focus().toggleStrike().run()}
            >
              <Strikethrough className="h-4 w-4" />
            </Toggle>
            <Toggle
              size="sm"
              pressed={editor.isActive('code')}
              onPressedChange={() => editor.chain().focus().toggleCode().run()}
            >
              <Code className="h-4 w-4" />
            </Toggle>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Text Alignment */}
          <div className="flex items-center gap-1">
            <Toggle
              size="sm"
              pressed={editor.isActive({ textAlign: 'left' })}
              onPressedChange={() => editor.chain().focus().setTextAlign('left').run()}
            >
              <AlignLeft className="h-4 w-4" />
            </Toggle>
            <Toggle
              size="sm"
              pressed={editor.isActive({ textAlign: 'center' })}
              onPressedChange={() => editor.chain().focus().setTextAlign('center').run()}
            >
              <AlignCenter className="h-4 w-4" />
            </Toggle>
            <Toggle
              size="sm"
              pressed={editor.isActive({ textAlign: 'right' })}
              onPressedChange={() => editor.chain().focus().setTextAlign('right').run()}
            >
              <AlignRight className="h-4 w-4" />
            </Toggle>
            <Toggle
              size="sm"
              pressed={editor.isActive({ textAlign: 'justify' })}
              onPressedChange={() => editor.chain().focus().setTextAlign('justify').run()}
            >
              <AlignJustify className="h-4 w-4" />
            </Toggle>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Lists */}
          <div className="flex items-center gap-1">
            <Toggle
              size="sm"
              pressed={editor.isActive('bulletList')}
              onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
            >
              <List className="h-4 w-4" />
            </Toggle>
            <Toggle
              size="sm"
              pressed={editor.isActive('orderedList')}
              onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
            >
              <ListOrdered className="h-4 w-4" />
            </Toggle>
            <Toggle
              size="sm"
              pressed={editor.isActive('blockquote')}
              onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
            >
              <Quote className="h-4 w-4" />
            </Toggle>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Color Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <Palette className="h-4 w-4" />
                Color
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="grid grid-cols-3 gap-2">
                {PROMPT_COLORS.map((color) => (
                  <button
                    key={color.name}
                    className="p-2 rounded text-sm border hover:bg-muted"
                    style={{ color: color.value }}
                    onClick={() => editor.chain().focus().setColor(color.value).run()}
                  >
                    {color.name}
                  </button>
                ))}
              </div>
              <Separator className="my-2" />
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => editor.chain().focus().unsetColor().run()}
              >
                Quitar color
              </Button>
            </PopoverContent>
          </Popover>

          {/* Link */}
          <Popover open={isLinkOpen} onOpenChange={setIsLinkOpen}>
            <PopoverTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive('link')}
              >
                <LinkIcon className="h-4 w-4" />
              </Toggle>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-2">
                <Label htmlFor="link-url">URL del enlace</Label>
                <div className="flex gap-2">
                  <Input
                    id="link-url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://..."
                  />
                  <Button onClick={setLink} size="sm">
                    {editor.isActive('link') ? 'Actualizar' : 'Agregar'}
                  </Button>
                </div>
                {editor.isActive('link') && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      editor.chain().focus().unsetLink().run()
                      setIsLinkOpen(false)
                    }}
                  >
                    Quitar enlace
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>

          <Separator orientation="vertical" className="h-6" />

          {/* Undo/Redo */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>

          {showPreview && (
            <>
              <Separator orientation="vertical" className="h-6" />

              {/* Preview Toggle */}
              <Toggle
                size="sm"
                pressed={isPreview}
                onPressedChange={setIsPreview}
              >
                {isPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {isPreview ? 'Editor' : 'Preview'}
              </Toggle>
            </>
          )}
        </div>

        {/* Template Variables */}
        <Separator className="my-2" />
        <div className="flex flex-wrap items-center gap-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Braces className="h-4 w-4" />
            Variables:
          </div>
          {TEMPLATE_VARIABLES.map((variable) => (
            <Button
              key={variable}
              variant="outline"
              size="sm"
              className="h-6 px-2 text-xs font-mono"
              onClick={() => insertVariable(variable)}
            >
              {variable}
            </Button>
          ))}
        </div>
      </div>

      {/* Editor Content */}
      <div className="border rounded-md">
        {isPreview ? (
          <div className="p-4 min-h-[200px]">
            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
          </div>
        ) : (
          <EditorContent editor={editor} />
        )}
      </div>

      {/* Character Count */}
      <div className="text-sm text-muted-foreground text-right">
        {editor.storage.characterCount?.characters() || 0} caracteres
      </div>
    </div>
  )
}