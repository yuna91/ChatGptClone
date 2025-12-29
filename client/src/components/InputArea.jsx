import { useState, useRef, useEffect } from 'react';
import { Paperclip, Image, Globe, Send, X, FileText } from 'lucide-react';

function InputArea({
  onSend,
  onFileUpload,
  attachments,
  onRemoveAttachment,
  isLoading,
  onShowImageModal,
  webSearchEnabled,
  onToggleWebSearch,
}) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  }, [message]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() || attachments.length > 0) {
      onSend(message);
      setMessage('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      onFileUpload(files);
    }
    e.target.value = '';
  };

  return (
    <div className="input-area">
      <div className="input-container">
        {/* Attachments preview */}
        {attachments.length > 0 && (
          <div className="attachments-preview">
            {attachments.map((att, i) => (
              <div key={i} className="attachment-item">
                {att.mimetype?.startsWith('image/') ? (
                  <img src={att.url} alt={att.originalName} />
                ) : (
                  <>
                    <FileText size={16} />
                    <span>{att.originalName}</span>
                  </>
                )}
                <button
                  className="remove-attachment"
                  onClick={() => onRemoveAttachment(i)}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <form className="input-box" onSubmit={handleSubmit}>
          <div className="input-actions">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              accept="image/*,.txt,.md,.json,.csv,.pdf"
              style={{ display: 'none' }}
            />
            <button
              type="button"
              className="input-action-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Attach file"
            >
              <Paperclip size={20} />
            </button>
            <button
              type="button"
              className="input-action-btn"
              onClick={onShowImageModal}
              title="Generate image"
            >
              <Image size={20} />
            </button>
            <button
              type="button"
              className={`input-action-btn ${webSearchEnabled ? 'active' : ''}`}
              onClick={onToggleWebSearch}
              title={webSearchEnabled ? "Web search ON (click to disable)" : "Web search OFF (click to enable)"}
            >
              <Globe size={20} />
            </button>
          </div>

          <textarea
            ref={textareaRef}
            className="message-input"
            placeholder={webSearchEnabled ? "Ask anything (web search enabled)..." : "Message ChatGPT..."}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={isLoading}
          />

          <button
            type="submit"
            className="send-btn"
            disabled={isLoading || (!message.trim() && attachments.length === 0)}
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}

export default InputArea;
