import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface User {
    id: number,
    email: string,
    password: string,
    firstname: string,
    lastname: string,
    birthdate: Date,
    active: number,
    roleid: number,
    officeid: number
}

const UserPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get<User[]>('http://127.0.0.1:8000/api/users');
        console.log(response)
        setUsers(response.data);
      } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
          setError(error.response.data.message);
        } else {
          setError('Unexpected error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.email}</li>
      ))}
    </ul>
  );
};

export default UserPage;
