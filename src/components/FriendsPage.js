import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

function FriendsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [friends, setFriends] = useState([]);

  // This function creates the authorization header object for API calls
  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
  }, []);

  // This function fetches the user's friends and pending requests
  const fetchData = useCallback(async () => {
    try {
      const [friendsRes, pendingRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/friends/list`, getAuthHeaders()),
        axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/friends/pending`, getAuthHeaders())
      ]);
      setFriends(friendsRes.data);
      setPendingRequests(pendingRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, [getAuthHeaders]);

  // Fetch initial data when the component mounts
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- API Call Functions ---
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
    };
    try {
      const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/friends/search?query=${searchQuery}`, getAuthHeaders());
      setSearchResults(res.data);
    } catch (error) {
      console.error("Error searching users:", error);
    }
  };

  const sendFriendRequest = async (recipientId) => {
    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/friends/request/${recipientId}`, {}, getAuthHeaders());
      alert("Friend request sent!");
      handleSearch(); // Refresh search results to potentially update button states
    } catch (error) {
      alert(error.response?.data?.error || "Could not send request.");
    }
  };

  const acceptFriendRequest = async (requesterId) => {
    try {
      await axios.put(`${process.env.REACT_APP_BACKEND_URL}/api/friends/accept/${requesterId}`, {}, getAuthHeaders());
      alert("Friend request accepted!");
      fetchData(); // Refresh friends and pending request lists
    } catch (error) {
      alert(error.response?.data?.error || "Could not accept request.");
    }
  };

  // --- STYLES ---
  const styles = {
    container: { maxWidth: '800px', margin: '0 auto', fontFamily: 'Arial, sans-serif' },
    section: { backgroundColor: '#fff', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
    h2: { marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '1rem' },
    searchBox: { display: 'flex', gap: '10px', marginBottom: '1rem' },
    input: { flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #ccc' },
    button: { padding: '10px 15px', borderRadius: '5px', border: 'none', backgroundColor: '#0d6efd', color: 'white', cursor: 'pointer' },
    userItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee' },
    avatar: { width: '40px', height: '40px', borderRadius: '50%', marginRight: '10px', objectFit: 'cover' },
  };

  return (
    <div style={styles.container}>
      {/* --- Search Section --- */}
      <div style={styles.section}>
        <h2 style={styles.h2}>Find Friends</h2>
        <div style={styles.searchBox}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by username..."
            style={styles.input}
          />
          <button onClick={handleSearch} style={styles.button}>Search</button>
        </div>
        {searchResults.map(user => (
          <div key={user.user_id} style={styles.userItem}>
            <div>
              <img src={user.profile_picture_url || 'https://i.pravatar.cc/40'} alt={user.username} style={styles.avatar} />
              <span>{user.username}</span>
            </div>
            <button onClick={() => sendFriendRequest(user.user_id)} style={styles.button}>Add Friend</button>
          </div>
        ))}
      </div>

      {/* --- Pending Requests Section --- */}
      {pendingRequests.length > 0 && (
        <div style={styles.section}>
          <h2 style={styles.h2}>Pending Requests</h2>
          {pendingRequests.map(user => (
            <div key={user.user_id} style={styles.userItem}>
              <div>
                <img src={user.profile_picture_url || 'https://i.pravatar.cc/40'} alt={user.username} style={styles.avatar} />
                <span>{user.username}</span>
              </div>
              <button onClick={() => acceptFriendRequest(user.user_id)} style={styles.button}>Accept</button>
            </div>
          ))}
        </div>
      )}

      {/* --- Friends List Section --- */}
      <div style={styles.section}>
        <h2 style={styles.h2}>Your Friends</h2>
        {friends.length === 0 ? <p>You haven't added any friends yet.</p> : friends.map(user => (
          <div key={user.user_id} style={styles.userItem}>
            <div>
              <img src={user.profile_picture_url || 'https://i.pravatar.cc/40'} alt={user.username} style={styles.avatar} />
              <span>{user.username}</span>
            </div>
            {/* Future: Add 'Remove Friend' button here */}
          </div>
        ))}
      </div>
    </div>
  );
}

export default FriendsPage;