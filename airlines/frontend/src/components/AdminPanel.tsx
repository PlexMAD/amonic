import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  birthdate: string | null;
  roleid: number;
  office_name: string;
  active: number;
}

const AdminPanel = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedOffice, setSelectedOffice] = useState<string>('Все офисы');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [newUser, setNewUser] = useState({
    email: '',
    firstname: '',
    lastname: '',
    office_name: '',
    birthdate: '',
    password: '',
  });

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/users/')
      .then((response) => {
        setUsers(response.data);
        setFilteredUsers(response.data);
      })
      .catch((error) => {
        console.error("Произошла ошибка при получении пользователей!", error);
      });
  }, []);

  const handleOfficeChange = (officeName: string) => {
    setSelectedOffice(officeName);
    if (officeName === 'Все офисы') {
      setFilteredUsers(users);
    } else {
      setFilteredUsers(users.filter(user => user.office_name === officeName));
    }
  };

  const getRowStyle = (user: User) => {
    if (user.active === 0) {
      return { backgroundColor: 'red', color: 'white' };
    } else if (user.roleid === 1) {
      return { backgroundColor: 'green', color: 'white' };
    }
    return {};
  };

  const calculateAge = (birthdate: string | null): string => {
    if (!birthdate) return 'Неизвестно';
    const birthYear = new Date(birthdate).getFullYear();
    const currentYear = new Date().getFullYear();
    return (currentYear - birthYear).toString();
  };

  const handleAddUser = () => {
    const token = localStorage.getItem('access_token');
  
    axios.post('http://127.0.0.1:8000/api/add_user/', newUser, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
    .then(() => {
      alert('Пользователь успешно добавлен');
      setShowModal(false);
      setNewUser({
        email: '',
        firstname: '',
        lastname: '',
        office_name: '',
        birthdate: '',
        password: '',
      });
      window.location.reload(); 
    })
    .catch((error) => {
      console.error('Ошибка при добавлении пользователя', error);
      alert('Ошибка при добавлении пользователя');
    });
  };
  

  return (
    <div>
      <h1>Админ панель</h1>
      <label>Офис: </label>
      <select value={selectedOffice} onChange={(e) => handleOfficeChange(e.target.value)}>
        <option value="Все офисы">Все офисы</option>
        {[...new Set(users.map(user => user.office_name))].map((officeName, index) => (
          <option key={index} value={officeName}>
            {officeName}
          </option>
        ))}
      </select>

      <button onClick={() => setShowModal(true)}>Добавить пользователя</button>

      <table>
        <thead>
          <tr>
            <th>Имя</th>
            <th>Фамилия</th>
            <th>Email</th>
            <th>Возраст</th>
            <th>Роль</th>
            <th>Офис</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map(user => (
            <tr key={user.id} style={getRowStyle(user)}>
              <td>{user.firstname}</td>
              <td>{user.lastname}</td>
              <td>{user.email}</td>
              <td>{calculateAge(user.birthdate)}</td>
              <td>{user.roleid === 1 ? 'Администратор' : 'Пользователь'}</td>
              <td>{user.office_name}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div className="modal">
          <h2>Добавить пользователя</h2>
          <form onSubmit={(e) => {
            e.preventDefault();
            handleAddUser();
          }}>
            <label>Email:</label>
            <input
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              required
            />
            <label>Имя:</label>
            <input
              type="text"
              value={newUser.firstname}
              onChange={(e) => setNewUser({ ...newUser, firstname: e.target.value })}
              required
            />
            <label>Фамилия:</label>
            <input
              type="text"
              value={newUser.lastname}
              onChange={(e) => setNewUser({ ...newUser, lastname: e.target.value })}
              required
            />
            <label>Офис:</label>
            <select
              value={newUser.office_name}
              onChange={(e) => setNewUser({ ...newUser, office_name: e.target.value })}
              required
            >
              <option value="">Выберите офис</option>
              {[...new Set(users.map(user => user.office_name))].map((officeName, index) => (
                <option key={index} value={officeName}>
                  {officeName}
                </option>
              ))}
            </select>
            <label>Дата рождения:</label>
            <input
              type="date"
              value={newUser.birthdate}
              onChange={(e) => setNewUser({ ...newUser, birthdate: e.target.value })}
              required
            />
            <label>Пароль:</label>
            <input
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              required
            />
            <button type="submit">Добавить</button>
          </form>
          <button onClick={() => setShowModal(false)}>Закрыть</button>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
