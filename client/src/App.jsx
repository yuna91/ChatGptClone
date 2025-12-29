import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import InputArea from './components/InputArea';
import {
  Menu,
  ChevronDown,
} from 'lucide-react';

function App() {
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [currentChat, setCurrentChat] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [streamingImage, setStreamingImage] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [webSearchEnabled, setWebSearchEnabled] = useState(true); // Web search ON by default

  // Fetch chats on mount
  useEffect(() => {
    fetchChats();
  }, []);

  // Fetch current chat when ID changes
  useEffect(() => {
    if (currentChatId) {
      fetchChat(currentChatId);
    } else {
      setCurrentChat(null);
    }
  }, [currentChatId]);

  const fetchChats = async () => {
    try {
      const res = await fetch('/api/chats');
      const data = await res.json();
      setChats(data);
    } catch (err) {
      console.error('Failed to fetch chats:', err);
    }
  };

  const fetchChat = async (id) => {
    try {
      const res = await fetch(`/api/chats/${id}`);
      const data = await res.json();
      setCurrentChat(data);
    } catch (err) {
      console.error('Failed to fetch chat:', err);
    }
  };

  const createNewChat = async () => {
    try {
      const res = await fetch('/api/chats', { method: 'POST' });
      const newChat = await res.json();
      setChats(prev => [newChat, ...prev]);
      setCurrentChatId(newChat.id);
      setAttachments([]);
    } catch (err) {
      console.error('Failed to create chat:', err);
    }
  };

  const deleteChat = async (id) => {
    try {
      await fetch(`/api/chats/${id}`, { method: 'DELETE' });
      setChats(prev => prev.filter(chat => chat.id !== id));
      if (currentChatId === id) {
        setCurrentChatId(null);
      }
    } catch (err) {
      console.error('Failed to delete chat:', err);
    }
  };

  const sendMessage = async (message) => {
    if (!message.trim() && attachments.length === 0) return;

    let chatId = currentChatId;

    // Create new chat if none selected
    if (!chatId) {
      try {
        const res = await fetch('/api/chats', { method: 'POST' });
        const newChat = await res.json();
        chatId = newChat.id;
        setChats(prev => [newChat, ...prev]);
        setCurrentChatId(chatId);
      } catch (err) {
        console.error('Failed to create chat:', err);
        return;
      }
    }

    // Add user message optimistically
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      attachments: [...attachments],
      createdAt: new Date().toISOString(),
    };

    setCurrentChat(prev => prev ? {
      ...prev,
      messages: [...prev.messages, userMessage],
    } : {
      id: chatId,
      messages: [userMessage],
    });

    setAttachments([]);
    setIsLoading(true);
    setStreamingMessage('');
    setStreamingImage(null);

    try {
      // Chat with streaming (web search enabled by default)
      const response = await fetch(`/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, attachments, webSearch: webSearchEnabled }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let generatedImage = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                fullContent += data.content;
                setStreamingMessage(fullContent);
              }
              if (data.image) {
                generatedImage = data.image;
                setStreamingImage(data.image);
              }
              if (data.done) {
                const assistantMessage = {
                  id: data.messageId,
                  role: 'assistant',
                  content: fullContent,
                  image: generatedImage,
                  createdAt: new Date().toISOString(),
                };
                setCurrentChat(prev => ({
                  ...prev,
                  messages: [...prev.messages, assistantMessage],
                }));
                setStreamingMessage('');
                setStreamingImage(null);
              }
              if (data.error) {
                console.error('Stream error:', data.error);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      // Refresh chat list
      fetchChats();
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (files) => {
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        setAttachments(prev => [...prev, data]);
      } catch (err) {
        console.error('Failed to upload file:', err);
      }
    }
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="app">
      <Sidebar
        chats={chats}
        currentChatId={currentChatId}
        onSelectChat={setCurrentChatId}
        onNewChat={createNewChat}
        onDeleteChat={deleteChat}
        isOpen={sidebarOpen}
      />

      <div className="main-content">
        <header className="main-header">
          <button
            className="toggle-sidebar-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu size={20} />
          </button>
          <button className="model-selector">
            GPT-5.2 <ChevronDown size={16} />
          </button>
        </header>

        <ChatArea
          chat={currentChat}
          isLoading={isLoading}
          streamingMessage={streamingMessage}
          streamingImage={streamingImage}
          onNewChat={createNewChat}
          webSearchEnabled={webSearchEnabled}
          onToggleWebSearch={() => setWebSearchEnabled(!webSearchEnabled)}
        />

        <InputArea
          onSend={sendMessage}
          onFileUpload={handleFileUpload}
          attachments={attachments}
          onRemoveAttachment={removeAttachment}
          isLoading={isLoading}
          webSearchEnabled={webSearchEnabled}
          onToggleWebSearch={() => setWebSearchEnabled(!webSearchEnabled)}
        />
      </div>
    </div>
  );
}

export default App;
