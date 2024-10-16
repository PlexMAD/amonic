import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface UserSession {
  id: number;
  login_time: string;
  logout_time: string | null;
  duration: string | null;
  logout_reason: string | null;
}

const UserPanel: React.FC = () => {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [currentSessionTime, setCurrentSessionTime] = useState<string>('0 минут 0 секунд');

  useEffect(() => {
    const accessToken = localStorage.getItem('access_token');

    axios.get<UserSession[]>('http://127.0.0.1:8000/api/user_sessions/', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })
    .then(response => {
      setSessions(response.data);
      const activeSession = response.data.find(session => session.logout_time === null);
      if (activeSession) {
        startCurrentSessionTimer(new Date(activeSession.login_time));
      }
    })
    .catch(error => {
      console.error('Ошибка при получении сессий пользователя:', error);
    });
  }, []);

  const startCurrentSessionTimer = (loginTime: Date) => {
    const timer = setInterval(() => {
      const now = new Date();
      const timeElapsed = now.getTime() - loginTime.getTime();
      const seconds = Math.floor((timeElapsed / 1000) % 60);
      const minutes = Math.floor((timeElapsed / (1000 * 60)) % 60);
      const hours = Math.floor((timeElapsed / (1000 * 60 * 60)) % 24);
      setCurrentSessionTime(`${hours} часов ${minutes} минут ${seconds} секунд`);
    }, 1000);

    return () => clearInterval(timer);
  };

  const handleLogout = () => {
    const token = localStorage.getItem('access_token');
    
    axios.post('http://127.0.0.1:8000/api/logout/', {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    })
    .then(() => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.reload();
    })
    .catch(error => {
      console.error('Ошибка при выходе из системы', error);
      alert('Произошла ошибка при выходе из системы');
    });
  };

  const handleTestError = () => {
    const token = localStorage.getItem('access_token');
  
    axios.get('http://127.0.0.1:8000/api/test_error/', {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    })
    .then(() => {
    })
    .catch(error => {
      console.error('Ошибка для тестирования', error);
      alert('Произошла ошибка для тестирования');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.reload();
    });
  };

  return (
    <div>
      <h1>Панель пользователя</h1>
      <p>Текущая сессия: {currentSessionTime}</p>
      <table>
        <thead>
          <tr>
            <th>Дата</th>
            <th>Время входа</th>
            <th>Время выхода</th>
            <th>Время нахождения</th>
            <th>Причина неудачного выхода</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map(session => (
            <tr key={session.id}>
              <td>{new Date(session.login_time).toLocaleDateString()}</td>
              <td>{new Date(session.login_time).toLocaleTimeString()}</td>
              <td>{session.logout_time ? new Date(session.logout_time).toLocaleTimeString() : 'Неизвестно'}</td>
              <td>{session.duration ? session.duration : 'Неизвестно'}</td>
              <td style={{ color: session.logout_reason ? 'red' : 'black' }}>
                {session.logout_reason || 'Выход удачен/Ошибка необработана'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={handleLogout}>Выйти</button>
      <button onClick={handleTestError}>Сгенерировать ошибку</button>
    </div>
  );
};

export default UserPanel;
