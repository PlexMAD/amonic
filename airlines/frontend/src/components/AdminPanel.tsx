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
  const [offices, setOffices] = useState<string[]>([]);
  const [newUser, setNewUser] = useState({
    email: '',
    firstname: '',
    lastname: '',
    office_name: '',
    birthdate: '',
    password: '',
  });
  const [userData, setUserData] = useState<User | null>(null);


  useEffect(() => {
    axios.get<User[]>('http://127.0.0.1:8000/api/users/')
      .then((response) => {
        setUsers(response.data);
        setFilteredUsers(response.data);
        const uniqueOffices: string[] = [...new Set(response.data.map((user) => user.office_name))];
        setOffices(uniqueOffices);
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

    axios.post('http://127.0.0.1:8000/api/add_user/', { ...newUser, roleid: 2, active: 1 }, {
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

  const handleEditUser = (user: User) => {
    setUserData(user);
    setShowModal(true);
  };

  const handleSaveUser = () => {
    const token = localStorage.getItem('access_token');
    if (!userData) return;

    axios.patch(`http://127.0.0.1:8000/api/update_user/${userData.id}/`, userData, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
    .then(() => {
      alert('Пользователь успешно обновлен');
      setShowModal(false);
      window.location.reload();
    })
    .catch((error) => {
      console.error('Ошибка при обновлении пользователя', error);
      alert('Ошибка при обновлении пользователя');
    });
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
    <div className="admin-panel">
      <h1 className="admin-panel__title">Админ панель</h1>
      <label className="admin-panel__label">Офис: </label>
      <select className="admin-panel__select" value={selectedOffice} onChange={(e) => handleOfficeChange(e.target.value)}>
        <option value="Все офисы">Все офисы</option>
        {offices.map((officeName, index) => (
          <option key={index} value={officeName}>
            {officeName}
          </option>
        ))}
      </select>

      <button className="admin-panel__button" onClick={() => {
          setUserData(null);
          setShowModal(true);
          setNewUser({
            email: '',
            firstname: '',
            lastname: '',
            office_name: '',
            birthdate: '',
            password: '',
          });
        }}>
        Добавить пользователя
      </button>
      <button className="admin-panel__button" onClick={handleLogout}>Выйти</button>
      <button className="admin-panel__button" onClick={handleTestError}>Сгенерировать ошибку</button>

      <table className="admin-panel__table">
        <thead>
          <tr className="admin-panel__table-header">
            <th>Имя</th>
            <th>Фамилия</th>
            <th>Email</th>
            <th>Возраст</th>
            <th>Роль</th>
            <th>Офис</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map(user => (
            <tr key={user.id} style={getRowStyle(user)} className="admin-panel__table-row">
              <td className="admin-panel__table-cell">{user.firstname}</td>
              <td className="admin-panel__table-cell">{user.lastname}</td>
              <td className="admin-panel__table-cell">{user.email}</td>
              <td className="admin-panel__table-cell">{calculateAge(user.birthdate)}</td>
              <td className="admin-panel__table-cell">{user.roleid === 1 ? 'Администратор' : 'Пользователь'}</td>
              <td className="admin-panel__table-cell">{user.office_name}</td>
              <td className="admin-panel__table-cell">
                <button className="admin-panel__edit-button" onClick={() => handleEditUser(user)}>Редактировать</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div className="modal admin-panel__modal">
          <h2 className="admin-panel__modal-title">{userData ? 'Редактировать пользователя' : 'Добавить пользователя'}</h2>
          <form className="admin-panel__form" onSubmit={(e) => {
            e.preventDefault();
            userData ? handleSaveUser() : handleAddUser();
          }}>
            <label className="admin-panel__form-label">Email:</label>
            <input
              type="email"
              className="admin-panel__form-input"
              value={userData?.email || newUser.email}
              onChange={(e) => userData 
                ? setUserData({ ...userData, email: e.target.value }) 
                : setNewUser({ ...newUser, email: e.target.value })}
              required
            />
            <label className="admin-panel__form-label">Имя:</label>
            <input
              type="text"
              className="admin-panel__form-input"
              value={userData?.firstname || newUser.firstname}
              onChange={(e) => userData 
                ? setUserData({ ...userData, firstname: e.target.value }) 
                : setNewUser({ ...newUser, firstname: e.target.value })}
              required
            />
            <label className="admin-panel__form-label">Фамилия:</label>
            <input
              type="text"
              className="admin-panel__form-input"
              value={userData?.lastname || newUser.lastname}
              onChange={(e) => userData 
                ? setUserData({ ...userData, lastname: e.target.value }) 
                : setNewUser({ ...newUser, lastname: e.target.value })}
              required
            />
            <label className="admin-panel__form-label">Пароль:</label>
            <input
              type="password"
              className="admin-panel__form-input"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              required
            />
            <label className="admin-panel__form-label">Офис:</label>
            <select
              className="admin-panel__form-select"
              value={userData?.office_name || newUser.office_name}
              onChange={(e) => userData 
                ? setUserData({ ...userData, office_name: e.target.value }) 
                : setNewUser({ ...newUser, office_name: e.target.value })}
              required
            >
              <option value="">Выберите офис</option>
              {offices.map((officeName, index) => (
                <option key={index} value={officeName}>
                  {officeName}
                </option>
              ))}
            </select>
            <label className="admin-panel__form-label">Дата рождения:</label>
            <input
              type="date"
              className="admin-panel__form-input"
              value={userData?.birthdate || newUser.birthdate}
              onChange={(e) => userData 
                ? setUserData({ ...userData, birthdate: e.target.value }) 
                : setNewUser({ ...newUser, birthdate: e.target.value })}
              required
            />
            {userData && (
              <>
                <label className="admin-panel__form-label">Роль:</label>
                <select
                  className="admin-panel__form-select"
                  value={userData.roleid}
                  onChange={(e) => userData && setUserData({ ...userData, roleid: Number(e.target.value) })}
                  required
                >
                  <option value="1">Администратор</option>
                  <option value="2">Пользователь</option>
                </select>
                <label className="admin-panel__form-label">Статус активности:</label>
                <select
                  className="admin-panel__form-select"
                  value={userData.active}
                  onChange={(e) => userData && setUserData({ ...userData, active: Number(e.target.value) })}
                  required
                >
                  <option value="1">Активен</option>
                  <option value="0">Неактивен</option>
                </select>
              </>
            )}
            <button type="submit" className="admin-panel__form-submit-button">{userData ? 'Сохранить' : 'Добавить'}</button>
            <button type="button" className="admin-panel__form-close-button" onClick={() => setShowModal(false)}>Закрыть</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;