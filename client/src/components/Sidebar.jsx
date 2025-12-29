import { MessageSquarePlus, Trash2, Edit2 } from 'lucide-react';

function Sidebar({ chats, currentChatId, onSelectChat, onNewChat, onDeleteChat, isOpen }) {
  return (
    <aside className={`sidebar ${isOpen ? '' : 'collapsed'}`}>
      <div className="sidebar-header">
        <button className="new-chat-btn" onClick={onNewChat}>
          <MessageSquarePlus size={18} />
          New Chat
        </button>
      </div>

      <div className="chat-list">
        {chats.map(chat => (
          <div
            key={chat.id}
            className={`chat-item ${currentChatId === chat.id ? 'active' : ''}`}
            onClick={() => onSelectChat(chat.id)}
          >
            <span className="chat-item-title">{chat.title}</span>
            <div className="chat-item-actions">
              <button
                className="chat-item-btn delete"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteChat(chat.id);
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

export default Sidebar;
