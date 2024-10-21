import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../index.css'; // Добавьте CSS файл для стилей

const Header: React.FC = () => {
  const navigate = useNavigate();

  const handleNavigateToUserPanel = () => {
    navigate('/');
  };

  const handleNavigateToSchedule = () => {
    navigate('/schedules'); // Добавьте путь для страницы расписаний
  };

  const handleNavigateToTickets = () => {
    navigate('/tickets'); // Добавьте путь для страницы тикетов
  };

  const handleNavigateToReports = () => {
    navigate('/reports'); // Добавьте путь для страницы тикетов
  };

  return (
    <header className="header">
      <div className="header__logo">
        <img src="./airlines/frontend/logo.png" alt="" /> {/*путь к логотипу */}
      </div>
      <div className="header__buttons">
        <button onClick={handleNavigateToUserPanel}>Пользовательская панель</button>
        <button onClick={handleNavigateToSchedule}>Расписание рейсов</button>
        <button onClick={handleNavigateToTickets}>Тикеты</button>
        <button onClick={handleNavigateToReports}>Репорт отчеты</button>
      </div>
    </header>
  );
};

export default Header;
