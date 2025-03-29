import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware, combineReducers } from 'redux';
import thunk from 'redux-thunk';
import './index.css';
import App from './App';

// Reducers
const calendarReducer = (state = { events: [], loading: false, error: null }, action) => {
  switch(action.type) {
    case 'FETCH_EVENTS_START':
      return { ...state, loading: true };
    case 'FETCH_EVENTS_SUCCESS':
      return { ...state, events: action.payload, loading: false };
    case 'FETCH_EVENTS_FAILURE':
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
};

const choresReducer = (state = { chores: [], loading: false, error: null }, action) => {
  switch(action.type) {
    case 'FETCH_CHORES_START':
      return { ...state, loading: true };
    case 'FETCH_CHORES_SUCCESS':
      return { ...state, chores: action.payload, loading: false };
    case 'FETCH_CHORES_FAILURE':
      return { ...state, error: action.payload, loading: false };
    case 'ADD_CHORE':
      return { ...state, chores: [...state.chores, action.payload] };
    case 'REMOVE_CHORE':
      return { ...state, chores: state.chores.filter(chore => chore.id !== action.payload) };
    default:
      return state;
  }
};

const kidsReducer = (state = { kids: [], loading: false, error: null }, action) => {
  switch(action.type) {
    case 'FETCH_KIDS_START':
      return { ...state, loading: true };
    case 'FETCH_KIDS_SUCCESS':
      return { ...state, kids: action.payload, loading: false };
    case 'FETCH_KIDS_FAILURE':
      return { ...state, error: action.payload, loading: false };
    case 'ADD_KID':
      return { ...state, kids: [...state.kids, action.payload] };
    default:
      return state;
  }
};

const rootReducer = combineReducers({
  calendar: calendarReducer,
  chores: choresReducer,
  kids: kidsReducer
});

const store = createStore(rootReducer, applyMiddleware(thunk));

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
);
