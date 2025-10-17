import React, { useState } from 'react';
import './CreatePost.css';

// Accept feedType and setFeedType from App.js
function CreatePost({ currentUser, onCreatePost, feedType, setFeedType }) {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [mediaFile, setMediaFile] = useState(null);

  const handleSubmit = () => {
    onCreatePost({ postType: feedType, content, title, mediaFile });
    setContent('');
    setTitle('');
    setMediaFile(null);
  };
  
  const placeholderText = feedType === 'blog' 
    ? "Write your blog post content here..."
    : `What's on your mind, ${currentUser?.username || 'User'}?`;

  return (
    <div className="card create-post">
      <div className="post-type-selector">
        <button onClick={() => setFeedType('media')} className={feedType === 'media' ? 'active' : ''}>Photo/Video</button>
        <button onClick={() => setFeedType('blog')} className={feedType === 'blog' ? 'active' : ''}>Blog Post</button>
      </div>

      <div className="create-post-body">
        <img src={currentUser?.profile_picture_url || 'https://i.pravatar.cc/50'} alt="user" className="avatar" />
        <div className="inputs-container">
          {feedType === 'blog' && (
            <input type="text" placeholder="Blog Title..." value={title} onChange={(e) => setTitle(e.target.value)} className="title-input"/>
          )}
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder={placeholderText}></textarea>
          {feedType === 'media' && (
            <input type="file" accept="image/*,video/*" onChange={(e) => setMediaFile(e.target.files[0])} style={{marginTop: '10px'}}/>
          )}
        </div>
      </div>
      
      <div className="create-post-actions">
        <button className="post-button" onClick={handleSubmit}>Post</button>
      </div>
    </div>
  );
}

export default CreatePost;