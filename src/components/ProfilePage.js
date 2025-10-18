import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

// The component now accepts 'currentUser' to check if the profile belongs to the logged-in user
function ProfilePage({ currentUser }) {
  const [profileData, setProfileData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [photoFile, setPhotoFile] = useState(null);

  // Get the userId from the URL parameters
  const { userId } = useParams();

  // Determine if the profile being viewed is the logged-in user's own profile
  const isOwnProfile = currentUser && currentUser.user_id === parseInt(userId, 10);

  // This effect will run whenever the userId in the URL changes
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        // Fetch profile data based on the userId from the URL
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/profile/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfileData(response.data);
        setFormData(response.data); // Pre-fill form for editing
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        setError('Could not load profile data.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]); // Re-fetch when the userId changes

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    setPhotoFile(e.target.files[0]);
  };

  const handleSave = async () => {
    setError('');
    try {
      const token = localStorage.getItem('token');
      // Upload profile photo if a new one was selected
      if (photoFile) {
        const photoFormData = new FormData();
        photoFormData.append('profilePhoto', photoFile);
        await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/profile/upload-photo`, photoFormData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        });
      }

      // Update the rest of the profile data
      await axios.put(`${process.env.REACT_APP_BACKEND_URL}/api/profile`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setIsEditing(false);
      setPhotoFile(null);
      // Re-fetch the profile data to show the latest updates
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/profile/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfileData(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile.');
      console.error('Failed to update profile:', err);
    }
  };

  if (loading) return <div>Loading profile...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!profileData) return <div>Profile not found.</div>;

  const styles = {
    card: { backgroundColor: '#ffffff', padding: '2rem', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.15)', maxWidth: '600px', margin: '0 auto' },
    avatar: { width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover', marginBottom: '1rem', border: '4px solid #0d6efd' },
    username: { fontSize: '2rem', fontWeight: 'bold', margin: 0 },
    infoItem: { marginBottom: '1rem', color: '#65676b' },
    label: { fontWeight: 'bold', color: '#050505', display: 'block', marginBottom: '0.25rem' },
    button: { backgroundColor: '#0d6efd', color: 'white', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '6px', cursor: 'pointer', marginRight: '0.5rem' },
    input: { width: '100%', padding: '0.8rem', marginBottom: '1rem', borderRadius: '6px', border: '1px solid #ced0d4', boxSizing: 'border-box' },
  };

  return (
    <div style={styles.card}>
      <img
        src={profileData?.profile_picture_url || 'https://i.pravatar.cc/150'}
        alt="User Avatar"
        style={styles.avatar}
      />
      <h1 style={styles.username}>{profileData?.username}</h1>
      <p style={styles.infoItem}>{profileData?.email}</p>

      {isOwnProfile && isEditing ? (
        // EDITING VIEW (only for own profile)
        <div>
          <label style={styles.label}>Profile Photo</label>
          <input type="file" accept="image/*" onChange={handleFileChange} style={{...styles.input, padding: '0.5rem'}} />
          <label style={styles.label}>Username</label>
          <input type="text" name="username" value={formData.username || ''} onChange={handleInputChange} style={styles.input} />
          <label style={styles.label}>Bio</label>
          <textarea name="bio" value={formData.bio || ''} onChange={handleInputChange} style={{...styles.input, minHeight: '80px'}}></textarea>
          <label style={styles.label}>Age</label>
          <input type="number" name="age" value={formData.age || ''} onChange={handleInputChange} style={styles.input} />
          <label style={styles.label}>Pronouns</label>
          <input type="text" name="pronouns" value={formData.pronouns || ''} onChange={handleInputChange} style={styles.input} placeholder="e.g., he/him, she/her" />
          <label style={styles.label}>Relationship Status</label>
          <input type="text" name="relationship_status" value={formData.relationship_status || ''} onChange={handleInputChange} style={styles.input} />
          
          {error && <p style={{ color: '#dc3545', marginBottom: '1rem' }}>{error}</p>}
          
          <button onClick={handleSave} style={styles.button}>Save</button>
          <button onClick={() => { setIsEditing(false); setError(''); }} style={{ ...styles.button, backgroundColor: '#6c757d' }}>Cancel</button>
        </div>
      ) : (
        // VIEWING VIEW (for all profiles)
        <div>
          <div style={styles.infoItem}><span style={styles.label}>Bio:</span> {profileData?.bio || 'No bio set.'}</div>
          <div style={styles.infoItem}><span style={styles.label}>Age:</span> {profileData?.age || 'Not specified.'}</div>
          <div style={styles.infoItem}><span style={styles.label}>Pronouns:</span> {profileData?.pronouns || 'Not specified.'}</div>
          <div style={styles.infoItem}><span style={styles.label}>Status:</span> {profileData?.relationship_status || 'Not specified.'}</div>
          
          {/* Show "Edit Profile" button only if it's the user's own profile */}
          {isOwnProfile && (
            <button onClick={() => setIsEditing(true)} style={styles.button}>Edit Profile</button>
          )}
        </div>
      )}
    </div>
  );
}

export default ProfilePage;