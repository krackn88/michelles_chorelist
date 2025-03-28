import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, Timestamp } from 'firebase/firestore';

// Get all chores from Firestore
export const getAllChores = async () => {
  try {
    const choresCollection = collection(db, 'chores');
    const choresSnapshot = await getDocs(choresCollection);
    return choresSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      dueDate: doc.data().dueDate?.toDate?.() || doc.data().dueDate
    }));
  } catch (error) {
    console.error("Error fetching chores:", error);
    throw error;
  }
};

// Get chores for today
export const getChoresToday = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const choresCollection = collection(db, 'chores');
    const q = query(
      choresCollection, 
      where('dueDate', '>=', today),
      where('dueDate', '<', tomorrow)
    );
    
    const choresSnapshot = await getDocs(q);
    return choresSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      dueDate: doc.data().dueDate?.toDate?.() || doc.data().dueDate
    }));
  } catch (error) {
    console.error("Error fetching today's chores:", error);
    throw error;
  }
};

// Get chores for a specific child
export const getChildChores = async (childId) => {
  try {
    const choresCollection = collection(db, 'chores');
    const q = query(choresCollection, where('assignedTo', '==', childId));
    const choresSnapshot = await getDocs(q);
    return choresSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      dueDate: doc.data().dueDate?.toDate?.() || doc.data().dueDate
    }));
  } catch (error) {
    console.error(`Error fetching chores for child ${childId}:`, error);
    throw error;
  }
};

// Add a new chore
export const addChore = async (chore) => {
  try {
    // Convert JavaScript Date to Firestore Timestamp if present
    const choreWithTimestamp = {
      ...chore,
      dueDate: chore.dueDate ? Timestamp.fromDate(new Date(chore.dueDate)) : null,
      createdAt: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, 'chores'), choreWithTimestamp);
    return { id: docRef.id, ...chore };
  } catch (error) {
    console.error("Error adding chore:", error);
    throw error;
  }
};

// Update an existing chore
export const updateChore = async (choreId, updates) => {
  try {
    // Convert JavaScript Date to Firestore Timestamp if present
    const updatesWithTimestamp = {
      ...updates,
      dueDate: updates.dueDate ? Timestamp.fromDate(new Date(updates.dueDate)) : null,
      updatedAt: Timestamp.now()
    };
    
    const choreRef = doc(db, 'chores', choreId);
    await updateDoc(choreRef, updatesWithTimestamp);
    return { id: choreId, ...updates };
  } catch (error) {
    console.error(`Error updating chore ${choreId}:`, error);
    throw error;
  }
};

// Mark a chore as complete or incomplete
export const markChoreComplete = async (choreId, isComplete = true) => {
  try {
    const choreRef = doc(db, 'chores', choreId);
    await updateDoc(choreRef, {
      completed: isComplete,
      completedAt: isComplete ? Timestamp.now() : null
    });
    return { id: choreId, completed: isComplete };
  } catch (error) {
    console.error(`Error marking chore ${choreId} as ${isComplete ? 'complete' : 'incomplete'}:`, error);
    throw error;
  }
};

// Delete a chore
export const deleteChore = async (choreId) => {
  try {
    const choreRef = doc(db, 'chores', choreId);
    await deleteDoc(choreRef);
    return { id: choreId, deleted: true };
  } catch (error) {
    console.error(`Error deleting chore ${choreId}:`, error);
    throw error;
  }
};
