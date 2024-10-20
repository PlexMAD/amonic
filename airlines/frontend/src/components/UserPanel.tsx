import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../index.css'; // Подключим CSS файл для стилей

interface UserSession {
  id: number;
  login_time: string;
  logout_time: string | null;
  duration: string | null;
  logout_reason: string | null;
}

const UserPanel: React.FC = () => {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [currentSessionTime, setCurrentSessionTime] = useState<string>('00:00:00');
  const [totalTime, setTotalTime] = useState<string>('00:00:00');

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
      calculateTotalTime(response.data);
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
      setCurrentSessionTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(timer);
  };

  const calculateTotalTime = (sessions: UserSession[]) => {
    let totalMilliseconds = 0;

    sessions.forEach(session => {
      if (session.duration) {
        const parts = session.duration.split(':');
        const hours = parseInt(parts[0]) * 60 * 60 * 1000;
        const minutes = parseInt(parts[1]) * 60 * 1000;
        const seconds = parseInt(parts[2]) * 1000;
        totalMilliseconds += hours + minutes + seconds;
      }
    });

    const totalSeconds = Math.floor((totalMilliseconds / 1000) % 60);
    const totalMinutes = Math.floor((totalMilliseconds / (1000 * 60)) % 60);
    const totalHours = Math.floor((totalMilliseconds / (1000 * 60 * 60)) % 24);

    setTotalTime(`${totalHours.toString().padStart(2, '0')}:${totalMinutes.toString().padStart(2, '0')}:${totalSeconds.toString().padStart(2, '0')}`);
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
    <div className="user-panel">
      <h1 className="user-panel__title">Панель пользователя</h1>
      <p className="user-panel__session-time">Текущая сессия: {currentSessionTime}</p>
      <p className="user-panel__total-time">Общее время: {totalTime}</p>
      <table className="user-panel__table">
        <thead>
          <tr>
            <th className="user-panel__header">Дата</th>
            <th className="user-panel__header">Время входа</th>
            <th className="user-panel__header">Время выхода</th>
            <th className="user-panel__header">Время нахождения</th>
            <th className="user-panel__header">Причина неудачного выхода</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map(session => (
            <tr
            key={session.id}
            className={`user-panel__row ${session.logout_reason && session.logout_reason !== 'Выход удачен' ? 'error-row' : ''}`}
          >
              <td className="user-panel__cell">{new Date(session.login_time).toLocaleDateString()}</td>
              <td className="user-panel__cell">{new Date(session.login_time).toLocaleTimeString()}</td>
              <td className="user-panel__cell">{session.logout_time ? new Date(session.logout_time).toLocaleTimeString() : '**'}</td>
              <td className="user-panel__cell">{session.duration || '**'}</td>
              <td className="user-panel__cell" style={{ color: session.logout_reason ? 'red' : 'black' }}>
                {session.logout_reason || 'Выход удачен'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="user-panel__buttons">
        <button className="user-panel__button_exit" onClick={handleLogout}>Выйти</button>
        <button className="user-panel__button" onClick={handleTestError}>Сгенерировать ошибку</button>
      </div>
    </div>
  );
};

export default UserPanel;
