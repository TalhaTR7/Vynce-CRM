import { useEffect, useState } from "react";
import axios from "axios";
import styles from "./css/MoodPrompt.module.scss";
import moodIcons from "../context/MoodContext";
import toast from "react-hot-toast";
import Loading from "../components/Loading";

const MOODS = [
    { key: "ANGRY", src: moodIcons.ANGRY, label: "Angry" },
    { key: "CRYING", src: moodIcons.CRYING, label: "Crying" },
    { key: "SAD", src: moodIcons.SAD, label: "Sad" },
    { key: "NORMAL", src: moodIcons.NORMAL, label: "Normal" },
    { key: "OKAY", src: moodIcons.OKAY, label: "Okay" },
    { key: "HAPPY", src: moodIcons.HAPPY, label: "Happy" },
    { key: "ECSTATIC", src: moodIcons.ECSTATIC, label: "Ecstatic" },
];

export default function MoodPrompt({ user, setUser, externalTrigger }) {
    const [visible, setVisible] = useState(false);
    const [selected, setSelected] = useState(null);
    const [isExiting, setIsExiting] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (externalTrigger > 0) {
            setVisible(true);
        }
    }, [externalTrigger]);

    function getTimeGreeting() {
        const h = new Date().getHours();
        if (h >= 5 && h < 12) return "Good morning!";
        if (h >= 12 && h < 17) return "Good afternoon!";
        if (h >= 17 && h < 21) return "Good evening!";
        return "Hey night owl!";
    }

    useEffect(() => {
        if (!user || user.systemRole === "PLATFORM_OWNER") return;

        const checkExpiration = () => {
            const updatedTime = user.mood?.updatedAt ? new Date(user.mood.updatedAt).getTime() : 0;
            const threeHours = 3 * 60 * 60 * 1000;
            const timeSinceUpdate = Date.now() - updatedTime;

            if (timeSinceUpdate >= threeHours || !user.mood?.updatedAt) {
                setIsExiting(false);
                setVisible(true);
            } else {
                const timeUntilExpiration = threeHours - timeSinceUpdate;
                const timer = setTimeout(() => {
                    setIsExiting(false);
                    setVisible(true);
                }, timeUntilExpiration);
                return () => clearTimeout(timer);
            }
        };

        const cleanup = checkExpiration();
        return () => { if (cleanup) cleanup(); };
    }, [user]);

    const confirm = async () => {
        if (!selected) return;
        try {
            setLoading(true);
            const res = await axios.patch("/api/users/user/mood", { mood: selected }, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            setUser(prev => ({
                ...prev,
                mood: { value: res.data.currentMood, updatedAt: Date.now() }
            }));

            setIsExiting(true);
            setTimeout(() => {
                setVisible(false);
                setSelected(null);
                setIsExiting(false);
                setLoading(false);
            }, 3000);
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.msg || "Failed to set mood");
            setLoading(false);
        }
    };

    if (!visible) return null;

    return (
        <div className={`${styles.overlay} ${isExiting ? styles.exiting : ""}`}>
            <div className={styles.card} style={{ position: "relative" }}>
                {loading && (
                    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 10 }}>
                        <Loading />
                    </div>
                )}

                <div style={{ opacity: loading ? 0 : 1, transition: "opacity 0.2s ease", pointerEvents: loading ? "none" : "auto" }}>
                    <h2>{getTimeGreeting()}</h2>
                    <p>How's your day going?</p>

                    <div className={styles.emojiGrid}>
                        {MOODS.map(m => (
                            <button
                                key={m.key}
                                className={`${styles.emojiBtn} ${selected === m.key ? styles.selected : ""}`}
                                onClick={() => setSelected(m.key)}
                            >
                                <img src={m.src} alt={m.label} />
                            </button>
                        ))}
                    </div>

                    <button className={styles.confirmBtn} onClick={confirm} disabled={!selected}>
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}
