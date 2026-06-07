import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import useAuthStore from '../store/authStore'

export default function Dashboard() {
  const [documents, setDocuments] = useState([])
  const [newTitle, setNewTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/api/documents')
      setDocuments(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const createDocument = async () => {
    if (!newTitle.trim()) return
    try {
      const res = await api.post('/api/documents', { title: newTitle, content: '' })
      setDocuments([...documents, res.data])
      setNewTitle('')
    } catch (err) {
      console.error(err)
    }
  }

  const deleteDocument = async (id) => {
    try {
      await api.delete(`/api/documents/${id}`)
      setDocuments(documents.filter((d) => d.id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('refreshToken')
    try {
      await api.post('/api/auth/logout', { refreshToken })
    } catch {}
    logout()
    navigate('/login')
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>CollabAI</h1>
        <div style={styles.userInfo}>
          <span>👋 {user?.name}</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div style={styles.content}>
        <div style={styles.newDoc}>
          <input
            style={styles.input}
            placeholder="New document title..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && createDocument()}
          />
          <button style={styles.createBtn} onClick={createDocument}>
            + Create
          </button>
        </div>

        {loading ? (
          <p>Loading documents...</p>
        ) : documents.length === 0 ? (
          <p style={styles.empty}>No documents yet. Create one above!</p>
        ) : (
          <div style={styles.grid}>
            {documents.map((doc) => (
              <div key={doc.id} style={styles.card}>
                <div onClick={() => navigate(`/editor/${doc.id}`)} style={styles.cardContent}>
                  <h3 style={styles.docTitle}>{doc.title}</h3>
                  <p style={styles.docMeta}>
                    Updated {new Date(doc.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <button style={styles.deleteBtn} onClick={() => deleteDocument(doc.id)}>
                  🗑
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', background: '#f0f2f5' },
  header: { background: 'white', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  title: { margin: 0, color: '#4f46e5' },
  userInfo: { display: 'flex', alignItems: 'center', gap: '1rem' },
  logoutBtn: { padding: '0.5rem 1rem', background: '#f0f2f5', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  content: { maxWidth: '900px', margin: '2rem auto', padding: '0 1rem' },
  newDoc: { display: 'flex', gap: '1rem', marginBottom: '2rem' },
  input: { flex: 1, padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px', fontSize: '1rem' },
  createBtn: { padding: '0.75rem 1.5rem', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem' },
  empty: { textAlign: 'center', color: '#999', marginTop: '3rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' },
  card: { background: 'white', borderRadius: '10px', padding: '1.2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: 'pointer' },
  cardContent: { flex: 1 },
  docTitle: { margin: '0 0 0.5rem', color: '#1a1a2e' },
  docMeta: { margin: 0, fontSize: '0.8rem', color: '#999' },
  deleteBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' },
}