// In src/App.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from "socket.io-client";
import LoginPage from './components/LoginPage';
import Header from './components/Header';
import CreatePost from './components/CreatePost';
import Post from './components/Post';
import ProfilePage from './components/ProfilePage';
import MessagesPage from './components/MessagesPage';
import FriendsPage from './components/FriendsPage';
import CampusGroupsPage from './components/CampusGroupsPage';
import './App.css';

// Axios interceptor to handle expired sessions
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.reload();
      alert("Your session has expired. Please log in again.");
    }
    return Promise.reject(error);
  }
);

function App() {
    const [token, setToken] = useState(null);
    const [posts, setPosts] = useState([]);
    const [activeView, setActiveView] = useState('feed');
    const [currentUser, setCurrentUser] = useState(null);
    const [socket, setSocket] = useState(null);
    // State to control which type of post to show in the feed
    const [feedType, setFeedType] = useState('media'); // 'media' or 'blog'

    // Effect for initializing and tearing down the socket connection
    useEffect(() => {
      if (currentUser) {
        const newSocket = io(process.env.REACT_APP_BACKEND_URL);
        setSocket(newSocket);
        newSocket.emit("addUser", currentUser.user_id);
        return () => {
          newSocket.disconnect();
          setSocket(null);
        };
      }
    }, [currentUser]);

    // Fetches all posts from the server
    const fetchPosts = async () => {
        const currentToken = localStorage.getItem('token');
        if (!currentToken) return;
        try {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/posts`, { headers: { Authorization: `Bearer ${currentToken}` } });
            
            // Format posts from the API response
            const formattedPosts = response.data.map(post => ({
                id: post.post_id,
                author: post.username,
                authorId: post.user_id, 
                avatar: post.profile_picture_url || 'https://i.pravatar.cc/50',
                timestamp: post.created_at,
                content: post.content,
                title: post.title,
                mediaUrl: post.media_url,
                post_type: post.post_type, // Added post_type for filtering
                likeCount: parseInt(post.like_count) || 0,
                commentCount: parseInt(post.comment_count) || 0,
                isLikedByUser: post.is_liked_by_user,
            }));
            setPosts(formattedPosts);
        } catch (error) { console.error("Failed to fetch posts", error); }
    };
    
    // Fetches the current user's profile information
    const fetchUserProfile = async (currentToken) => {
        if (!currentToken) return;
        try {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/profile`, { headers: { Authorization: `Bearer ${currentToken}` } });
            setCurrentUser(response.data);
        } catch (error) { console.error("Could not fetch user profile", error); }
    };

    // Effect to check for a stored token on initial component mount
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            fetchUserProfile(storedToken);
            fetchPosts();
        }
    }, []);

    const handleLoginSuccess = (receivedToken) => {
        localStorage.setItem('token', receivedToken);
        setToken(receivedToken);
        fetchUserProfile(receivedToken);
        fetchPosts();
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setCurrentUser(null);
    };

    const handleCreatePost = async (postData) => {
        const { postType, content, title, mediaFile } = postData;
        const formData = new FormData();
        formData.append('post_type', postType);
        formData.append('content', content);
        if (title) formData.append('title', title);
        if (mediaFile) formData.append('mediaFile', mediaFile);
        
        try {
            await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/posts`, formData, {
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}` 
                }
            });
            fetchPosts(); // Re-fetch posts to show the new one
        } catch (error) { console.error("Failed to create post", error); }
    };

    const handleDeletePost = async (postId) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/api/posts/${postId}`, { headers: { Authorization: `Bearer ${token}` } });
            fetchPosts(); // Re-fetch posts after deletion
        } catch (error) { console.error("Failed to delete post", error); alert("Not authorized."); }
    };

    const handleLikePost = async (postId) => {
        try {
            await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/posts/${postId}/like`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchPosts(); // Re-fetch to update like count and status
        } catch (error) { console.error("Failed to like post", error); }
    };

    const handleDeleteComment = async (postId, commentId) => {
        if (!window.confirm("Are you sure you want to delete this comment?")) {
            return;
        }
        try {
            await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/api/posts/${postId}/comments/${commentId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // A better UX would update state, but for now, this works
            alert("Comment deleted. Please reopen the comment section to see the update.");
        } catch (error) {
            console.error("Failed to delete comment", error);
            alert("You are not authorized to delete this comment.");
        }
    };

    // Renders the main content view based on the 'activeView' state
    const RenderActiveView = () => {
        switch (activeView) {
            case 'feed': 
                // Filter posts based on the selected feedType
                const filteredPosts = posts.filter(post => post.post_type === feedType);
                return (
                    <>
                        <CreatePost 
                            currentUser={currentUser} 
                            onCreatePost={handleCreatePost}
                            feedType={feedType}
                            setFeedType={setFeedType} 
                        />
                        {filteredPosts.map(post => (
                            <Post 
                                key={post.id} 
                                post={post} 
                                currentUser={currentUser} 
                                onDelete={handleDeletePost} 
                                onLike={handleLikePost}
                                onDeleteComment={handleDeleteComment} 
                            />
                        ))}
                    </>
                );
            case 'profile': return <ProfilePage />;
            case 'messages': return <MessagesPage socket={socket} currentUser={currentUser} />;
            case 'friends': return <FriendsPage />;
            case 'groups': return <CampusGroupsPage />;
            default: return <div>Page not found.</div>;
        }
    };

    if (!token) { return <LoginPage onLoginSuccess={handleLoginSuccess} />; }

    return (
        <div className="App">
            <Header onLogout={handleLogout} currentUser={currentUser} />
            <main className="main-content">
                <aside className="left-sidebar">
                    <h4>Navigation</h4>
                    <ul className="nav-list">
                        <li className={activeView === 'feed' ? 'active' : ''} onClick={() => setActiveView('feed')}>🏠 Home Feed</li>
                        <li className={activeView === 'profile' ? 'active' : ''} onClick={() => setActiveView('profile')}>👤 My Profile</li>
                        <li className={activeView === 'messages' ? 'active' : ''} onClick={() => setActiveView('messages')}>💬 Messages</li>
                        <li className={activeView === 'friends' ? 'active' : ''} onClick={() => setActiveView('friends')}>👥 Friends</li>
                        <li className={activeView === 'groups' ? 'active' : ''} onClick={() => setActiveView('groups')}>🏛️ Campus Groups</li>
                    </ul>
                </aside>
                <section className="feed">
                    <RenderActiveView />
                </section>
                <aside className="right-sidebar">
                    <div className="card right-sidebar-card"><h3>Friends Online</h3><ul className="friend-list"><li>Priya Sharma</li><li>Amit Singh</li></ul></div>
                </aside>
            </main>
        </div>
    );
}

export default App;