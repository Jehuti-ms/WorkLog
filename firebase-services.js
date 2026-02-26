// firebase-services.js
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  writeBatch,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase-config.js';

// Collection references
const eventsCollection = collection(db, 'events');
const studentsCollection = collection(db, 'students');

// ============================================
// EVENT OPERATIONS
// ============================================

export async function generateEventId() {
  try {
    const year = new Date().getFullYear();
    const eventsQuery = query(
      eventsCollection, 
      where('eventId', '>=', `${year}-`), 
      where('eventId', '<', `${year}-~`)
    );
    
    const snapshot = await getDocs(eventsQuery);
    let maxNum = 0;
    
    snapshot.forEach(doc => {
      const eventId = doc.data().eventId;
      if (eventId && typeof eventId === 'string') {
        const parts = eventId.split('-');
        if (parts.length === 2 && parts[0] === year.toString()) {
          const num = parseInt(parts[1]);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      }
    });
    
    const nextNum = (maxNum + 1).toString().padStart(3, '0');
    const eventId = `${year}-${nextNum}`;
    
    return { success: true, eventId };
  } catch (error) {
    console.error('Error generating event ID:', error);
    return { success: false, error: error.message };
  }
}

export async function getAllEvents() {
  try {
    const eventsQuery = query(eventsCollection, orderBy('lastModified', 'desc'));
    const snapshot = await getDocs(eventsQuery);
    
    const events = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      events.push({
        id: doc.id,
        eventId: data.eventId,
        eventName: data.eventName,
        eventDate: data.eventDate,
        venue: data.venue,
        lastModified: data.lastModified?.toDate?.()?.toLocaleString() || data.lastModified
      });
    });
    
    return { success: true, events };
  } catch (error) {
    console.error('Error getting events:', error);
    return { success: false, error: error.message };
  }
}

export async function getEventData(eventId) {
  try {
    // Get event by eventId field (not document ID)
    const eventsQuery = query(eventsCollection, where('eventId', '==', eventId));
    const eventSnapshot = await getDocs(eventsQuery);
    
    if (eventSnapshot.empty) {
      return { success: false, error: 'Event not found' };
    }
    
    const eventDoc = eventSnapshot.docs[0];
    const eventData = eventDoc.data();
    
    // Get students for this event
    const studentsQuery = query(studentsCollection, where('eventId', '==', eventId));
    const studentsSnapshot = await getDocs(studentsQuery);
    
    const students = [];
    studentsSnapshot.forEach(doc => {
      const data = doc.data();
      students.push({
        id: doc.id,
        name: data.name,
        form: data.form,
        contact: data.contact,
        illness: data.illness,
        otherIllness: data.otherIllness || '',
        takingMedication: data.takingMedication || false,
        medicationDetails: data.medicationDetails || '',
        permission: data.permission || false,
        present: data.present || false
      });
    });
    
    return {
      success: true,
      event: {
        eventId: eventData.eventId,
        eventName: eventData.eventName,
        eventDate: eventData.eventDate,
        venue: eventData.venue,
        departure: eventData.departure,
        returnTime: eventData.returnTime,
        vehicle: eventData.vehicle,
        company: eventData.company,
        accompanying: eventData.accompanying,
        students: students
      }
    };
  } catch (error) {
    console.error('Error getting event data:', error);
    return { success: false, error: error.message };
  }
}

export async function saveEvent(eventData) {
  const batch = writeBatch(db);
  
  try {
    const { eventId } = eventData;
    
    // Calculate counts
    const accompanyingTeachers = eventData.accompanying 
      ? eventData.accompanying.split(',').filter(t => t.trim()).length 
      : 0;
    const studentsCount = eventData.students.filter(s => s.name && s.name.trim()).length;
    
    // Save event
    const eventQuery = query(eventsCollection, where('eventId', '==', eventId));
    const eventSnapshot = await getDocs(eventQuery);
    
    let eventRef;
    if (!eventSnapshot.empty) {
      eventRef = eventSnapshot.docs[0].ref;
    } else {
      eventRef = doc(eventsCollection);
    }
    
    batch.set(eventRef, {
      eventId,
      eventName: eventData.eventName,
      eventDate: eventData.eventDate,
      venue: eventData.venue || '',
      departure: eventData.departure || '',
      returnTime: eventData.returnTime || '',
      vehicle: eventData.vehicle || '',
      company: eventData.company || '',
      accompanying: eventData.accompanying || '',
      teachersCount: accompanyingTeachers,
      studentsCount,
      lastModified: serverTimestamp()
    }, { merge: true });
    
    // Delete existing students for this event
    const studentsQuery = query(studentsCollection, where('eventId', '==', eventId));
    const studentsSnapshot = await getDocs(studentsQuery);
    studentsSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Save new students
    let studentNo = 1;
    eventData.students.forEach(student => {
      if (student.name && student.name.trim()) {
        const studentRef = doc(studentsCollection);
        batch.set(studentRef, {
          studentNo,
          name: student.name,
          form: student.form || '',
          contact: student.contact || '',
          illness: student.illness || 'None',
          otherIllness: student.otherIllness || '',
          takingMedication: student.takingMedication || false,
          medicationDetails: student.medicationDetails || '',
          permission: student.permission || false,
          present: student.present || false,
          eventId
        });
        studentNo++;
      }
    });
    
    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error('Error saving event:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteEvent(eventId) {
  const batch = writeBatch(db);
  
  try {
    // Delete event
    const eventQuery = query(eventsCollection, where('eventId', '==', eventId));
    const eventSnapshot = await getDocs(eventQuery);
    eventSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Delete students for this event
    const studentsQuery = query(studentsCollection, where('eventId', '==', eventId));
    const studentsSnapshot = await getDocs(studentsQuery);
    studentsSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error('Error deleting event:', error);
    return { success: false, error: error.message };
  }
}

export async function generateReport(eventId) {
  try {
    const eventData = await getEventData(eventId);
    
    if (!eventData.success) {
      return eventData;
    }
    
    const event = eventData.event;
    
    // Generate report data structure
    const report = {
      eventId: event.eventId,
      eventName: event.eventName,
      eventDate: event.eventDate,
      venue: event.venue,
      departure: event.departure,
      returnTime: event.returnTime,
      vehicle: event.vehicle,
      company: event.company,
      accompanying: event.accompanying,
      students: event.students,
      generatedAt: new Date().toISOString(),
      summary: {
        totalStudents: event.students.length,
        presentCount: event.students.filter(s => s.present).length,
        permissionCount: event.students.filter(s => s.permission).length,
        medicalCases: event.students.filter(s => s.illness !== 'None').length,
        takingMedication: event.students.filter(s => s.takingMedication).length
      }
    };
    
    // In a real app, you might want to generate a PDF here
    // For now, return the data for client-side rendering
    
    return { 
      success: true, 
      report,
      message: 'Report data generated successfully'
    };
  } catch (error) {
    console.error('Error generating report:', error);
    return { success: false, error: error.message };
  }
}
