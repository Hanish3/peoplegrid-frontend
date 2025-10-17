import React from 'react';
import './Header.css';

// Accept currentUser from App.js
function Header({ onLogout, currentUser }) {
  return (
    <header className="app-header">
      <div className="header-left">
        <h1 className="logo">PeopleGrid</h1>
        <input type="text" placeholder="Search PeopleGrid" className="search-bar" />
      </div>
      <div className="header-right">
        <span className="user-profile">Hello, {currentUser?.username || 'User'}!</span>
        <button onClick={onLogout} className="logout-button">Logout</button>
      </div>
    </header>
  );
}

export default Header;