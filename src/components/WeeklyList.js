import React, { useState, useEffect, useRef } from 'react';
import { Chart } from 'chart.js/auto';
import { getWeeklyCalendarEvents } from '../config/coziConfig';
import { getSecurelyStoredLocal } from '../utils/securityUtils';
import './WeeklyList.css';

/**
 * WeeklyList Component
 * Displays a weekly agenda view for all children in a chart format
 * Integrates with Cozi calendar for events
 */
const WeeklyList = ({ children = [], chores = [] }) => {
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Chart references
  const weeklyChartRef = useRef(null);
  const weeklyChartInstance = useRef(null);
  const choreTypeChartRef = useRef(null);
  const choreTypeChartInstance = useRef(null);
  
  // Days of the week
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  // Get current week date range
  const getWeekDateRange = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    return {
      start: startOfWeek,
      end: endOfWeek,
      formattedStart: startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      formattedEnd: endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };
  };
  
  // Format date for display
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };
  
  // Get whether the child has a calendar event on a specific day
  const hasEventOnDay = (child, day) => {
    return calendarEvents.some(event => {
      const eventDate = new Date(event.startDateTime);
      return eventDate.getDay() === day && event.assignee === child.name;
    });
  };
  
  // Get chores for a specific child and day
  const getChoresForChildAndDay = (child, day) => {
    return chores.filter(chore => {
      const choreDay = new Date(chore.dueDate).getDay();
      return choreDay === day && chore.assignee === child.name;
    });
  };
  
  // Calculate weekly statistics
  const calculateWeeklyStats = () => {
    const stats = children.map(child => {
      const childChores = chores.filter(chore => chore.assignee === child.name);
      const completedChores = childChores.filter(chore => chore.isCompleted);
      const completionRate = childChores.length > 0 ? 
        Math.round((completedChores.length / childChores.length) * 100) : 0;
      
      // Calculate chores by day
      const choresByDay = daysOfWeek.map((_, dayIndex) => {
        return getChoresForChildAndDay(child, dayIndex).length;
      });
      
      return {
        name: child.name,
        totalChores: childChores.length,
        completedChores: completedChores.length,
        completionRate,
        choresByDay
      };
    });
    
    return stats;
  };
  
  // Calculate chore type distribution
  const calculateChoreTypeDistribution = () => {
    const choreTypes = {};
    
    chores.forEach(chore => {
      if (!choreTypes[chore.type]) {
        choreTypes[chore.type] = 0;
      }
      choreTypes[chore.type]++;
    });
    
    return choreTypes;
  };
  
  // Create weekly agenda chart
  const createWeeklyChart = () => {
    if (!weeklyChartRef.current) return;
    
    // Clean up existing chart
    if (weeklyChartInstance.current) {
      weeklyChartInstance.current.destroy();
    }
    
    const weekStats = calculateWeeklyStats();
    const ctx = weeklyChartRef.current.getContext('2d');
    
    // Create datasets for each child
    const datasets = weekStats.map((childStats, index) => {
      // Generate a color based on index
      const hue = (index * 137) % 360;
      const color = `hsl(${hue}, 70%, 60%)`;
      
      return {
        label: childStats.name,
        data: childStats.choresByDay,
        backgroundColor: color,
        borderColor: color,
        borderWidth: 1
      };
    });
    
    weeklyChartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: daysOfWeek,
        datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `Weekly Chore Schedule: ${getWeekDateRange().formattedStart} - ${getWeekDateRange().formattedEnd}`,
            font: {
              size: 16
            }
          },
          tooltip: {
            callbacks: {
              afterLabel: function(context) {
                const childIndex = context.datasetIndex;
                const dayIndex = context.dataIndex;
                const child = children[childIndex];
                const dayChores = getChoresForChildAndDay(child, dayIndex);
                
                if (dayChores.length === 0) return '';
                
                // Return chore details in tooltip
                return dayChores.map(chore => `- ${chore.name} (${chore.isCompleted ? 'Done' : 'Pending'})`);
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number of Chores'
            },
            ticks: {
              stepSize: 1
            }
          },
          x: {
            title: {
              display: true,
              text: 'Day of Week'
            }
          }
        }
      }
    });
  };
  
  // Create chore type chart
  const createChoreTypeChart = () => {
    if (!choreTypeChartRef.current) return;
    
    // Clean up existing chart
    if (choreTypeChartInstance.current) {
      choreTypeChartInstance.current.destroy();
    }
    
    const choreTypes = calculateChoreTypeDistribution();
    const ctx = choreTypeChartRef.current.getContext('2d');
    
    // Generate colors for each chore type
    const colors = Object.keys(choreTypes).map((_, index) => {
      const hue = (index * 137) % 360;
      return `hsl(${hue}, 70%, 60%)`;
    });
    
    choreTypeChartInstance.current = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: Object.keys(choreTypes),
        datasets: [{
          data: Object.values(choreTypes),
          backgroundColor: colors,
          borderColor: colors.map(color => color.replace('60%', '50%')),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Chore Type Distribution',
            font: {
              size: 16
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.raw || 0;
                const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                const percentage = Math.round((value / total) * 100);
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  };
  
  // Load calendar events from Cozi
  useEffect(() => {
    const loadCalendarEvents = async () => {
      try {
        setIsLoading(true);
        
        // Check if we have cached events
        const cachedEvents = getSecurelyStoredLocal('coziCalendarEvents');
        if (cachedEvents) {
          setCalendarEvents(JSON.parse(cachedEvents));
        } else {
          // Fetch new events
          const events = await getWeeklyCalendarEvents();
          setCalendarEvents(events);
          
          // Cache the events for performance
          localStorage.setItem('coziCalendarEvents', JSON.stringify(events));
        }
      } catch (err) {
        console.error('Failed to load calendar events:', err);
        setError('Failed to load calendar events. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCalendarEvents();
  }, []);
  
  // Process data and create charts when data changes
  useEffect(() => {
    if (!isLoading) {
      setWeeklyData(calculateWeeklyStats());
      
      // Create charts
      try {
        createWeeklyChart();
        createChoreTypeChart();
      } catch (err) {
        console.error('Failed to create charts:', err);
        setError('Failed to create charts. Please try again later.');
      }
    }
  }, [isLoading, calendarEvents, chores, children]);
  
  // Clean up charts on unmount
  useEffect(() => {
    return () => {
      if (weeklyChartInstance.current) {
        weeklyChartInstance.current.destroy();
      }
      if (choreTypeChartInstance.current) {
        choreTypeChartInstance.current.destroy();
      }
    };
  }, []);
  
  // Generate summary of completion for a child
  const getCompletionSummary = (stats) => {
    if (stats.totalChores === 0) return 'No chores assigned';
    if (stats.completionRate >= 90) return 'Excellent work!';
    if (stats.completionRate >= 75) return 'Good job!';
    if (stats.completionRate >= 50) return 'Making progress!';
    return 'Needs improvement';
  };
  
  return (
    <div className="weekly-list-container">
      <h2 className="weekly-title">
        Family Weekly Agenda: {getWeekDateRange().formattedStart} - {getWeekDateRange().formattedEnd}
      </h2>
      
      {isLoading ? (
        <div className="loading-indicator">Loading family schedule...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="weekly-content">
          <div className="charts-container">
            <div className="chart-wrapper weekly-chart">
              <canvas ref={weeklyChartRef} />
            </div>
            <div className="chart-wrapper chore-type-chart">
              <canvas ref={choreTypeChartRef} />
            </div>
          </div>
          
          <div className="weekly-summary">
            <h3>Weekly Summary</h3>
            <div className="summary-cards">
              {weeklyData.map((childStats, index) => (
                <div key={index} className="child-summary-card">
                  <h4>{childStats.name}</h4>
                  <div className="completion-meter">
                    <div 
                      className="completion-fill" 
                      style={{ width: `${childStats.completionRate}%` }}
                    />
                    <span className="completion-text">{childStats.completionRate}%</span>
                  </div>
                  <p className="summary-text">
                    {getCompletionSummary(childStats)}
                  </p>
                  <div className="summary-stats">
                    <span>Total: {childStats.totalChores}</span>
                    <span>Completed: {childStats.completedChores}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="upcoming-events">
            <h3>Upcoming Calendar Events</h3>
            {calendarEvents.length === 0 ? (
              <p>No upcoming events from Cozi calendar</p>
            ) : (
              <div className="events-list">
                {calendarEvents.slice(0, 5).map((event, index) => (
                  <div key={index} className="event-card">
                    <div className="event-date">{formatDate(event.startDateTime)}</div>
                    <div className="event-title">{event.title}</div>
                    <div className="event-assignee">
                      Assigned to: <span>{event.assignee}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyList;
