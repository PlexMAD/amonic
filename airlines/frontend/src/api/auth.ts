import axios from 'axios';

export const login = async (email: string, password: string) => {
    const response = await axios.post('http://127.0.0.1:8000/api/token/', { email, password });
    return response.data;
};

export const getUserProfile = async (token: string) => {
    const response = await axios.get('http://127.0.0.1:8000/api/user-profile/', {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.data;
};
