import React, { useState, useEffect } from 'react';
import { Table, Card, Badge, Row, Col, Button, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSync, faCheckCircle, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import coziIntegrationService from '../services/coziIntegrationService';

/**
 * WeeklyAgenda component - Professional nurse-friendly weekly agenda view
 * Displays chores for all kids in a weekly calendar format
 */
const WeeklyAgenda = ({ familyMembers, chores }) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(getStartOfWeek(new Date()));
  const [weeklyChores, setWeeklyChores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [coziEvents, setCoziEvents] = useState([]);
  const [error, setError] = useState(null);
  const [isSyncingCozi, setSyncingCozi] = useState(false);

  // Get start of week (Sunday)
  function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    return new Date(d.setDate(d.getDate() - day));
  }

  // Format date as MM/DD
  function formatDate(date) {
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }

  // Generate array of dates for current week
  function getWeekDates() {
    const dates = [];
    const startDate = new Date(currentWeekStart);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  }
  
  // Get day name
  function getDayName(date) {
    return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
  }
  
  // Navigate to previous week
  const goToPreviousWeek = () => {
    const prevWeekStart = new Date(currentWeekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    setCurrentWeekStart(prevWeekStart);
  };
  
  // Navigate to next week
  const goToNextWeek = () => {
    const nextWeekStart = new Date(currentWeekStart);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);
    setCurrentWeekStart(nextWeekStart);
  };

  // Sync with Cozi calendar
  const syncWithCozi = async () => {
    setSyncingCozi(true);
    setError(null);
    
    try {
      const weekDates = getWeekDates();
      const startDate = weekDates[0];
      const endDate = weekDates[6];
      
      // Add one day to end date to include the entire day
      endDate.setDate(endDate.getDate() + 1);
      
      const events = await coziIntegrationService.getEvents(startDate, endDate);
      setCoziEvents(events);
    } catch (err) {
      console.error('Failed to sync with Cozi:', err);
      setError('Failed to sync with Cozi calendar. Please check your connection and try again.');
    } finally {
      setSyncingCozi(false);
    }
  };

  // Process chores for weekly display
  useEffect(() => {
    setLoading(true);
    
    // Generate weekly schedule structure
    const weekDates = getWeekDates();
    const weekChoresByPerson = {};
    
    // Initialize empty chore arrays for each family member for each day
    familyMembers.forEach(member => {
      weekChoresByPerson[member.id] = {};
      weekDates.forEach(date => {
        const dateStr = date.toISOString().split('T')[0];
        weekChoresByPerson[member.id][dateStr] = [];
      });
    });
    
    // Populate with chores
    chores.forEach(chore => {
      if (!chore.assignedTo || !weekChoresByPerson[chore.assignedTo]) return;
      
      // Handle recurring chores
      if (chore.recurring) {
        weekDates.forEach(date => {
          const dayOfWeek = date.getDay();
          const dateStr = date.toISOString().split('T')[0];
          
          // Check if chore is scheduled for this day of week
          if (chore.recurringDays && chore.recurringDays.includes(dayOfWeek)) {
            weekChoresByPerson[chore.assignedTo][dateStr].push({
              ...chore,
              source: 'chore-manager'
            });
          }
        });
      } 
      // Handle one-time chores
      else if (chore.dueDate) {
        const dueDate = new Date(chore.dueDate);
        const dueDateStr = dueDate.toISOString().split('T')[0];
        
        // Check if due date falls within current week
        if (weekDates.some(date => date.toISOString().split('T')[0] === dueDateStr)) {
          weekChoresByPerson[chore.assignedTo][dueDateStr].push({
            ...chore,
            source: 'chore-manager'
          });
        }
      }
    });
    
    // Add Cozi events to the weekly schedule
    if (coziEvents && coziEvents.length > 0) {
      coziEvents.forEach(event => {
        if (!event.assignee) return;
        
        const assigneeId = familyMembers.find(m => 
          m.name.toLowerCase() === event.assignee.toLowerCase()
        )?.id;
        
        if (!assigneeId || !weekChoresByPerson[assigneeId]) return;
        
        const eventDate = new Date(event.start);
        const eventDateStr = eventDate.toISOString().split('T')[0];
        
        // Check if event date falls within current week
        if (weekChoresByPerson[assigneeId][eventDateStr]) {
          weekChoresByPerson[assigneeId][eventDateStr].push({
            id: event.id,
            name: event.title,
            description: event.description,
            type: 'event',
            source: 'cozi',
            completed: false
          });
        }
      });
    }
    
    setWeeklyChores(weekChoresByPerson);
    setLoading(false);
  }, [chores, familyMembers, currentWeekStart, coziEvents]);

  // Initialize Cozi integration on component mount
  useEffect(() => {
    const initCozi = async () => {
      try {
        if (coziIntegrationService.initialize()) {
          syncWithCozi();
        }
      } catch (err) {
        console.error('Failed to initialize Cozi integration:', err);
      }
    };
    
    initCozi();
  }, []);

  // Get background color based on completion status
  const getCellBackground = (choreItems) => {
    if (!choreItems || choreItems.length === 0) return '';
    
    const totalChores = choreItems.length;
    const completedChores = choreItems.filter(chore => chore.completed).length;
    
    if (completedChores === 0) return 'bg-light';
    if (completedChores < totalChores) return 'bg-warning-subtle';
    return 'bg-success-subtle';
  };

  // Get status badge for a day's chores
  const getStatusBadge = (choreItems) => {
    if (!choreItems || choreItems.length === 0) return null;
    
    const totalChores = choreItems.length;
    const completedChores = choreItems.filter(chore => chore.completed).length;
    
    if (completedChores === 0) return null;
    if (completedChores < totalChores) {
      return (
        <Badge bg="warning" className="ms-1">
          <FontAwesomeIcon icon={faExclamationTriangle} /> In Progress
        </Badge>
      );
    }
    
    return (
      <Badge bg="success" className="ms-1">
        <FontAwesomeIcon icon={faCheckCircle} /> Complete
      </Badge>
    );
  };

  // Render week navigation
  const renderWeekNavigation = () => {
    const startDateFormatted = formatDate(currentWeekStart);
    const endDate = new Date(currentWeekStart);
    endDate.setDate(endDate.getDate() + 6);
    const endDateFormatted = formatDate(endDate);
    
    return (
      <Row className="mb-3 align-items-center">
        <Col xs={4}>
          <Button variant="outline-primary" onClick={goToPreviousWeek}>
            &laquo; Previous Week
          </Button>
        </Col>
        <Col xs={4} className="text-center">
          <h5 className="m-0 fw-bold">{startDateFormatted} - {endDateFormatted}</h5>
        </Col>
        <Col xs={4} className="text-end">
          <Button variant="outline-primary" onClick={goToNextWeek}>
            Next Week &raquo;
          </Button>
        </Col>
      </Row>
    );
  };

  if (loading) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3">Loading weekly agenda...</p>
      </div>
    );
  }

  return (
    <Card className="shadow-sm">
      <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
        <h4 className="m-0">Weekly Family Agenda</h4>
        <Button 
          variant="outline-light" 
          size="sm" 
          onClick={syncWithCozi}
          disabled={isSyncingCozi}
        >
          <FontAwesomeIcon icon={faSync} spin={isSyncingCozi} /> {isSyncingCozi ? 'Syncing...' : 'Sync Cozi'}
        </Button>
      </Card.Header>
      <Card.Body>
        {error && <div className="alert alert-danger">{error}</div>}
        
        {renderWeekNavigation()}
        
        <div className="table-responsive">
          <Table bordered hover className="weekly-agenda-table">
            <thead className="table-primary">
              <tr>
                <th style={{ width: '150px' }}>Family Member</th>
                {getWeekDates().map((date, index) => (
                  <th key={index} className="text-center">
                    <div>{getDayName(date)}</div>
                    <small>{formatDate(date)}</small>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {familyMembers.map(member => (
                <tr key={member.id}>
                  <td className="align-middle fw-bold">{member.name}</td>
                  {getWeekDates().map((date, dateIndex) => {
                    const dateStr = date.toISOString().split('T')[0];
                    const dayChores = weeklyChores[member.id]?.[dateStr] || [];
                    
                    return (
                      <td 
                        key={dateIndex} 
                        className={`${getCellBackground(dayChores)} align-middle`}
                        style={{ minWidth: '140px' }}
                      >
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <small className="text-muted">
                            {dayChores.length} {dayChores.length === 1 ? 'item' : 'items'}
                          </small>
                          {getStatusBadge(dayChores)}
                        </div>
                        <ul className="list-unstyled m-0">
                          {dayChores.map((chore, choreIndex) => (
                            <li key={choreIndex} className="mb-1">
                              <small>
                                {chore.completed ? (
                                  <s>{chore.name}</s>
                                ) : (
                                  chore.name
                                )}
                                {chore.source === 'cozi' && (
                                  <Badge bg="info" pill className="ms-1">Cozi</Badge>
                                )}
                              </small>
                            </li>
                          ))}
                        </ul>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Card.Body>
    </Card>
  );
};

export default WeeklyAgenda;
