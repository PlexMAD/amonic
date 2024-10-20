import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../index.css'; // Добавьте CSS файл для стилей

const Header: React.FC = () => {
  const navigate = useNavigate();

  const handleNavigateToUserPanel = () => {
    navigate('/');
  };

  return (
    <header className="header">
      <div className="header__logo">
        <img src="..\logo.svg" alt="" /> {/* Замените на путь к вашему логотипу */}
      </div>
      <div className="header__buttons">
        <button onClick={handleNavigateToUserPanel}>Пользовательская панель</button>
      </div>
    </header>
  );
};

export default Header;