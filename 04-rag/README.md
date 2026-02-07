# RAG App - Quick Deployment Guide

## Live Application

**[Open Live App](https://04-rag-f.vercel.app/)**

### URLs

- **Frontend (User App)**: https://04-rag-f.vercel.app/
- **Backend (API)**: https://04-rag-b.vercel.app/
- **Health Check**: https://04-rag-b.vercel.app/api/health

## What It Does

A **Retrieval-Augmented Generation (RAG)** application that lets users:

- Upload PDF documents or paste text content
- Ask AI questions about their documents
- Get context-aware answers based on document content
- Manage and delete uploaded documents

## ✨ Features Implemented

### Document Management

- PDF file upload (4MB max)
- Text paste functionality (30KB max)
- Document preview in list
- Delete documents with confirmation popup
- Document history per user (stored in Qdrant)

### AI Chat

- Ask questions about uploaded documents
- Context-aware responses using HyDE (Hypothetical Document Embeddings)
- Real-time chat
- Loading indicators during AI processing
- Error handling with user-friendly messages
- Powered by OpenAI API

### User Experience

- Unique user ID generation & localStorage persistence
- File size validation before upload
- Text length validation in real-time (with console warnings at 90%)
- Responsive design (mobile, tablet, desktop)
- Success/error message notifications (auto-dismiss in 5s)
- Disabled states for buttons during loading
- Chat input auto-disables when empty
- Auto-scroll to latest messages

### Backend APIs

- `POST /api/indexing` - Upload & index documents with embeddings
- `GET /api/documents/:userId` - Fetch all user documents
- `POST /api/chatHyDE` - Query documents with AI responses
- `DELETE /api/documents/:userId/:source` - Remove document
- `GET /api/health` - Health check endpoint

### Backend Stack

- Express.js server
- Multer for file uploads
- CORS enabled
- Environment-based configuration
- Error handling & logging

### Vector Database & AI

- Qdrant vector database integration
- Document chunking & embedding generation
- Semantic search with HyDE algorithm
- OpenAI embeddings API
- Context retrieval for accurate responses

### Frontend Stack

- Angular 17+ (standalone components)
- Tailwind CSS styling
- Two-panel layout (upload/documents + chat)
- Two-way data binding with ngModel
- RxJS Observable-based HTTP calls
- Component lifecycle hooks (AfterViewChecked, OnInit)

## Environment Variables (Vercel Dashboard)

Add these to **Settings → Environment Variables**:

```
OPENAI_API_KEY=your_openai_key
QDRANT_API_KEY=your_qdrant_key
QDRANT_URL=your_cluster_url
```

## Get API Keys

### OpenAI

1. Go to https://platform.openai.com/
2. API Keys → Create new secret key
3. Copy and save as `OPENAI_API_KEY`

### Qdrant Cloud

1. Go to https://cloud.qdrant.io/
2. Create cluster
3. Copy **API Key** → `QDRANT_API_KEY`
4. Copy **Cluster URL** → `QDRANT_URL`

## Deploy

### Backend

```bash
cd 04-rag-f
vercel deploy --prod
```

### Frontend

```bash
cd 04-rag-b
vercel deploy --prod
```

## Test

```bash
curl https://04-rag-b.vercel.app/api/health
# Response: {"status":"ok"}
```
