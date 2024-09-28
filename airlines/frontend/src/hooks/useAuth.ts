import { useState, useEffect } from 'react';
import { getUserProfile } from '../api/auth';

export const useAuth = () => {
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem('access_token');
            if (token) {
                const userProfile = await getUserProfile(token);
                setUser(userProfile);
            }
        };
        fetchUser();
    }, []);

    return user;
};
