/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Portal from './pages/Portal';
import BigScreen from './pages/BigScreen';
import TeacherPanel from './pages/TeacherPanel';
import StudentQuery from './pages/StudentQuery';
import Dashboard from './pages/Dashboard';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './lib/firebase';
import { initSettings } from './lib/db';

export default function App() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        initSettings();
      }
    });
    return () => unsub();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Portal />} />
        <Route path="/screen" element={<BigScreen />} />
        <Route path="/admin" element={<TeacherPanel user={user} />} />
        <Route path="/student" element={<StudentQuery />} />
        <Route path="/student/:id" element={<StudentQuery />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
