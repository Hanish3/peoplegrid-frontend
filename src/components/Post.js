import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Post.css';
import { format } from 'timeago.js';

function Post({ post, currentUser, onLike, onDelete, onDeleteComment }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);

  const isAuthor = currentUser && currentUser.user_id === post.authorId;

  const fetchComments = async () => {
    if (showComments) {
      setShowComments(false);
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/posts/${post.id}/comments`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setComments(res.data);
      setShowComments(true);
    } catch (error) {
      console.error('Failed to fetch comments', error);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/posts/${post.id}/comment`,
        { comment_text: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const newCommentData = {
        ...res.data,
        username: currentUser.username,
        user_id: currentUser.user_id,
      };
      setComments([...comments, newCommentData]);
      setNewComment('');
      setShowComments(true);
    } catch (error) {
      console.error('Failed to post comment', error);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/posts/${post.id}`);
    alert('Link copied to clipboard!');
  };

  return (
    <div className="card post">
      <div className="post-header">
        <img src={post.avatar} alt={post.author} className="avatar" />
        <div>
          <div className="post-author">
            <Link to={`/profile/${post.authorId}`}>{post.author}</Link>
          </div>
          <div className="post-timestamp">{format(post.timestamp)}</div>
        </div>
        {isAuthor && (
          <button className="delete-button" onClick={() => onDelete(post.id)}>
            &times;
          </button>
        )}
      </div>

      {post.title && <h3 className="post-title">{post.title}</h3>}

      {post.mediaUrl &&
        (post.mediaUrl.endsWith('.mp4') || post.mediaUrl.endsWith('.webm') ? (
          <video src={post.mediaUrl} controls className="post-media" />
        ) : (
          <img src={post.mediaUrl} alt="post media" className="post-media" />
        ))}

      <p className="post-content">{post.content}</p>

      <div className="post-stats">
        <span>{post.likeCount} Likes</span>
        <span>{post.commentCount} Comments</span>
      </div>

      <div className="post-actions">
        <button
          className={`action-button ${post.isLikedByUser ? 'liked' : ''}`}
          onClick={() => onLike(post.id)}
        >
          👍 Like
        </button>
        <button className="action-button" onClick={fetchComments}>
          💬 Comment
        </button>
        <button className="action-button" onClick={handleShare}>
          ↪️ Share
        </button>
      </div>

      {showComments && (
        <div className="comment-section">
          <form onSubmit={handleCommentSubmit} className="comment-form">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
            />
            <button type="submit">Post</button>
          </form>
          <div className="comment-list">
            {comments.map((c) => {
              const isCommentAuthor =
                currentUser && currentUser.user_id === c.user_id;

              return (
                <div key={c.comment_id} className="comment">
                  <div className="comment-header">
                    <strong>
                      <Link to={`/profile/${c.user_id}`}>{c.username}</Link>
                    </strong>
                    {isCommentAuthor && (
                      <button
                        className="comment-delete-button"
                        onClick={() =>
                          onDeleteComment(post.id, c.comment_id)
                        }
                      >
                        &times;
                      </button>
                    )}
                  </div>
                  <p>{c.comment_text}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default Post;
