import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import UserPanel from './components/UserPanel';
import axios from 'axios';
import PrivateRoute from './components/PrivateRoute';
import FlightScheduleManagement from './components/FlightScheduleManager';
import Header from './components/header'; // Импорт хедера
import Footer from './components/footer'; // Импорт футера

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const response = await axios.get('http://127.0.0.1:8000/api/current_user/', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUserRole(response.data.roleid);
        } catch (error) {
          console.error('Error fetching user role:', error);
          setUserRole(null);
        }
      } else {
        setUserRole(null);
      }
      setLoading(false);
    };

    fetchUserRole();
  }, []);

  if (loading) {
    return <div>Loading...</div>; 
  }

  const getRedirectPath = () => {
    if (userRole === 1) {
      return "/admin-panel"; 
    } else if (userRole === 2) {
      return "/user-panel"; 
    }
    return "/"; 
  };

  return (
    <Router>
      <Header /> {/* Добавление хедера */}
      <Routes>
        <Route path="/" element={userRole ? <Navigate to={getRedirectPath()} /> : <Login setUserRole={setUserRole} />} />
        <Route path="/admin-panel" element={<PrivateRoute component={AdminPanel} role={1} userRole={userRole} />} />
        <Route path="/user-panel" element={<PrivateRoute component={UserPanel} role={2} userRole={userRole} />} />
        <Route path="/schedules" element={<PrivateRoute component={FlightScheduleManagement} role={2} userRole={userRole} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <Footer /> {/* Добавление футера */}
    </Router>
  );
};

export default App;