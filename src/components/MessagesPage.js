import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// The main component that receives the socket connection and current user info
function MessagesPage({ socket, currentUser }) {
  const [friends, setFriends] = useState([]);
  const [activeChat, setActiveChat] = useState(null); // The friend you are chatting with
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef();

  // --- Data Fetching ---
  useEffect(() => {
    const getFriends = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:3001/api/friends/list', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFriends(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    getFriends();
  }, []);

  useEffect(() => {
    const getMessages = async () => {
      if (!activeChat) return;
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:3001/api/messages/${activeChat.user_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessages(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    getMessages();
  }, [activeChat]);

  // --- Real-time Logic ---
  useEffect(() => {
    if (socket) {
      socket.on("receiveMessage", (data) => {
        // Only update messages if the incoming message is from the person we're actively chatting with
        if (activeChat && data.sender_id === activeChat.user_id) {
          setMessages((prev) => [...prev, data]);
        }
      });
    }
  }, [socket, activeChat]);

  // --- Auto-scroll to bottom ---
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    socket.emit("sendMessage", {
      senderId: currentUser.user_id,
      receiverId: activeChat.user_id,
      text: newMessage,
    });

    // Optimistically update our own messages
    setMessages([...messages, { sender_id: currentUser.user_id, message_text: newMessage }]);
    setNewMessage('');
  };

  // --- STYLES ---
  const styles = {
    container: { display: 'flex', height: 'calc(100vh - 100px)', fontFamily: 'Arial' },
    friendsList: { flex: 1, borderRight: '1px solid #ccc', padding: '10px', overflowY: 'auto' },
    chatBox: { flex: 3, display: 'flex', flexDirection: 'column' },
    chatWindow: { flex: 1, padding: '10px', overflowY: 'auto', display: 'flex', flexDirection: 'column' },
    messageInput: { display: 'flex', padding: '10px', borderTop: '1px solid #ccc' },
    input: { flex: 1, padding: '10px', borderRadius: '20px', border: '1px solid #ccc' },
    button: { padding: '10px 15px', borderRadius: '20px', border: 'none', backgroundColor: '#0d6efd', color: 'white', marginLeft: '10px' },
    message: { maxWidth: '60%', padding: '10px', borderRadius: '10px', marginBottom: '10px' },
    ownMessage: { alignSelf: 'flex-end', backgroundColor: '#0d6efd', color: 'white' },
    friendMessage: { alignSelf: 'flex-start', backgroundColor: '#f0f0f0' },
  };

  return (
    <div style={styles.container}>
      {/* Friends List */}
      <div style={styles.friendsList}>
        <h2>Chats</h2>
        {friends.map(f => (
          <div key={f.user_id} onClick={() => setActiveChat(f)} style={{ padding: '10px', cursor: 'pointer', backgroundColor: activeChat?.user_id === f.user_id ? '#e0e0e0' : 'transparent' }}>
            {f.username}
          </div>
        ))}
      </div>

      {/* Chat Box */}
      <div style={styles.chatBox}>
        {activeChat ? (
          <>
            <div style={{ padding: '10px', borderBottom: '1px solid #ccc', fontWeight: 'bold' }}>{activeChat.username}</div>
            <div style={styles.chatWindow}>
              {messages.map((m, index) => (
                <div key={index} ref={scrollRef}>
                  <p style={{...styles.message, ...(m.sender_id === currentUser.user_id ? styles.ownMessage : styles.friendMessage)}}>
                    {m.message_text}
                  </p>
                </div>
              ))}
            </div>
            <form onSubmit={handleSubmit} style={styles.messageInput}>
              <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} style={styles.input} placeholder="Type a message..." />
              <button style={styles.button}>Send</button>
            </form>
          </>
        ) : (
          <div style={{ margin: 'auto', color: '#888' }}>Select a friend to start chatting.</div>
        )}
      </div>
    </div>
  );
}

export default MessagesPage;