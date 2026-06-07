import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import api from '../../api/axios'
import AISidebar from '../../components/AISidebar'
import * as Y from 'yjs'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

const ydoc = new Y.Doc()

function debounce(fn, delay) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

export default function Editor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [document, setDocument] = useState(null)
  const [saving, setSaving] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [stompClient, setStompClient] = useState(null)
  const [connectedUsers, setConnectedUsers] = useState([])

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    onUpdate: ({ editor }) => {
      if (stompClient?.connected) {
        stompClient.publish({
          destination: `/app/document/${id}/edit`,
          body: JSON.stringify({
            documentId: id,
            content: editor.getHTML(),
            type: 'update',
          }),
        })
      }
      debouncedSave(editor.getHTML())
    },
  })

  const debouncedSave = useCallback(
    debounce(async (content) => {
      setSaving(true)
      try {
        await api.put(`/api/documents/${id}`, {
          title: document?.title || 'Untitled',
          content,
        })
      } catch (err) {
        console.error('Save failed', err)
      } finally {
        setSaving(false)
      }
    }, 2000),
    [id, document]
  )

  useEffect(() => {
    const loadDoc = async () => {
      try {
        const res = await api.get(`/api/documents/${id}`)
        setDocument(res.data)
        editor?.commands.setContent(res.data.content || '')
      } catch {
        navigate('/dashboard')
      }
    }
    if (editor) loadDoc()
  }, [id, editor])

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      connectHeaders: { Authorization: `Bearer ${token}` },
      onConnect: () => {
        client.subscribe(`/topic/document/${id}`, (message) => {
          const data = JSON.parse(message.body)
          if (data.type === 'update' && data.editorEmail !== localStorage.getItem('userEmail')) {
            editor?.commands.setContent(data.content)
          }
        })
      },
    })
    client.activate()
    setStompClient(client)
    return () => client.deactivate()
  }, [id, editor])

  if (!editor) return <div>Loading editor...</div>

  return (
    <div style={styles.container}>
      {/* Top Bar */}
      <div style={styles.topBar}>
        <button style={styles.backBtn} onClick={() => navigate('/dashboard')}>
          ← Dashboard
        </button>
        <h2 style={styles.docTitle}>{document?.title}</h2>
        <div style={styles.topRight}>
          <span style={styles.savingText}>{saving ? '💾 Saving...' : '✅ Saved'}</span>
          <button style={styles.aiBtn} onClick={() => setSidebarOpen(!sidebarOpen)}>
            🤖 AI Assistant
          </button>
        </div>
      </div>

      {/* Toolbar — text labels */}
      <div style={styles.toolbar}>
        <button
          style={{ ...styles.toolBtn, fontWeight: 'bold' }}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          Bold
        </button>
        <button
          style={{ ...styles.toolBtn, fontStyle: 'italic' }}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          Italic
        </button>
        <button
          style={styles.toolBtn}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          Heading 1
        </button>
        <button
          style={styles.toolBtn}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          Heading 2
        </button>
        <button
          style={styles.toolBtn}
          onClick={() => editor.chain().focus().setParagraph().run()}
        >
          Paragraph
        </button>
        <button
          style={styles.toolBtn}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          Bullet List
        </button>
        <button
          style={styles.toolBtn}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          Code
        </button>
      </div>

      {/* Main Area */}
      <div style={styles.main}>
        <div style={styles.editorWrapper}>
          <div style={styles.editorPage}>
            <EditorContent editor={editor} />
          </div>
        </div>
        {sidebarOpen && (
          <AISidebar
            documentId={id}
            content={editor.getHTML()}
            onClose={() => setSidebarOpen(false)}
          />
        )}
      </div>

      <style>{`
        .ProseMirror {
          outline: none;
          min-height: 500px;
          font-size: 1rem;
          line-height: 1.8;
          color: #1a1a2e;
          width: 100%;
        }
        .ProseMirror p { margin: 0.5rem 0; }
        .ProseMirror h1 { font-size: 2rem; font-weight: 700; margin: 1.5rem 0 0.5rem; }
        .ProseMirror h2 { font-size: 1.5rem; font-weight: 600; margin: 1.2rem 0 0.5rem; }
        .ProseMirror ul, .ProseMirror ol { padding-left: 1.5rem; margin: 0.5rem 0; }
        .ProseMirror li { margin: 0.3rem 0; }
        .ProseMirror code { background: #000000; padding: 0.2rem 0.4rem; border-radius: 4px; }
        .ProseMirror pre { background: #1e293b; color: #e2e8f0; padding: 1rem; border-radius: 8px; margin: 1rem 0; }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: 'Start writing...';
          color: #aaa;
          pointer-events: none;
          float: left;
          height: 0;
        }
      `}</style>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    overflow: 'hidden',
    background: '#f0f2f5',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.75rem 1.5rem',
    borderBottom: '1px solid #eee',
    background: 'white',
    gap: '1rem',
    flexShrink: 0,
  },
  backBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.9rem',
    color: '#666',
  },
  docTitle: {
    flex: 1,
    margin: 0,
    fontSize: '1.2rem',
    color: '#1a1a2e',
  },
  topRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  savingText: {
    fontSize: '0.85rem',
    color: '#999',
  },
  aiBtn: {
    padding: '0.5rem 1rem',
    background: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  toolbar: {
    display: 'flex',
    gap: '0.5rem',
    padding: '0.5rem 1.5rem',
    borderBottom: '1px solid #eee',
    background: 'white',
    flexShrink: 0,
    flexWrap: 'wrap',
  },
  toolBtn: {
    padding: '0.3rem 0.8rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    cursor: 'pointer',
    background: 'white',
    fontSize: '0.85rem',
  },
  main: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  editorWrapper: {
    flex: 1,
    overflowY: 'auto',      // ← scrollable
    padding: '2rem 1rem',
    background: '#f0f2f5',
  },
  editorPage: {
    maxWidth: '760px',
    margin: '0 auto',
    background: 'white',
    borderRadius: '8px',
    padding: '3rem',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    minHeight: 'calc(100vh - 160px)',  // ← tall enough to scroll
  },
}