import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { User, Bot, Image, Globe, Sparkles, Code } from 'lucide-react';

function ChatArea({ chat, isLoading, streamingMessage, onNewChat, onShowImageModal, webSearchEnabled, onToggleWebSearch }) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat?.messages, streamingMessage]);

  // Welcome screen when no chat selected
  if (!chat || chat.messages.length === 0) {
    return (
      <div className="chat-area">
        <div className="welcome-screen">
          <div className="welcome-logo">
            <Sparkles size={32} color="white" />
          </div>
          <h1 className="welcome-title">How can I help you today?</h1>

          <div className="feature-grid">
            <div className="feature-card" onClick={onNewChat}>
              <div className="feature-card-icon">
                <Sparkles size={20} />
              </div>
              <div className="feature-card-title">Start a conversation</div>
              <div className="feature-card-desc">Chat about any topic</div>
            </div>

            <div className="feature-card" onClick={onShowImageModal}>
              <div className="feature-card-icon">
                <Image size={20} />
              </div>
              <div className="feature-card-title">Create an image</div>
              <div className="feature-card-desc">Generate with DALL-E 3</div>
            </div>

            <div className="feature-card" onClick={onToggleWebSearch}>
              <div className="feature-card-icon">
                <Globe size={20} />
              </div>
              <div className="feature-card-title">Web Search {webSearchEnabled ? 'ON' : 'OFF'}</div>
              <div className="feature-card-desc">Toggle real-time web search</div>
            </div>

            <div className="feature-card" onClick={onNewChat}>
              <div className="feature-card-icon">
                <Code size={20} />
              </div>
              <div className="feature-card-title">Help with code</div>
              <div className="feature-card-desc">Debug and write code</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-area">
      <div className="messages-container">
        {chat.messages.map((message) => (
          <div key={message.id} className="message">
            <div className={`message-avatar ${message.role}`}>
              {message.role === 'user' ? (
                <User size={18} color="white" />
              ) : (
                <Bot size={18} color="white" />
              )}
            </div>
            <div className="message-content">
              {message.attachments?.length > 0 && (
                <div className="message-attachments">
                  {message.attachments.map((att, i) => (
                    att.mimetype?.startsWith('image/') ? (
                      <img
                        key={i}
                        src={att.url}
                        alt={att.originalName}
                        className="attachment-preview"
                      />
                    ) : (
                      <div key={i} className="attachment-file">
                        {att.originalName}
                      </div>
                    )
                  ))}
                </div>
              )}
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          </div>
        ))}

        {/* Streaming message */}
        {streamingMessage && (
          <div className="message">
            <div className="message-avatar assistant">
              <Bot size={18} color="white" />
            </div>
            <div className="message-content">
              <ReactMarkdown>{streamingMessage}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && !streamingMessage && (
          <div className="message">
            <div className="message-avatar assistant">
              <Bot size={18} color="white" />
            </div>
            <div className="message-content">
              <div className="typing-indicator">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

export default ChatArea;
