import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { TextAlign } from '@tiptap/extension-text-align'
import { Link as TiptapLink } from '@tiptap/extension-link'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { BulletList } from '@tiptap/extension-bullet-list'
import { OrderedList } from '@tiptap/extension-ordered-list'
import { ListItem } from '@tiptap/extension-list-item'

export const Route = createFileRoute('/crear-columna')({
  component: CrearColumnaPage,
})

function CrearColumnaPage() {
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [category, setCategory] = useState('OPINIÓN')
  const [tags, setTags] = useState('')
  const [isDraft, setIsDraft] = useState(true)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      BulletList.configure({
        HTMLAttributes: {
          class: 'brutalist-bullet-list',
        },
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: 'brutalist-ordered-list',
        },
      }),
      ListItem.configure({
        HTMLAttributes: {
          class: 'brutalist-list-item',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TiptapLink.configure({
        openOnClick: false,
      }),
      TextStyle,
      Color,
    ],
    content: '<p>Escribe aquí tu columna de opinión...</p>',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[400px] p-4 border-2 border-black bg-white',
      },
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const content = editor?.getHTML()
    console.log({ title, subtitle, category, tags, content, isDraft })
    // Here you would submit to your backend
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      {/* 🏗️ BRUTALIST HEADER SIMPLIFICADO */}
      <header className="bg-white border-b-4 border-black relative">
        <div className="px-4 py-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
              {/* Logo */}
              <Link to="/" className="flex items-center justify-center md:justify-start space-x-2 md:space-x-4 relative">
                <div className="absolute -top-2 -left-2 w-4 h-4 bg-[#FF0000] transform rotate-45"></div>
                <h1 className="text-xl md:text-2xl font-black uppercase tracking-[0.1em] text-black">
                  NOTICIAS
                </h1>
                <h2 className="text-xl md:text-2xl font-black uppercase tracking-[0.1em] text-[#854836]">
                  PACHUCA
                </h2>
                <div className="w-6 md:w-8 h-1 bg-[#FFB22C]"></div>
              </Link>

              {/* Navigation Links */}
              <nav className="flex items-center justify-center md:justify-end space-x-2 md:space-x-4">
                <Link
                  to="/perfil"
                  className="font-bold uppercase text-xs md:text-sm tracking-wider text-black hover:text-[#854836] transition-colors"
                >
                  MI PERFIL
                </Link>
                <Link
                  to="/crear-columna"
                  className="bg-[#854836] text-white px-3 md:px-4 py-2 font-bold uppercase text-xs border-2 border-black"
                >
                  CREAR COLUMNA
                </Link>
                <button className="bg-black text-white px-3 md:px-4 py-2 font-bold uppercase text-xs border-2 border-black hover:bg-[#FF0000] transition-colors">
                  CERRAR SESIÓN
                </button>
              </nav>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* Main Editor */}
          <div className="lg:col-span-3">
            <div className="bg-white border-4 border-black p-8 relative">
              <div className="absolute -top-3 -left-3 w-8 h-8 bg-[#FFB22C] transform rotate-45"></div>

              <h1 className="text-4xl font-black uppercase tracking-tight text-black mb-8">
                CREAR COLUMNA DE OPINIÓN
              </h1>

              <form onSubmit={handleSubmit} className="space-y-8">

                {/* Title and Subtitle */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold uppercase tracking-wider text-black mb-3">
                      TÍTULO DE LA COLUMNA
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="ESCRIBE EL TÍTULO AQUÍ"
                      className="w-full px-4 py-4 border-2 border-black bg-[#F7F7F7] font-bold uppercase text-sm placeholder-black focus:outline-none focus:bg-white focus:border-[#854836] transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold uppercase tracking-wider text-black mb-3">
                      SUBTÍTULO (OPCIONAL)
                    </label>
                    <input
                      type="text"
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      placeholder="SUBTÍTULO DESCRIPTIVO"
                      className="w-full px-4 py-4 border-2 border-black bg-[#F7F7F7] font-bold uppercase text-sm placeholder-black focus:outline-none focus:bg-white focus:border-[#854836] transition-colors"
                    />
                  </div>
                </div>

                {/* Category and Tags */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold uppercase tracking-wider text-black mb-3">
                      CATEGORÍA
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-4 text-sm"
                    >
                      <option value="OPINIÓN">OPINIÓN</option>
                      <option value="ANÁLISIS">ANÁLISIS</option>
                      <option value="EDITORIAL">EDITORIAL</option>
                      <option value="CRÍTICA">CRÍTICA</option>
                      <option value="ENSAYO">ENSAYO</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold uppercase tracking-wider text-black mb-3">
                      ETIQUETAS (SEPARADAS POR COMAS)
                    </label>
                    <input
                      type="text"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="POLÍTICA, SOCIEDAD, CULTURA"
                      className="w-full px-4 py-4 border-2 border-black bg-[#F7F7F7] font-bold uppercase text-sm placeholder-black focus:outline-none focus:bg-white focus:border-[#854836] transition-colors"
                    />
                  </div>
                </div>

                {/* Rich Text Editor */}
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wider text-black mb-3">
                    CONTENIDO DE LA COLUMNA
                  </label>

                  {/* Editor Toolbar */}
                  {editor && (
                    <div className="border-2 border-black bg-[#F7F7F7] p-3 flex flex-wrap gap-2 mb-0">
                      {/* Text Formatting */}
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        className={`px-3 py-2 border-2 border-black font-bold text-sm transition-colors ${
                          editor.isActive('bold')
                            ? 'bg-[#854836] text-white'
                            : 'bg-white text-black hover:bg-[#854836] hover:text-white'
                        }`}
                      >
                        B
                      </button>
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        className={`px-3 py-2 border-2 border-black font-bold text-sm italic transition-colors ${
                          editor.isActive('italic')
                            ? 'bg-[#854836] text-white'
                            : 'bg-white text-black hover:bg-[#854836] hover:text-white'
                        }`}
                      >
                        I
                      </button>
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleStrike().run()}
                        className={`px-3 py-2 border-2 border-black font-bold text-sm line-through transition-colors ${
                          editor.isActive('strike')
                            ? 'bg-[#854836] text-white'
                            : 'bg-white text-black hover:bg-[#854836] hover:text-white'
                        }`}
                      >
                        S
                      </button>

                      <div className="w-px h-8 bg-black mx-2"></div>

                      {/* Headings */}
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        className={`px-3 py-2 border-2 border-black font-bold text-sm transition-colors ${
                          editor.isActive('heading', { level: 1 })
                            ? 'bg-[#854836] text-white'
                            : 'bg-white text-black hover:bg-[#854836] hover:text-white'
                        }`}
                      >
                        H1
                      </button>
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        className={`px-3 py-2 border-2 border-black font-bold text-sm transition-colors ${
                          editor.isActive('heading', { level: 2 })
                            ? 'bg-[#854836] text-white'
                            : 'bg-white text-black hover:bg-[#854836] hover:text-white'
                        }`}
                      >
                        H2
                      </button>

                      <div className="w-px h-8 bg-black mx-2"></div>

                      {/* Lists */}
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        className={`px-3 py-2 border-2 border-black font-bold text-sm transition-colors ${
                          editor.isActive('bulletList')
                            ? 'bg-[#854836] text-white'
                            : 'bg-white text-black hover:bg-[#854836] hover:text-white'
                        }`}
                      >
                        •
                      </button>
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        className={`px-3 py-2 border-2 border-black font-bold text-sm transition-colors ${
                          editor.isActive('orderedList')
                            ? 'bg-[#854836] text-white'
                            : 'bg-white text-black hover:bg-[#854836] hover:text-white'
                        }`}
                      >
                        1.
                      </button>

                      <div className="w-px h-8 bg-black mx-2"></div>

                      {/* Alignment */}
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().setTextAlign('left').run()}
                        className={`px-3 py-2 border-2 border-black font-bold text-sm transition-colors ${
                          editor.isActive({ textAlign: 'left' })
                            ? 'bg-[#854836] text-white'
                            : 'bg-white text-black hover:bg-[#854836] hover:text-white'
                        }`}
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().setTextAlign('center').run()}
                        className={`px-3 py-2 border-2 border-black font-bold text-sm transition-colors ${
                          editor.isActive({ textAlign: 'center' })
                            ? 'bg-[#854836] text-white'
                            : 'bg-white text-black hover:bg-[#854836] hover:text-white'
                        }`}
                      >
                        ↔
                      </button>
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().setTextAlign('right').run()}
                        className={`px-3 py-2 border-2 border-black font-bold text-sm transition-colors ${
                          editor.isActive({ textAlign: 'right' })
                            ? 'bg-[#854836] text-white'
                            : 'bg-white text-black hover:bg-[#854836] hover:text-white'
                        }`}
                      >
                        →
                      </button>

                      <div className="w-px h-8 bg-black mx-2"></div>

                      {/* Quote */}
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                        className={`px-3 py-2 border-2 border-black font-bold text-sm transition-colors ${
                          editor.isActive('blockquote')
                            ? 'bg-[#854836] text-white'
                            : 'bg-white text-black hover:bg-[#854836] hover:text-white'
                        }`}
                      >
                        "
                      </button>
                    </div>
                  )}

                  {/* Editor Content */}
                  <EditorContent
                    editor={editor}
                    className="prose prose-lg max-w-none [&_.ProseMirror]:min-h-[400px] [&_.ProseMirror]:p-4 [&_.ProseMirror]:border-2 [&_.ProseMirror]:border-black [&_.ProseMirror]:bg-white [&_.ProseMirror]:focus:outline-none [&_.ProseMirror]:focus:border-[#854836] [&_.ProseMirror_h1]:text-2xl [&_.ProseMirror_h1]:font-black [&_.ProseMirror_h1]:uppercase [&_.ProseMirror_h2]:text-xl [&_.ProseMirror_h2]:font-black [&_.ProseMirror_h2]:uppercase [&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-[#854836] [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:italic [&_.ProseMirror_blockquote]:bg-[#F7F7F7]"
                  />
                </div>

                {/* Draft/Publish Toggle */}
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    id="draft"
                    checked={isDraft}
                    onChange={(e) => setIsDraft(e.target.checked)}
                  />
                  <label htmlFor="draft" className="text-sm font-bold uppercase tracking-wider text-black cursor-pointer">
                    GUARDAR COMO BORRADOR
                  </label>
                </div>

                {/* Submit Buttons */}
                <div className="flex flex-col md:flex-row gap-4">
                  <button
                    type="submit"
                    className="flex-1 bg-[#854836] text-white py-4 font-bold uppercase text-lg border-2 border-black hover:bg-[#FF0000] transition-colors relative group"
                  >
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#FFB22C] transform rotate-45 group-hover:bg-white transition-colors"></div>
                    {isDraft ? 'GUARDAR BORRADOR' : 'ENVIAR A REVISIÓN'}
                  </button>

                  <Link
                    to="/perfil"
                    className="flex-1 bg-[#F7F7F7] text-black py-4 font-bold uppercase text-lg border-2 border-black hover:bg-black hover:text-white transition-colors text-center"
                  >
                    CANCELAR
                  </Link>
                </div>

              </form>

              <div className="absolute -bottom-3 -right-3 w-0 h-0 border-l-[16px] border-r-[16px] border-b-[16px] border-l-transparent border-r-transparent border-b-black"></div>
            </div>
          </div>

          {/* Sidebar - Guidelines */}
          <div className="space-y-6">

            {/* Writing Guidelines */}
            <div className="bg-white border-2 border-black p-6 relative">
              <div className="absolute -top-1 -left-1 w-4 h-4 bg-[#FFB22C] transform rotate-45"></div>

              <h2 className="text-xl font-black uppercase tracking-tight text-black mb-4 border-b-2 border-black pb-2">
                GUÍAS DE ESCRITURA
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-[#854836] transform rotate-45 mt-2 flex-shrink-0"></div>
                  <span className="font-bold text-black">MÍNIMO 500 PALABRAS</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-[#854836] transform rotate-45 mt-2 flex-shrink-0"></div>
                  <span className="font-bold text-black">MÁXIMO 2000 PALABRAS</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-[#854836] transform rotate-45 mt-2 flex-shrink-0"></div>
                  <span className="font-bold text-black">INCLUIR FUENTES CONFIABLES</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-[#854836] transform rotate-45 mt-2 flex-shrink-0"></div>
                  <span className="font-bold text-black">EVITAR LENGUAJE OFENSIVO</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-[#854836] transform rotate-45 mt-2 flex-shrink-0"></div>
                  <span className="font-bold text-black">RESPETAR DERECHOS DE TERCEROS</span>
                </div>
              </div>
            </div>

            {/* Publication Process */}
            <div className="bg-[#FFB22C] border-2 border-black p-6 relative">
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-black transform rotate-45"></div>

              <h2 className="text-xl font-black uppercase tracking-tight text-black mb-4 border-b-2 border-black pb-2">
                PROCESO DE PUBLICACIÓN
              </h2>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-black text-white border-2 border-black flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <span className="text-sm font-bold text-black">ENVÍO A REVISIÓN EDITORIAL</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-black text-white border-2 border-black flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <span className="text-sm font-bold text-black">REVISIÓN DE CONTENIDO (24-48H)</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-black text-white border-2 border-black flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <span className="text-sm font-bold text-black">FEEDBACK Y CORRECCIONES</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-black text-white border-2 border-black flex items-center justify-center font-bold text-sm">
                    4
                  </div>
                  <span className="text-sm font-bold text-black">PUBLICACIÓN AUTOMÁTICA</span>
                </div>
              </div>
            </div>

            {/* Help */}
            <div className="bg-white border-2 border-black p-6 relative">
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF0000] transform rotate-45"></div>

              <h2 className="text-xl font-black uppercase tracking-tight text-black mb-4 border-b-2 border-black pb-2">
                ¿NECESITAS AYUDA?
              </h2>

              <div className="space-y-3">
                <button className="w-full bg-[#854836] text-white py-3 font-bold uppercase text-sm border-2 border-black hover:bg-[#FF0000] transition-colors">
                  GUÍA DE ESTILO
                </button>
                <button className="w-full bg-[#F7F7F7] text-black py-3 font-bold uppercase text-sm border-2 border-black hover:bg-black hover:text-white transition-colors">
                  CONTACTAR EDITOR
                </button>
                <button className="w-full bg-[#F7F7F7] text-black py-3 font-bold uppercase text-sm border-2 border-black hover:bg-black hover:text-white transition-colors">
                  VER EJEMPLOS
                </button>
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* Footer simplificado */}
      <footer className="bg-black text-white border-t-4 border-[#FFB22C] mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center">
            <div className="border-2 border-[#FFB22C] p-4 inline-block relative">
              <div className="absolute -top-2 -left-2 w-4 h-4 bg-[#FF0000] transform rotate-45"></div>
              <h2 className="text-xl font-black uppercase tracking-wider text-[#FFB22C] mb-1">NOTICIAS</h2>
              <h3 className="text-xl font-black uppercase tracking-wider text-white">PACHUCA</h3>
              <div className="w-8 h-1 bg-[#FFB22C] mx-auto mt-2"></div>
            </div>
            <p className="text-sm font-bold uppercase tracking-wider mt-4">
              © 2025 NOTICIAS PACHUCA. TODOS LOS DERECHOS RESERVADOS.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}