import React from 'react';

function CampusGroupsPage() {
  const styles = {
    container: {
      backgroundColor: '#ffffff',
      padding: '4rem 2rem',
      borderRadius: '8px',
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.15)',
      textAlign: 'center',
      color: '#65676b',
    },
    icon: {
      fontSize: '4rem',
      marginBottom: '1rem',
    },
    title: {
      color: '#050505',
      fontSize: '2rem',
      fontWeight: 'bold',
      margin: 0,
    },
    subtitle: {
        fontSize: '1.1rem',
        marginTop: '0.5rem',
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.icon}>🏛️</div>
      <h1 style={styles.title}>Campus Groups are Coming Soon!</h1>
      <p style={styles.subtitle}>This feature is under construction. Get ready to connect with clubs and communities at NIAT.</p>
    </div>
  );
}

export default CampusGroupsPage;