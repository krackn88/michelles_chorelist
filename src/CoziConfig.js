import React, { useState, useEffect } from 'react';
import { 
  connectCoziAccount, 
  disconnectCoziAccount, 
  isCoziConnected,
  getCoziEmail
} from '../services/coziService';
import '../styles/CoziConfig.css';

function CoziConfig() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [connected, setConnected] = useState(false);
  const [connectedEmail, setConnectedEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if already connected to Cozi
    const connected = isCoziConnected();
    setConnected(connected);
    
    if (connected) {
      setConnectedEmail(getCoziEmail());
    }
  }, []);

  const handleConnect = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setMessage('Please enter both email and password');
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    try {
      const result = await connectCoziAccount(email, password);
      
      if (result.success) {
        setConnected(true);
        setConnectedEmail(email);
        setMessage(result.message);
        setPassword(''); // Clear password for security
      } else {
        setMessage(result.message);
      }
    } catch (error) {
      setMessage('An error occurred while connecting to Cozi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    
    try {
      const result = disconnectCoziAccount();
      
      if (result.success) {
        setConnected(false);
        setConnectedEmail('');
        setEmail('');
        setMessage(result.message);
      } else {
        setMessage(result.message);
      }
    } catch (error) {
      setMessage('An error occurred while disconnecting from Cozi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cozi-config-container">
      <h2>Cozi Calendar Integration</h2>
      
      {message && (
        <div className={`message ${message.includes('Successfully') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}
      
      {!connected ? (
        <form onSubmit={handleConnect} className="cozi-form">
          <div className="form-group">
            <label htmlFor="email">Cozi Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your Cozi account email"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your Cozi account password"
              required
            />
          </div>
          
          <button type="submit" className="btn-connect" disabled={loading}>
            {loading ? 'Connecting...' : 'Connect to Cozi'}
          </button>
          
          <div className="cozi-info">
            <p>
              Connecting your Cozi account will import your family's calendar events
              and display them alongside chores in the weekly view.
            </p>
          </div>
        </form>
      ) : (
        <div className="connected-info">
          <p>
            <span className="connected-status">✓ Connected</span> to Cozi account: <strong>{connectedEmail}</strong>
          </p>
          <p>
            Your Cozi calendar events are being imported and displayed in the weekly view.
          </p>
          <button onClick={handleDisconnect} className="btn-disconnect" disabled={loading}>
            {loading ? 'Disconnecting...' : 'Disconnect Cozi Account'}
          </button>
        </div>
      )}
    </div>
  );
}

export default CoziConfig;