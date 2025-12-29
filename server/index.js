require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const OpenAI = require('openai');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure directories exist
const dataDir = path.join(__dirname, 'data');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

// Chat storage helpers
const chatsFile = path.join(dataDir, 'chats.json');

function loadChats() {
  try {
    if (fs.existsSync(chatsFile)) {
      return JSON.parse(fs.readFileSync(chatsFile, 'utf-8'));
    }
  } catch (err) {
    console.error('Error loading chats:', err);
  }
  return {};
}

function saveChats(chats) {
  fs.writeFileSync(chatsFile, JSON.stringify(chats, null, 2));
}

// API Routes

// Get all chats
app.get('/api/chats', (req, res) => {
  const chats = loadChats();
  const chatList = Object.values(chats)
    .map(chat => ({
      id: chat.id,
      title: chat.title,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    }))
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  res.json(chatList);
});

// Get single chat
app.get('/api/chats/:id', (req, res) => {
  const chats = loadChats();
  const chat = chats[req.params.id];
  if (!chat) {
    return res.status(404).json({ error: 'Chat not found' });
  }
  res.json(chat);
});

// Create new chat
app.post('/api/chats', (req, res) => {
  const chats = loadChats();
  const id = uuidv4();
  const now = new Date().toISOString();
  const chat = {
    id,
    title: 'New Chat',
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
  chats[id] = chat;
  saveChats(chats);
  res.json(chat);
});

// Delete chat
app.delete('/api/chats/:id', (req, res) => {
  const chats = loadChats();
  if (!chats[req.params.id]) {
    return res.status(404).json({ error: 'Chat not found' });
  }
  delete chats[req.params.id];
  saveChats(chats);
  res.json({ success: true });
});

// Update chat title
app.patch('/api/chats/:id', (req, res) => {
  const chats = loadChats();
  const chat = chats[req.params.id];
  if (!chat) {
    return res.status(404).json({ error: 'Chat not found' });
  }
  if (req.body.title) {
    chat.title = req.body.title;
  }
  chat.updatedAt = new Date().toISOString();
  saveChats(chats);
  res.json(chat);
});

// Upload file
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({
    filename: req.file.filename,
    originalName: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    url: `/uploads/${req.file.filename}`,
  });
});

// Send message (streaming with web search enabled by default)
app.post('/api/chats/:id/messages', async (req, res) => {
  const { message, attachments = [], webSearch = true } = req.body;
  const chats = loadChats();
  const chat = chats[req.params.id];

  if (!chat) {
    return res.status(404).json({ error: 'Chat not found' });
  }

  // Save user message
  const userMessage = {
    id: uuidv4(),
    role: 'user',
    content: message,
    attachments,
    createdAt: new Date().toISOString(),
  };
  chat.messages.push(userMessage);

  // Update chat title if first message
  if (chat.messages.length === 1 && message) {
    chat.title = message.substring(0, 50) + (message.length > 50 ? '...' : '');
  }

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    // Build input for Responses API
    const input = [];

    // Add conversation history
    for (const msg of chat.messages) {
      if (msg.role === 'user') {
        const content = [];
        if (msg.content) {
          content.push({ type: 'input_text', text: msg.content });
        }
        // Add image attachments
        for (const att of msg.attachments || []) {
          if (att.mimetype?.startsWith('image/')) {
            const imagePath = path.join(uploadsDir, att.filename);
            if (fs.existsSync(imagePath)) {
              const imageData = fs.readFileSync(imagePath);
              const base64Image = imageData.toString('base64');
              content.push({
                type: 'input_image',
                image_url: `data:${att.mimetype};base64,${base64Image}`,
              });
            }
          } else if (att.mimetype?.startsWith('text/') ||
                     att.originalName?.endsWith('.txt') ||
                     att.originalName?.endsWith('.md') ||
                     att.originalName?.endsWith('.json') ||
                     att.originalName?.endsWith('.csv')) {
            const filePath = path.join(uploadsDir, att.filename);
            if (fs.existsSync(filePath)) {
              const fileContent = fs.readFileSync(filePath, 'utf-8');
              content.push({
                type: 'input_text',
                text: `[File: ${att.originalName}]\n${fileContent}`,
              });
            }
          }
        }
        input.push({ role: 'user', content });
      } else if (msg.role === 'assistant') {
        input.push({ role: 'assistant', content: [{ type: 'output_text', text: msg.content }] });
      }
    }

    // Configure tools - web search enabled by default
    const tools = webSearch ? [{ type: 'web_search_preview' }] : [];

    // Use Responses API with streaming (gpt-5.2 is the latest model)
    const stream = await openai.responses.create({
      model: 'gpt-5.2',
      input,
      tools,
      stream: true,
    });

    let assistantContent = '';
    let citations = [];

    for await (const event of stream) {
      // Handle different event types
      if (event.type === 'response.output_text.delta') {
        const content = event.delta || '';
        if (content) {
          assistantContent += content;
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      } else if (event.type === 'response.output_text.annotation.added') {
        // Collect citations from web search
        if (event.annotation) {
          citations.push(event.annotation);
        }
      }
    }

    // Format citations if any
    if (citations.length > 0) {
      let citationText = '\n\n---\n**Sources:**\n';
      citations.forEach((cite, i) => {
        if (cite.url && cite.title) {
          citationText += `${i + 1}. [${cite.title}](${cite.url})\n`;
        }
      });
      assistantContent += citationText;
      res.write(`data: ${JSON.stringify({ content: citationText })}\n\n`);
    }

    // Save assistant message
    const assistantMessage = {
      id: uuidv4(),
      role: 'assistant',
      content: assistantContent,
      citations,
      createdAt: new Date().toISOString(),
    };
    chat.messages.push(assistantMessage);
    chat.updatedAt = new Date().toISOString();
    saveChats(chats);

    res.write(`data: ${JSON.stringify({ done: true, messageId: assistantMessage.id })}\n\n`);
    res.end();
  } catch (error) {
    console.error('OpenAI Error:', error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

// Generate image
app.post('/api/generate-image', async (req, res) => {
  const { prompt, size = '1024x1024' } = req.body;

  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size,
    });

    res.json({
      url: response.data[0].url,
      revisedPrompt: response.data[0].revised_prompt,
    });
  } catch (error) {
    console.error('Image generation error:', error);
    res.status(500).json({ error: error.message });
  }
});


// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
