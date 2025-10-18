import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import axios from 'axios';
import { io } from "socket.io-client";

// Component Imports
import LoginPage from './components/LoginPage';
import Header from './components/Header';
import CreatePost from './components/CreatePost';
import Post from './components/Post';
import ProfilePage from './components/ProfilePage';
import MessagesPage from './components/MessagesPage';
import FriendsPage from './components/FriendsPage';
import CampusGroupsPage from './components/CampusGroupsPage';

// CSS Imports
import './App.css';

// Axios interceptor to handle expired tokens
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login'; 
      alert("Your session has expired. Please log in again.");
    }
    return Promise.reject(error);
  }
);

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [posts, setPosts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [socket, setSocket] = useState(null);
  const [feedType, setFeedType] = useState('media');

  // Effect for managing the Socket.IO connection
  useEffect(() => {
    if (currentUser) {
      const newSocket = io(process.env.REACT_APP_BACKEND_URL || "http://localhost:3001");
      setSocket(newSocket);
      newSocket.emit("addUser", currentUser.user_id);

      return () => {
        newSocket.disconnect();
        setSocket(null);
      };
    }
  }, [currentUser]);

  // --- DATA FETCHING ---
  const fetchPosts = async () => {
    const currentToken = localStorage.getItem('token');
    if (!currentToken) return;
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/posts`, { 
        headers: { Authorization: `Bearer ${currentToken}` } 
      });
      const formattedPosts = response.data.map(post => ({
        id: post.post_id,
        author: post.username,
        authorId: post.user_id,
        avatar: post.profile_picture_url || `https://i.pravatar.cc/50?u=${post.user_id}`,
        timestamp: post.created_at,
        content: post.content,
        title: post.title,
        mediaUrl: post.media_url,
        post_type: post.post_type,
        likeCount: parseInt(post.like_count) || 0,
        commentCount: parseInt(post.comment_count) || 0,
        isLikedByUser: post.is_liked_by_user,
      }));
      setPosts(formattedPosts);
    } catch (error) { 
      console.error("Failed to fetch posts", error); 
    }
  };

  const fetchUserProfile = async (currentToken) => {
    if (!currentToken) return;
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/profile`, { 
        headers: { Authorization: `Bearer ${currentToken}` } 
      });
      setCurrentUser(response.data);
    } catch (error) { 
      console.error("Could not fetch user profile", error); 
    }
  };

  // Effect to fetch initial data when the token changes (e.g., on login)
  useEffect(() => {
    if (token) {
      fetchUserProfile(token);
      fetchPosts();
    }
  }, [token]);

  // --- HANDLER FUNCTIONS ---
  const handleLoginSuccess = (receivedToken) => {
    localStorage.setItem('token', receivedToken);
    setToken(receivedToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setCurrentUser(null);
  };
  
  const handleCreatePost = async (postData) => { /* ... your logic ... */ };
  const handleDeletePost = async (postId) => { /* ... your logic ... */ };
  const handleLikePost = async (postId) => { /* ... your logic ... */ };
  const handleDeleteComment = async (postId, commentId) => { /* ... your logic ... */ };

  // Filter posts based on the selected feed type for the home feed
  const filteredPosts = posts.filter(post => post.post_type === feedType);

  return (
    <Router>
      <div className="App">
        {token && <Header onLogout={handleLogout} currentUser={currentUser} />}
        
        <Routes>
          <Route path="/login" element={!token ? <LoginPage onLoginSuccess={handleLoginSuccess} /> : <Navigate to="/" />} />

          <Route path="/*" element={token ? (
            <main className="main-content">
              <aside className="left-sidebar">
                <h4>Navigation</h4>
                <ul className="nav-list">
                  <li><Link to="/">🏠 Home Feed</Link></li>
                  {currentUser && <li><Link to={`/profile/${currentUser.user_id}`}>👤 My Profile</Link></li>}
                  <li><Link to="/messages">💬 Messages</Link></li>
                  <li><Link to="/friends">👥 Friends</Link></li>
                  <li><Link to="/groups">🏛️ Campus Groups</Link></li>
                </ul>
              </aside>
              <section className="feed">
                <Routes>
                  <Route path="/" element={
                    <>
                      <CreatePost currentUser={currentUser} onCreatePost={handleCreatePost} feedType={feedType} setFeedType={setFeedType} />
                      {filteredPosts.map(post => (
                        <Post key={post.id} post={post} currentUser={currentUser} onDelete={handleDeletePost} onLike={handleLikePost} onDeleteComment={handleDeleteComment} />
                      ))}
                    </>
                  } />
                  <Route path="/profile/:userId" element={<ProfilePage currentUser={currentUser} />} />
                  <Route path="/messages" element={<MessagesPage socket={socket} currentUser={currentUser} />} />
                  <Route path="/friends" element={<FriendsPage />} />
                  <Route path="/groups" element={<CampusGroupsPage />} />
                  <Route path="*" element={<div>404 - Page Not Found</div>} />
                </Routes>
              </section>
              <aside className="right-sidebar">
                <div className="card right-sidebar-card"><h3>Friends Online</h3><ul className="friend-list"><li>Priya Sharma</li><li>Amit Singh</li></ul></div>
              </aside>
            </main>
          ) : (
            <Navigate to="/login" />
          )} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;