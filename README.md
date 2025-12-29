# ChatGPT Clone

A full-featured ChatGPT clone with chat, image generation, search, and file attachments.

## Features

- **Chat**: Real-time streaming responses with GPT-4o
- **Image Generation**: Create images with DALL-E 3
- **Search Mode**: Get information on topics
- **File Attachments**: Upload images and text files
- **Chat History**: Persistent chat storage
- **Delete Chats**: Remove unwanted conversations

## Setup

1. **Install dependencies**:
   ```bash
   npm run install-all
   ```

2. **Configure API Key**:
   Edit `.env` file and add your OpenAI API key:
   ```
   OPENAI_API_KEY=sk-your-api-key-here
   ```

3. **Start the app**:
   ```bash
   npm run dev
   ```

4. Open http://localhost:3000 in your browser

## Project Structure

```
ChatGptClone/
├── server/
│   ├── index.js        # Express backend
│   ├── data/           # Chat storage
│   └── uploads/        # Uploaded files
├── client/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── ChatArea.jsx
│   │   │   ├── InputArea.jsx
│   │   │   └── ImageModal.jsx
│   │   └── styles/
│   │       └── index.css
│   └── index.html
├── .env                # Your API key (create this)
├── .env.example        # Example env file
└── package.json
```

## API Endpoints

- `GET /api/chats` - List all chats
- `POST /api/chats` - Create new chat
- `GET /api/chats/:id` - Get chat by ID
- `DELETE /api/chats/:id` - Delete chat
- `POST /api/chats/:id/messages` - Send message (streaming)
- `POST /api/upload` - Upload file
- `POST /api/generate-image` - Generate image with DALL-E
- `POST /api/search` - Search query
