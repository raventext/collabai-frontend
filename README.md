# CollabAI Frontend

A React frontend for a real-time collaborative document editor with an AI assistant sidebar.

## Tech Stack

- **React 18** + **Vite**
- **Tiptap** (rich text editor)
- **Yjs** (CRDT for conflict-free collaboration)
- **STOMP.js** + **SockJS** (WebSocket client)
- **Axios** (HTTP client)
- **Zustand** (state management)
- **React Router** (routing)

## Features

- Rich text editor (Bold, Italic, Headings, Lists, Code)
- Real-time multi-user collaboration via WebSocket
- Auto-save every 2 seconds
- JWT authentication with auto token refresh
- AI sidebar with 3 modes:
  - **Summarize** — summarize entire document
  - **Rewrite** — rewrite selected text in different styles
  - **Chat** — ask questions about the document (RAG)
- Document dashboard (create, open, delete)
- Responsive scrollable editor layout

## Running Locally

### Prerequisites
- Node.js 18+
- CollabAI Backend running on port 8080
- CollabAI AI Service running on port 8000

### Setup

1. Install dependencies:
```bash
npm install
```

2. Run development server:
```bash
npm run dev
```

App available at `http://localhost:5173`

## Running with Docker

```bash
docker-compose up --build
```

## Project Structure
```
src/
├── api/
│   └── axios.js          # Axios instance with JWT interceptors
├── components/
│   └── AISidebar.jsx     # AI assistant sidebar
├── pages/
│   ├── auth/
│   │   ├── Login.jsx
│   │   └── Register.jsx
│   ├── Dashboard.jsx
│   └── editor/
│       └── Editor.jsx    # Main editor with WebSocket + Tiptap
└── store/
└── authStore.js      # Zustand auth state
```
## Related Repositories

- [collabai-backend](https://github.com/raventext/collabai-backend) — Spring Boot backend
- [collabai-ai-service](https://github.com/raventext/collabai-ai-service) — Python FastAPI AI microservice
