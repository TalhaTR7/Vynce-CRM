
import styles from "../css/Header.module.scss";
import coin_svg from "../assets/icons/coin.svg"
import level_svg from "../assets/icons/level.svg"
import Loading from "./Loading";
import settings_svg from "../assets/icons/settings.svg";
import mood_svg from "../assets/icons/mood.svg";
import add_svg from "../assets/icons/add.svg";
import logout_svg from "../assets/icons/logout.svg";
import mood from "../context/MoodContext";
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { Link } from "react-router-dom";
import { useModal } from "../context/ModalContext";


function Header() {

    const [user, setUser] = useState(null);
    const [dateTime, setDateTime] = useState("");
    const [openDropdown, setOpenDropdown] = useState(false);
    const dropdownRef = useRef(null);
    const { openModal } = useModal();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await axios.get("http://localhost:5000/api/users/user", {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
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
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target))
                setOpenDropdown(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [openDropdown]);

    if (!user) return <Loading />;

    return (
        <header className={styles.Header}>
            <div className={styles.currentTime}>{dateTime}</div>
            <div className={styles.currentMood}>
                <p>I am feeling</p>
                <img src={mood[user.currentMood]} />
                <p>right now</p>
            </div>
            <div className={styles.userElements}>
                <div className={styles.ethereum}>
                    <img src={coin_svg} style={{ width: "20px" }} />
                    <p>{user.ethereum}</p>
                </div>
                <div className={styles.motivation}>
                    <div className={styles.wrapper}>
                        <img src={level_svg} style={{ width: "30px" }} />
                        <span>{user.motivationLevel}</span>
                    </div>
                    <p>{user.motivationScore.toLocaleString()}</p>
                </div>
                <div className={styles.menu} ref={dropdownRef}>
                    <div className={styles.profileImage} onClick={() => setOpenDropdown(openDropdown ? false : true)}>
                        <img src={user.profileImage.url} />
                    </div>
                    <ul className={`${styles.dropdown} ${openDropdown ? styles.dropdownOpen : styles.dropdownClosed}`}>
                        <Link to={"/settings/user"} className={styles.option}>
                            <img src={settings_svg} />
                            <span>Settings</span>
                        </Link>
                        <li className={styles.option}>
                            <img src={mood_svg} />
                            <span>Mood swing</span>
                        </li>
                        <li className={styles.option} onClick={() => { openModal("CREATE_PROJECT"); setOpenDropdown(false) }}>
                            <img src={add_svg} />
                            <span>Create project</span>
                        </li>
                        <div className={styles.divider} />
                        <li className={styles.option} onClick={() => { openModal("LOGOUT"); setOpenDropdown(false) }}>
                            <img src={logout_svg} style={{ width: "18px" }} />
                            <span>Logout</span>
                        </li>
                    </ul>
                </div>
            </div>
        </header>
    )
}

export default Header;
