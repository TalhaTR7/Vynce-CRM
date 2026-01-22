
import styles from "../css/Header.module.scss";
import coin_svg from "../assets/icons/coin.svg"
import level_svg from "../assets/icons/level.svg"
import axios from 'axios';
import { useEffect, useState } from 'react';

import angry_emoji from "../assets/moods/angry.svg";
import exhausted_emoji from "../assets/moods/exhausted.svg";
import sick_emoji from "../assets/moods/sick.svg";
import sad_emoji from "../assets/moods/sad.svg";
import normal_emoji from "../assets/moods/normal.svg";
import okay_emoji from "../assets/moods/okay.svg";
import vibing_emoji from "../assets/moods/vibing.svg";
import happy_emoji from "../assets/moods/happy.svg";
import chilling_emoji from "../assets/moods/chilling.svg";

export const mood = {
    ANGRY: angry_emoji,
    EXHAUSTED: exhausted_emoji,
    SICK: sick_emoji,
    SAD: sad_emoji,
    NORMAL: normal_emoji,
    OKAY: okay_emoji,
    VIBING: vibing_emoji,
    HAPPY: happy_emoji,
    CHILLING: chilling_emoji
}

function Header() {

    const [user, setUser] = useState(null);
    const [dateTime, setDateTime] = useState("");

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get("http://localhost:5000/api/users/user", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setUser(res.data);
            } catch (err) {
                console.error("Failed to fetch user:", err);
            }
        };
        fetchUser();

        const updateTime = () => {
            const now = new Date();
            const weekday = now.toLocaleString("en-US", { weekday: "long" });
            const day = now.toLocaleString("en-US", { day: "numeric" });
            const month = now.toLocaleString("en-US", { month: "short" });
            const time = now.toLocaleString("en-US", { hour: "2-digit", minute: "2-digit" });
            setDateTime(`${weekday}, ${day} ${month}, ${time}`);
        };

        updateTime();
        const interval = setInterval(updateTime, 1000 * 60);

        return () => clearInterval(interval);
    }, [user]);

    if (!user) return <p>Loading...</p>;

    return (
        <header className={styles.Header}>
            <div className={styles.currentTime}>{dateTime}</div>
            <div className={styles.currentMood}>
                <p>I am feeling</p>
                <img src={mood[user.currentMood]} />
                <p>right now</p>
            </div>
            <div className={styles.userElements}>
                <div className={styles.etherium}>
                    <img src={coin_svg} style={{width: "20px"}} />
                    <p>{user.etherium}</p>
                </div>
                <div className={styles.motivation}>
                    <div className={styles.wrapper}>
                        <img src={level_svg} style={{width: "30px"}} />
                        <span>{user.motivationLevel}</span>
                    </div>
                    <p>{user.motivationScore.toLocaleString()}</p>
                </div>
                <div className={styles.profileImage}>
                    <img src={user.profileImage.url} />
                </div>
            </div>
        </header>
    )
}

export default Header;