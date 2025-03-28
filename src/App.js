import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import WeeklyList from './components/WeeklyList';
import ChoreAssignment from './components/ChoreAssignment';
import ChildManagement from './components/ChildManagement';
import Settings from './components/Settings';
import Login from './components/Login';
import { fetchCoziCalendarEvents } from './services/coziService';
import { fetchChores, fetchChildren } from './services/dataService';
import './styles/App.css';

function App() {
  const [user, setUser] = useState(null);
  const [chores, setChores] = useState([]);
  const [children, setChildren] = useState([]);
  const [coziEvents, setCoziEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const loggedInUser = localStorage.getItem('user');
    if (loggedInUser) {
      setUser(JSON.parse(loggedInUser));
      loadData();
    } else {
      setLoading(false);
    }
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load all required data in parallel
      const [choresData, childrenData, coziEventsData] = await Promise.all([
        fetchChores(),
        fetchChildren(),
        fetchCoziCalendarEvents()
      ]);
      
      setChores(choresData);
      setChildren(childrenData);
      setCoziEvents(coziEventsData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load application data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    loadData();
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  if (loading) {
    return <div className="loading-container">Loading Family Chore Manager...</div>;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  return (
    <Router>
      <div className="app-container">
        {user ? (
          <>
            <Header user={user} onLogout={handleLogout} />
            <main className="main-content">
              <Routes>
                <Route path="/" element={
                  <Dashboard 
                    chores={chores} 
                    children={children}
                    coziEvents={coziEvents}
                  />
                } />
                <Route path="/weekly" element={
                  <WeeklyList 
                    chores={chores} 
                    children={children}
                    coziEvents={coziEvents}
                  />
                } />
                <Route path="/assign" element={
                  <ChoreAssignment 
                    chores={chores} 
                    children={children}
                    setChores={setChores}
                  />
                } />
                <Route path="/children" element={
                  <ChildManagement 
                    children={children}
                    setChildren={setChildren}
                  />
                } />
                <Route path="/settings" element={
                  <Settings 
                    user={user}
                    setUser={setUser}
                  />
                } />
              </Routes>
            </main>
          </>
        ) : (
          <Login onLogin={handleLogin} />
        )}
      </div>
    </Router>
  );
}

export default App;
