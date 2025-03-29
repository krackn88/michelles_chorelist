import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { BrowserRouter as Router, Route, Link, Switch } from 'react-router-dom';
import './App.css';
import { fetchCalendarEvents } from './services/calendarService';

// Dashboard Component
const Dashboard = () => {
  const dispatch = useDispatch();
  const { events } = useSelector(state => state.calendar);
  const { chores } = useSelector(state => state.chores);
  const { kids } = useSelector(state => state.kids);
  
  useEffect(() => {
    // Fetch calendar events
    dispatch({ type: 'FETCH_EVENTS_START' });
    fetchCalendarEvents()
      .then(events => {
        dispatch({ type: 'FETCH_EVENTS_SUCCESS', payload: events });
      })
      .catch(error => {
        dispatch({ type: 'FETCH_EVENTS_FAILURE', payload: error.message });
      });
    
    // Mock data for chores and kids
    dispatch({ 
      type: 'FETCH_KIDS_SUCCESS', 
      payload: [
        { id: 1, name: 'Child 1' },
        { id: 2, name: 'Child 2' },
        { id: 3, name: 'Child 3' }
      ]
    });
    
    dispatch({ 
      type: 'FETCH_CHORES_SUCCESS', 
      payload: [
        { id: 1, task: 'Clean room', assignedTo: 1, completed: false },
        { id: 2, task: 'Take out trash', assignedTo: 2, completed: true },
        { id: 3, task: 'Do homework', assignedTo: 3, completed: false },
        { id: 4, task: 'Set the table', assignedTo: 1, completed: false }
      ]
    });
  }, [dispatch]);
  
  return (
    <div className="dashboard">
      <h1>Family Dashboard</h1>
      
      <section className="dashboard-section">
        <h2>Upcoming Events</h2>
        <div className="events-container">
          {events.length > 0 ? (
            events.slice(0, 5).map(event => (
              <div key={event.id} className="event-card">
                <h3>{event.title}</h3>
                <p>{event.start ? new Date(event.start).toLocaleString() : 'No date'}</p>
                {event.location && <p><strong>Location:</strong> {event.location}</p>}
              </div>
            ))
          ) : (
            <p>Loading calendar events...</p>
          )}
        </div>
      </section>
      
      <section className="dashboard-section">
        <h2>Chores Overview</h2>
        <div className="chores-container">
          {chores.map(chore => {
            const kid = kids.find(k => k.id === chore.assignedTo);
            return (
              <div key={chore.id} className="chore-card">
                <h3>{chore.task}</h3>
                <p>Assigned to: {kid ? kid.name : 'Unassigned'}</p>
                <label>
                  <input 
                    type="checkbox" 
                    checked={chore.completed}
                    onChange={() => {
                      dispatch({ 
                        type: 'FETCH_CHORES_SUCCESS', 
                        payload: chores.map(c => 
                          c.id === chore.id ? {...c, completed: !c.completed} : c
                        )
                      });
                    }}
                  />
                  Complete
                </label>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

// Calendar Component
const Calendar = () => {
  const { events, loading, error } = useSelector(state => state.calendar);
  
  if (loading) return <div className="loading">Loading calendar events...</div>;
  if (error) return <div className="error">Error loading calendar: {error}</div>;
  
  return (
    <div className="calendar-page">
      <h1>Family Calendar</h1>
      <div className="calendar-container">
        {events.length > 0 ? (
          events.map(event => (
            <div key={event.id} className="calendar-event">
              <div className="event-date">
                {event.start ? new Date(event.start).toLocaleDateString() : 'No date'}
              </div>
              <div className="event-details">
                <h3>{event.title}</h3>
                {event.start && event.end && (
                  <p>{new Date(event.start).toLocaleTimeString()} - {new Date(event.end).toLocaleTimeString()}</p>
                )}
                {event.description && <p>{event.description}</p>}
                {event.location && <p><strong>Location:</strong> {event.location}</p>}
              </div>
            </div>
          ))
        ) : (
          <p>No calendar events found</p>
        )}
      </div>
    </div>
  );
};

// Chores Component
const Chores = () => {
  const dispatch = useDispatch();
  const { chores } = useSelector(state => state.chores);
  const { kids } = useSelector(state => state.kids);
  const [newChore, setNewChore] = React.useState({ task: '', assignedTo: '' });

  const handleAddChore = () => {
    if (newChore.task.trim() === '') return;
    
    const choreToAdd = {
      id: Date.now(),
      task: newChore.task,
      assignedTo: newChore.assignedTo ? parseInt(newChore.assignedTo) : null,
      completed: false
    };
    
    dispatch({ type: 'ADD_CHORE', payload: choreToAdd });
    setNewChore({ task: '', assignedTo: '' });
  };
  
  return (
    <div className="chore-manager">
      <h1>Chore Manager</h1>
      
      <div className="add-chore-form">
        <h2>Add New Chore</h2>
        <div className="form-group">
          <label>Task:</label>
          <input 
            type="text" 
            value={newChore.task}
            onChange={(e) => setNewChore({...newChore, task: e.target.value})}
            placeholder="Enter chore description"
          />
        </div>
        
        <div className="form-group">
          <label>Assign to:</label>
          <select
            value={newChore.assignedTo}
            onChange={(e) => setNewChore({...newChore, assignedTo: e.target.value})}
          >
            <option value="">Select a child</option>
            {kids.map(kid => (
              <option key={kid.id} value={kid.id}>{kid.name}</option>
            ))}
          </select>
        </div>
        
        <button onClick={handleAddChore}>Add Chore</button>
      </div>
      
      <div className="chore-list">
        <h2>Current Chores</h2>
        <table>
          <thead>
            <tr>
              <th>Task</th>
              <th>Assigned To</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {chores.map(chore => {
              const kid = kids.find(k => k.id === chore.assignedTo);
              return (
                <tr key={chore.id}>
                  <td>{chore.task}</td>
                  <td>{kid ? kid.name : 'Unassigned'}</td>
                  <td>
                    <label>
                      <input 
                        type="checkbox" 
                        checked={chore.completed}
                        onChange={() => {
                          dispatch({ 
                            type: 'FETCH_CHORES_SUCCESS', 
                            payload: chores.map(c => 
                              c.id === chore.id ? {...c, completed: !c.completed} : c
                            )
                          });
                        }}
                      />
                      {chore.completed ? 'Completed' : 'Pending'}
                    </label>
                  </td>
                  <td>
                    <button 
                      onClick={() => dispatch({ type: 'REMOVE_CHORE', payload: chore.id })}
                      className="delete-btn"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Kids Component
const Kids = () => {
  const dispatch = useDispatch();
  const { kids } = useSelector(state => state.kids);
  const { chores } = useSelector(state => state.chores);
  const [newKid, setNewKid] = React.useState({ name: '' });
  
  const handleAddKid = () => {
    if (newKid.name.trim() === '') return;
    
    const kidToAdd = {
      id: Date.now(),
      name: newKid.name
    };
    
    dispatch({ type: 'ADD_KID', payload: kidToAdd });
    setNewKid({ name: '' });
  };
  
  return (
    <div className="kids-manager">
      <h1>Kids Manager</h1>
      
      <div className="add-kid-form">
        <h2>Add New Child</h2>
        <div className="form-group">
          <label>Name:</label>
          <input 
            type="text" 
            value={newKid.name}
            onChange={(e) => setNewKid({...newKid, name: e.target.value})}
            placeholder="Enter child's name"
          />
        </div>
        
        <button onClick={handleAddKid}>Add Child</button>
      </div>
      
      <div className="kids-list">
        <h2>Children</h2>
        {kids.map(kid => {
          const kidChores = chores.filter(chore => chore.assignedTo === kid.id);
          const completedChores = kidChores.filter(chore => chore.completed).length;
          
          return (
            <div key={kid.id} className="kid-card">
              <h3>{kid.name}</h3>
              <p>Assigned chores: {kidChores.length}</p>
              <p>Completed: {completedChores} / {kidChores.length}</p>
              
              {kidChores.length > 0 && (
                <div className="kid-chores">
                  <h4>Chores:</h4>
                  <ul>
                    {kidChores.map(chore => (
                      <li key={chore.id} className={chore.completed ? 'completed' : ''}>
                        {chore.task} {chore.completed ? '' : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Main App
function App() {
  return (
    <Router>
      <div className="app">
        <header>
          <h1>Family Chore Manager</h1>
          <nav>
            <Link exact="true" to="/">Dashboard</Link>
            <Link to="/calendar">Calendar</Link>
            <Link to="/chores">Chores</Link>
            <Link to="/kids">Kids</Link>
          </nav>
        </header>
        
        <main>
          <Switch>
            <Route exact path="/" component={Dashboard} />
            <Route path="/calendar" component={Calendar} />
            <Route path="/chores" component={Chores} />
            <Route path="/kids" component={Kids} />
          </Switch>
        </main>
        
        <footer>
          <p>Family Chore Manager &copy; 2025</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
