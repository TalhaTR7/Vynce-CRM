import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

export function ProtectedLayout() {
    const [notifications, setNotifications] = useState([]);

    const fetchNotifications = async () => {
        try {
            const res = await axios.get("http://localhost:5000/api/inbox/user", {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });
            setNotifications(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 10000);
        return () => clearInterval(interval);
    }, []);

    return (
        <Outlet context={{ notifications, refreshNotifications: fetchNotifications }} />
    );
};
