import styles from "./css/Header.module.scss";
import coin_svg from "../assets/icons/coin.svg";
import level_svg from "../assets/icons/level.svg";
import Loading from "./Loading";
import settings_svg from "../assets/icons/settings.svg";
import project_svg from "../assets/icons/project.svg";
import mood_svg from "../assets/icons/mood.svg";
import add_svg from "../assets/icons/add.svg";
import logout_svg from "../assets/icons/logout.svg";
import mood from "../context/MoodContext";
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { Link } from "react-router-dom";
import { useModal } from "../context/ModalContext";
import MoodPrompt from "../modals/MoodPrompt";


function Header() {

    const [user, setUser] = useState(null);
    const [dateTime, setDateTime] = useState("");
    const [openDropdown, setOpenDropdown] = useState(false);
    const [moodTrigger, setMoodTrigger] = useState(0);
    const dropdownRef = useRef(null);
    const { openModal } = useModal();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await axios.get("/api/users/user", {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                });
                setUser(res.data);
            } catch (err) {
                console.error("Failed to fetch user:", err);
                setUser(false);
            }
        };
        fetchUser();

        const updateTime = () => {
            const now = new Date();
            const weekday = now.toLocaleString("en-US", { weekday: "long" });
            const day = now.toLocaleString("en-US", { day: "numeric" });
            const month = now.toLocaleString("en-US", { month: "short" });
            const time = now.toLocaleString("en-US", { hour: "2-digit", minute: "2-digit" });
            setDateTime(`${weekday}, ${day} ${month}  ·  ${time}`);
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
    }, []);

    if (!user) return <Loading />;

    const dropdownClass = `${styles.dropdownMenu} ${openDropdown ? styles.dropdownOpen : styles.dropdownClosed}`;

    return (
        <header className={styles.appHeader}>

            {/* ── Left — current date + time ────────────────────── */}
            <span className={styles.currentTime}>{dateTime}</span>

            {/* ── Centre — mood indicator ───────────────────────── */}
            <div className={styles.currentMood}>
                <p className={styles.currentMoodLabel}>feeling</p>
                <img src={mood[user.mood?.value] || mood.NORMAL} className={styles.currentMoodIcon} />
                <p className={styles.currentMoodLabel}>right now</p>
            </div>

            {/* ── Right — stats + profile menu ─────────────────── */}
            <div className={styles.userElements}>

                {/* Ethereum / coins */}
                <div className={styles.statPill}>
                    <img src={coin_svg} className={styles.statPillIcon} />
                    <span className={styles.statPillValue}>{user.ethereum ?? 0}</span>
                </div>

                {/* Motivation level + score */}
                <div className={styles.motivationWrapper}>
                    <div className={styles.motivationIconWrapper}>
                        <img src={level_svg} className={styles.motivationIcon} />
                        <span className={styles.motivationLevelBadge}>{user.motivationLevel}</span>
                    </div>
                    <span className={styles.motivationScore}>
                        {(user.motivationScore ?? 0).toLocaleString()}
                    </span>
                </div>

                <div className={styles.headerSeparator} />

                {/* Profile avatar + dropdown */}
                <div className={styles.profileMenu} ref={dropdownRef}>
                    <div
                        className={styles.profileAvatar}
                        onClick={() => setOpenDropdown((prev) => !prev)}
                        role="button"
                        aria-label="Open user menu"
                        aria-expanded={openDropdown}>
                        <img src={user.profileImage?.url} />
                    </div>

                    <ul className={dropdownClass}>

                        {/* User identity */}
                        <div className={styles.dropdownHeader}>
                            <p className={styles.dropdownUserName}>
                                {user.firstname} {user.lastname}
                            </p>
                            <p className={styles.dropdownUserEmail}>{user.email}</p>
                        </div>

                        {/* Settings */}
                        <Link to="/settings/user" className={styles.dropdownOption} onClick={() => setOpenDropdown(false)}>
                            <img src={settings_svg} className={styles.dropdownOptionIcon} />
                            <span className={styles.dropdownOptionLabel}>Settings</span>
                        </Link>

                        {/* My projects */}
                        <Link to="/settings/user/projects" className={styles.dropdownOption} onClick={() => setOpenDropdown(false)}>
                            <img src={project_svg} className={styles.dropdownOptionIcon} />
                            <span className={styles.dropdownOptionLabel}>My projects</span>
                        </Link>

                        {/* Mood swing */}
                        <li className={styles.dropdownOption}
                            onClick={() => {
                                setMoodTrigger(prev => prev + 1);
                                setOpenDropdown(false);
                            }}>
                            <img src={mood_svg} className={styles.dropdownOptionIcon} />
                            <span className={styles.dropdownOptionLabel}>Mood swing</span>
                        </li>

                        <div className={styles.dropdownDivider} />

                        {/* Create project */}
                        <li className={styles.dropdownOption}
                            onClick={() => {
                                openModal("CREATE_PROJECT");
                                setOpenDropdown(false);
                            }}>
                            <img src={add_svg} className={styles.dropdownOptionIcon} />
                            <span className={styles.dropdownOptionLabel}>Create project</span>
                        </li>

                        <div className={styles.dropdownDivider} />

                        {/* Logout — destructive */}
                        <li className={`${styles.dropdownOption} ${styles.dropdownOptionDestructive}`}
                            onClick={() => {
                                openModal("LOGOUT");
                                setOpenDropdown(false);
                            }}>
                            <img src={logout_svg} className={styles.dropdownOptionIcon} />
                            <span className={styles.dropdownOptionLabel}>Logout</span>
                        </li>

                    </ul>
                </div>

            </div>
            <MoodPrompt user={user} setUser={setUser} externalTrigger={moodTrigger} />
        </header>
    );
}

export default Header;