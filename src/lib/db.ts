import { collection, query, getDocs, onSnapshot, doc, setDoc, updateDoc, deleteDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';

export interface Student {
  id: string;
  name: string;
  nickname: string;
  eggColor: string;
  exp: number;
  level: number;
  effects: string[];
  lastInteractionTime: number;
  createdAt: number;
}

export interface BehaviorRule {
  id: string;
  name: string;
  points: number;
  type: 'positive' | 'negative';
}

export interface BehaviorLog {
  id: string;
  studentId: string;
  actionName: string;
  points: number;
  timestamp: number;
  teacherId: string;
}

export interface Settings {
  rules: BehaviorRule[];
  updatedAt: number;
  classPin?: string;
}

export const subscribeToStudents = (callback: (students: Student[]) => void) => {
  const q = query(collection(db, 'students'));
  return onSnapshot(q, (snapshot) => {
    const students = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
    callback(students);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'students');
  });
};

export const subscribeToSettings = (callback: (settings: Settings | null) => void) => {
  const docRef = doc(db, 'settings', 'global');
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as Settings);
    } else {
      callback(null);
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'settings/global');
  });
};

export const createStudent = async (studentData: Omit<Student, 'createdAt' | 'lastInteractionTime'>) => {
  try {
    const newDocRef = doc(collection(db, 'students'), studentData.id);
    const now = Date.now();
    await setDoc(newDocRef, {
      ...studentData,
      lastInteractionTime: now,
      createdAt: now
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'students');
  }
};

export const updateStudentPoints = async (studentId: string, expOffset: number, newLevel: number, newEffects: string[], authUid: string, actionName: string) => {
  try {
    // We get current student doc first
    const studentRef = doc(db, 'students', studentId);
    const docSnap = await getDoc(studentRef);
    if (!docSnap.exists()) return;
    const data = docSnap.data() as Student;
    
    // Create behavior log
    const logRef = doc(collection(db, 'behaviorLogs'));
    const now = Date.now();
    
    await setDoc(logRef, {
      id: logRef.id,
      studentId,
      actionName,
      points: expOffset,
      timestamp: now,
      teacherId: authUid
    });

    // We can't batch perfectly with simple SDK unless we use writeBatch, so let's just do sequential since it's client-side, but wait, rules say `behaviorLog` checks `exists(/databases/$(database)/documents/students/$(incoming().studentId))` which it does.
    // Also update student
    const newExp = Math.max(0, data.exp + expOffset);
    await updateDoc(studentRef, {
      exp: newExp,
      level: newLevel,
      effects: newEffects
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `students/${studentId}`);
  }
};

export const updateStudentInteraction = async (studentId: string) => {
  try {
    const studentRef = doc(db, 'students', studentId);
    await updateDoc(studentRef, {
      lastInteractionTime: Date.now()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `students/${studentId}`);
  }
};

export const updateClassPin = async (pin: string) => {
  try {
    const settingsRef = doc(db, 'settings', 'global');
    await updateDoc(settingsRef, {
      classPin: pin,
      updatedAt: Date.now()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'settings/global');
  }
};

// Bootstrap settings
export const initSettings = async () => {
    try {
        const docRef = doc(db, 'settings', 'global');
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            await setDoc(docRef, {
                rules: [
                    { id: '1', name: '帮助打扫卫生', points: 5, type: 'positive' },
                    { id: '2', name: '帮忙擦黑板', points: 3, type: 'positive' },
                    { id: '3', name: '写字工整', points: 5, type: 'positive' },
                    { id: '4', name: '迟到/早退', points: -3, type: 'negative' },
                    { id: '5', name: '课上讲话', points: -5, type: 'negative' }
                ],
                updatedAt: Date.now()
            });
        }
    } catch (e) {
        console.error("Not Admin or error initializing settings", e);
    }
}
