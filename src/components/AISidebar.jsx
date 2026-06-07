import { useState } from 'react'
import axios from 'axios'

export default function AISidebar({ documentId, content, onClose }) {
  const [mode, setMode] = useState('summarize')
  const [result, setResult] = useState('')
  const [question, setQuestion] = useState('')
  const [rewriteText, setRewriteText] = useState('')
  const [rewriteMode, setRewriteMode] = useState('improve')
  const [loading, setLoading] = useState(false)

  const embedDocument = async () => {
    try {
      await axios.post('http://localhost:8000/api/ai/embed', {
        document_id: parseInt(documentId),
        content: content,
      })
    } catch (err) {
      console.error('Embed failed', err)
    }
  }

  const handleSummarize = async () => {
    setLoading(true)
    setResult('')
    await embedDocument()
    try {
      const res = await axios.post('http://localhost:8000/api/ai/summarize', {
        content,
        document_id: parseInt(documentId),
      })
      setResult(res.data.summary)
    } catch (err) {
      setResult('Error: ' + (err.response?.data?.detail || err.message))
    } finally {
      setLoading(false)
    }
  }

  const handleRewrite = async () => {
    setLoading(true)
    setResult('')
    try {
      const res = await axios.post('http://localhost:8000/api/ai/rewrite', {
        text: rewriteText,
        mode: rewriteMode,
      })
      setResult(res.data.rewritten)
    } catch (err) {
      setResult('Error: ' + (err.response?.data?.detail || err.message))
    } finally {
      setLoading(false)
    }
  }

  const handleChat = async () => {
    setLoading(true)
    setResult('')
    await embedDocument()
    try {
      const res = await axios.post('http://localhost:8000/api/ai/chat', {
        document_id: parseInt(documentId),
        question,
      })
      setResult(res.data.answer)
    } catch (err) {
      setResult('Error: ' + (err.response?.data?.detail || err.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.sidebar}>
      <div style={styles.header}>
        <h3 style={styles.title}>🤖 AI Assistant</h3>
        <button style={styles.closeBtn} onClick={onClose}>✕</button>
      </div>

      <div style={styles.tabs}>
        {['summarize', 'rewrite', 'chat'].map((m) => (
          <button
            key={m}
            style={{ ...styles.tab, ...(mode === m ? styles.activeTab : {}) }}
            onClick={() => { setMode(m); setResult('') }}
          >
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      <div style={styles.body}>
        {mode === 'summarize' && (
          <div>
            <p style={styles.desc}>Summarize the entire document in a few sentences.</p>
            <button style={styles.actionBtn} onClick={handleSummarize} disabled={loading}>
              {loading ? 'Summarizing...' : 'Summarize Document'}
            </button>
          </div>
        )}

        {mode === 'rewrite' && (
          <div>
            <p style={styles.desc}>Paste text to rewrite:</p>
            <textarea
              style={styles.textarea}
              placeholder="Paste text here..."
              value={rewriteText}
              onChange={(e) => setRewriteText(e.target.value)}
            />
            <select
              style={styles.select}
              value={rewriteMode}
              onChange={(e) => setRewriteMode(e.target.value)}
            >
              <option value="improve">Improve</option>
              <option value="formal">Make Formal</option>
              <option value="casual">Make Casual</option>
              <option value="shorter">Make Shorter</option>
              <option value="longer">Make Longer</option>
            </select>
            <button style={styles.actionBtn} onClick={handleRewrite} disabled={loading}>
              {loading ? 'Rewriting...' : 'Rewrite'}
            </button>
          </div>
        )}

        {mode === 'chat' && (
          <div>
            <p style={styles.desc}>Ask anything about this document:</p>
            <textarea
              style={styles.textarea}
              placeholder="What is this document about?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <button style={styles.actionBtn} onClick={handleChat} disabled={loading}>
              {loading ? 'Thinking...' : 'Ask'}
            </button>
          </div>
        )}

        {result && (
          <div style={styles.result}>
            <p style={styles.resultLabel}>Result:</p>
            <p style={styles.resultText}>{result}</p>
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  sidebar: { width: '320px', borderLeft: '1px solid #eee', display: 'flex', flexDirection: 'column', background: '#fafafa' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid #eee' },
  title: { margin: 0, fontSize: '1rem' },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' },
  tabs: { display: 'flex', borderBottom: '1px solid #eee' },
  tab: { flex: 1, padding: '0.6rem', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.85rem' },
  activeTab: { borderBottom: '2px solid #4f46e5', color: '#4f46e5', fontWeight: 'bold' },
  body: { padding: '1rem', overflowY: 'auto', flex: 1 },
  desc: { fontSize: '0.85rem', color: '#666', marginBottom: '0.75rem' },
  textarea: { width: '100%', height: '100px', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '0.5rem', boxSizing: 'border-box', resize: 'vertical' },
  select: { width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '6px', marginBottom: '0.75rem', fontSize: '0.85rem' },
  actionBtn: { width: '100%', padding: '0.6rem', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem' },
  result: { marginTop: '1rem', background: 'white', border: '1px solid #eee', borderRadius: '8px', padding: '1rem' },
  resultLabel: { margin: '0 0 0.5rem', fontWeight: 'bold', fontSize: '0.85rem' },
  resultText: { margin: 0, fontSize: '0.85rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' },
}