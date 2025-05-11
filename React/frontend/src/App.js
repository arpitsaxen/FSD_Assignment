import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/auth/Login';
import Dashboard from './components/Dashboard';
import Students from './components/students/Students';
import StudentForm from './components/students/StudentForm';
import VaccinationDrives from './components/drives/VaccinationDrives';
import DriveForm from './components/drives/DriveForm';
import Reports from './components/reports/Reports';
import Layout from './components/layout/Layout';
import Vaccines from './components/vaccines/Vaccines'; 
import PrivateRoute from './components/auth/PrivateRoute';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route path="" element={<Navigate to="/dashboard" />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="students" element={<Students />} />
            <Route path="students/add" element={<StudentForm />} />
            <Route path="students/edit/:id" element={<StudentForm />} />
            <Route path="drives" element={<VaccinationDrives />} />
            <Route path="drives/add" element={<DriveForm />} />
            <Route path="vaccines" element={<Vaccines />} />
            <Route path="drives/edit/:id" element={<DriveForm />} />
            <Route path="reports" element={<Reports />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}


export default App;