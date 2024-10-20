import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface LoginProps {
  setUserRole: (role: number) => void;
}

const Login: React.FC<LoginProps> = ({ setUserRole }) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<number>(0);
  const [timer, setTimer] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer !== null) {
      interval = setInterval(() => {
        setTimer((prev) => (prev && prev > 0 ? prev - 1 : null));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (timer) {
      setError(`Please wait ${timer} seconds before trying again.`);
      return;
    }

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/token/', { email, password });
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);

      const userResponse = await axios.get('http://127.0.0.1:8000/api/current_user/', {
        headers: {
          Authorization: `Bearer ${response.data.access}`,
        },
      });

      const userRole = userResponse.data.roleid;
      setUserRole(userRole); 

      if (String(userRole) === '1') {
        navigate('/admin-panel');
      } else {
        navigate('/user-panel');
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const errorMessage = error.response.data.detail || 'Invalid email or password';
        setError(errorMessage);
        
        setAttempts((prev) => prev + 1);

        if (attempts + 1 >= 3) {
          setError('Много попыток. Подождите 10 секунд.');
          setTimer(10); 
          setAttempts(0); 
        }
      } else {
        setError('An unexpected error occurred. Please try again later.');
      }
    }
  };

  return (
<div className="login">
  <h2 className="login__title">Login</h2>
  <form className="login__form" onSubmit={handleLogin}>
    <div className="login__input-group">
      <label htmlFor="email" className="login__label">Username:</label>
      <input
        type="email"
        id="email"
        className="login__input"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        disabled={!!timer} 
      />
    </div>
    <div className="login__input-group">
      <label htmlFor="password" className="login__label">Password:</label>
      <input
        type="password"
        id="password"
        className="login__input"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        disabled={!!timer} 
      />
    </div>
    {error && <p className="login__error">{error}</p>}
    <div className="login__buttons">
      <button type="submit" className="login__button" disabled={!!timer}>
        {timer ? `Подождите ${timer}s` : 'Login'}
      </button>
      <button type="button" className="login__button-exit" onClick={() => navigate('/')}>
        Exit
      </button>
    </div>
  </form>
</div>
  );
};

export default Login;
