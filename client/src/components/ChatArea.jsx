import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { User, Bot, Image, Globe, Sparkles, Code, Copy, Check, Download } from 'lucide-react';

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
      className={`copy-btn ${copied ? 'copied' : ''}`}
      onClick={handleCopy}
      title={copied ? 'Copied!' : 'Copy to clipboard'}
    >
      {copied ? <Check size={16} /> : <Copy size={16} />}
    </button>
  );
}

function DownloadButton({ imageUrl }) {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `generated-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button className="copy-btn" onClick={handleDownload} title="Download image">
      <Download size={16} />
    </button>
  );
}

function ChatArea({ chat, isLoading, streamingMessage, streamingImage, onNewChat, webSearchEnabled, onToggleWebSearch }) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat?.messages, streamingMessage, streamingImage]);

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

            <div className="feature-card" onClick={onNewChat}>
              <div className="feature-card-icon">
                <Image size={20} />
              </div>
              <div className="feature-card-title">Create an image</div>
              <div className="feature-card-desc">Say "generate an image of..."</div>
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
              {/* Display generated image */}
              {message.image && (
                <div className="generated-image-container">
                  <img src={message.image} alt="Generated" className="generated-image" />
                </div>
              )}
              {/* Only show text content if it's not just the markdown image */}
              {message.content && !message.content.startsWith('![Generated Image]') && (
                <ReactMarkdown>{message.content}</ReactMarkdown>
              )}
              {message.role === 'assistant' && (
                <div className="message-actions">
                  <CopyButton text={message.content} />
                  {message.image && <DownloadButton imageUrl={message.image} />}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Streaming message */}
        {(streamingMessage || streamingImage) && (
          <div className="message">
            <div className="message-avatar assistant">
              <Bot size={18} color="white" />
            </div>
            <div className="message-content">
              {streamingImage && (
                <div className="generated-image-container">
                  <img src={streamingImage} alt="Generated" className="generated-image" />
                </div>
              )}
              {streamingMessage && !streamingMessage.startsWith('![Generated Image]') && (
                <ReactMarkdown>{streamingMessage}</ReactMarkdown>
              )}
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && !streamingMessage && !streamingImage && (
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
