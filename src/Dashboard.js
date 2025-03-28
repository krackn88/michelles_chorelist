import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Chart, registerables } from 'chart.js';
import '../styles/Dashboard.css';

// Register Chart.js components
Chart.register(...registerables);

function Dashboard({ chores, children, coziEvents }) {
  const [stats, setStats] = useState({
    totalChores: 0,
    completedChores: 0,
    upcomingChores: 0
  });
  
  const [todaysEvents, setTodaysEvents] = useState([]);
  const progressChartRef = useRef(null);
  const progressChartInstance = useRef(null);
  const childrenChartRef = useRef(null);
  const childrenChartInstance = useRef(null);

  useEffect(() => {
    // Calculate dashboard statistics
    if (chores && chores.length > 0) {
      const completed = chores.filter(chore => chore.completed).length;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const upcoming = chores.filter(chore => {
        const dueDate = new Date(chore.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return !chore.completed && dueDate >= today && dueDate <= new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
      }).length;
      
      setStats({
        totalChores: chores.length,
        completedChores: completed,
        upcomingChores: upcoming
      });
    }
    
    // Get today's events (both chores and Cozi events)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    
    const todayChores = chores.filter(chore => {
      const dueDate = new Date(chore.dueDate);
      return dueDate >= today && dueDate <= endOfDay;
    }).map(chore => ({
      ...chore,
      type: 'chore',
      start: new Date(chore.dueDate),
      title: chore.name
    }));
    
    const todayCoziEvents = coziEvents.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate >= today && eventDate <= endOfDay;
    });
    
    setTodaysEvents([...todayChores, ...todayCoziEvents].sort((a, b) => {
      return new Date(a.start) - new Date(b.start);
    }));
    
    // Update charts
    updateProgressChart();
    updateChildrenChart();
    
    // Cleanup charts when component unmounts
    return () => {
      if (progressChartInstance.current) {
        progressChartInstance.current.destroy();
      }
      if (childrenChartInstance.current) {
        childrenChartInstance.current.destroy();
      }
    };
  }, [chores, children, coziEvents]);

  const updateProgressChart = () => {
    // Destroy existing chart if it exists
    if (progressChartInstance.current) {
      progressChartInstance.current.destroy();
    }
    
    // Return if chart ref is not available
    if (!progressChartRef.current) return;
    
    // Create new progress chart
    const ctx = progressChartRef.current.getContext('2d');
    progressChartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Completed', 'Pending'],
        datasets: [{
          data: [stats.completedChores, stats.totalChores - stats.completedChores],
          backgroundColor: ['#4BC0C0', '#FF6384'],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'bottom'
          },
          title: {
            display: true,
            text: 'Chore Completion Progress',
            font: {
              size: 16
            }
          }
        }
      }
    });
  };

  const updateChildrenChart = () => {
    // Destroy existing chart if it exists
    if (childrenChartInstance.current) {
      childrenChartInstance.current.destroy();
    }
    
    // Return if chart ref is not available or no children
    if (!childrenChartRef.current || !children.length) return;
    
    // Calculate chore completion by child
    const childrenData = {};
    children.forEach(child => {
      childrenData[child.name] = { completed: 0, total: 0 };
    });
    
    chores.forEach(chore => {
      if (chore.assignedTo && childrenData[chore.assignedTo]) {
        childrenData[chore.assignedTo].total++;
        if (chore.completed) {
          childrenData[chore.assignedTo].completed++;
        }
      }
    });
    
    const labels = Object.keys(childrenData);
    const completedData = labels.map(name => childrenData[name].completed);
    const pendingData = labels.map(name => childrenData[name].total - childrenData[name].completed);
    
    // Create new chart
    const ctx = childrenChartRef.current.getContext('2d');
    childrenChartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Completed',
            data: completedData,
            backgroundColor: '#4BC0C0',
            borderColor: '#3B9696',
            borderWidth: 1
          },
          {
            label: 'Pending',
            data: pendingData,
            backgroundColor: '#FF6384',
            borderColor: '#CC4F6A',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            stacked: true
          },
          y: {
            stacked: true,
            beginAtZero: true,
            ticks: {
              precision: 0
            }
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Chores by Child',
            font: {
              size: 16
            }
          },
          legend: {
            position: 'top'
          }
        }
      }
    });
  };

  return (
    <div className="dashboard-container">
      <h1>Family Chore Dashboard</h1>
      
      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Total Chores</h3>
          <p className="stat-value">{stats.totalChores}</p>
        </div>
        <div className="stat-card">
          <h3>Completed</h3>
          <p className="stat-value">{stats.completedChores}</p>
        </div>
        <div className="stat-card">
          <h3>Upcoming (3 days)</h3>
          <p className="stat-value">{stats.upcomingChores}</p>
        </div>
        <div className="stat-card">
          <h3>Completion Rate</h3>
          <p className="stat-value">
            {stats.totalChores ? Math.round((stats.completedChores / stats.totalChores) * 100) : 0}%
          </p>
        </div>
      </div>
      
      <div className="dashboard-main">
        <div className="charts-section">
          <div className="chart-container">
            <canvas ref={progressChartRef}></canvas>
          </div>
          <div className="chart-container">
            <canvas ref={childrenChartRef}></canvas>
          </div>
        </div>
        
        <div className="today-events-section">
          <div className="section-header">
            <h2>Today's Schedule</h2>
            <Link to="/weekly" className="view-all-link">View Weekly Calendar</Link>
          </div>
          
          <div className="events-list">
            {todaysEvents.length > 0 ? (
              todaysEvents.map((event, index) => (
                <div 
                  key={index} 
                  className={`event-item ${event.type === 'chore' ? 'chore-event' : 'cozi-event'} ${event.completed ? 'completed' : ''}`}
                >
                  <div className="event-time">
                    {event.start instanceof Date ? 
                      event.start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 
                      ''}
                  </div>
                  <div className="event-details">
                    <div className="event-title">{event.title}</div>
                    {event.type === 'chore' && (
                      <div className="event-assignment">
                        Assigned to: {event.assignedTo || 'Unassigned'}
                      </div>
                    )}
                    {event.type !== 'chore' && event.location && (
                      <div className="event-location">
                        Location: {event.location}
                      </div>
                    )}
                  </div>
                  {event.type === 'chore' && (
                    <div className="event-status">
                      {event.completed ? (
                        <span className="status-completed">✓ Done</span>
                      ) : (
                        <span className="status-pending">Pending</span>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="no-events">
                <p>No events scheduled for today</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="quick-actions">
        <Link to="/assign" className="action-button">
          Assign Chores
        </Link>
        <Link to="/weekly" className="action-button">
          Weekly View
        </Link>
        <Link to="/children" className="action-button">
          Manage Children
        </Link>
      </div>
    </div>
  );
}

export default Dashboard;