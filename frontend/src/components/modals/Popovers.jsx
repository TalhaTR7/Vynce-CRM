// Popovers.jsx — SetDifficulty, SetBounty, MoodPrompt
import { Popover, Dialogue } from "./Modal";
import { useEffect, useState } from "react";
import axios from "axios";
import styles from "./css/Popovers.module.scss";
import dialogueStyles from "./css/dialogues.module.scss";
import mood from "../../context/MoodContext";
import close_svg from "../../assets/icons/close.svg";
import coin_svg from "../../assets/icons/coin.svg";
import add_svg from "../../assets/icons/add.svg";
import remove_svg from "../../assets/icons/remove.svg";
import difficultyOn_svg from "../../assets/icons/difficultyOn.svg";
import difficultyOff_svg from "../../assets/icons/difficultyOff.svg";
import toast from "react-hot-toast";

const AUTH = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

/* Mood label map — keys must match MoodContext's keys */
const MOOD_LABELS = {
    happy: "Happy",
    focused: "Focused",
    tired: "Tired",
    stressed: "Stressed",
    motivated: "Motivated",
    bored: "Bored",
    creative: "Creative",
    calm: "Calm",
};


/* ══════════════════════════════════════════════════════════════════
   SET DIFFICULTY
   ══════════════════════════════════════════════════════════════════ */
export function SetDifficulty({ onClose, task }) {
    const [difficulty, setDifficulty] = useState(task.difficulty ?? 1);

    const confirm = async (handleClose) => {
        try {
            if (task.difficulty !== difficulty) {
                await axios.patch(
                    `/api/tasks/task/${task._id}/changeDifficulty`,
                    { difficulty },
                    { headers: AUTH() }
                );
            }
            handleClose();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.msg || "Failed to update difficulty");
        }
    };

    return (
        <Popover onClose={onClose}>
            {({ handleClose }) => (
                <form onSubmit={(e) => { e.preventDefault(); confirm(handleClose); }}>

                    {/* Header */}
                    <div className={styles.popoverHead}>
                        <span>Difficulty</span>
                        <button type="button" className={styles.popoverClose} onClick={handleClose} aria-label="Close">
                            <img src={close_svg} alt="" />
                        </button>
                    </div>

                    {/* Stars */}
                    <div className={styles.starsRow}>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <img
                                key={i}
                                src={i < difficulty ? difficultyOn_svg : difficultyOff_svg}
                                className={styles.star}
                                onClick={() => setDifficulty(i + 1)}
                                alt=""
                            />
                        ))}
                    </div>

                    {/* Confirm strip */}
                    <button type="submit" className={styles.confirmStrip}>Confirm</button>
                </form>
            )}
        </Popover>
    );
}


/* ══════════════════════════════════════════════════════════════════
   SET BOUNTY
   ══════════════════════════════════════════════════════════════════ */
export function SetBounty({ onClose, task }) {
    const [bounty, setBounty] = useState(task.ethereum?.assigned ?? 1);

    const decrease = () => setBounty(p => Math.max(1, Number(p) - 1));
    const increase = () => setBounty(p => Number(p) + 1);

    const confirm = async (handleClose) => {
        try {
            if (task.ethereum?.assigned !== bounty) {
                await axios.patch(
                    `/api/tasks/task/${task._id}/changeBounty`,
                    { bounty, mood: task.assignee.currentMood },
                    { headers: AUTH() }
                );
            }
            handleClose();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.msg || "Failed to update bounty");
        }
    };

    return (
        <Popover onClose={onClose}>
            {({ handleClose }) => (
                <form onSubmit={(e) => { e.preventDefault(); confirm(handleClose); }}>

                    {/* Header */}
                    <div className={styles.popoverHead}>
                        <span>Bounty</span>
                        <button type="button" className={styles.popoverClose} onClick={handleClose} aria-label="Close">
                            <img src={close_svg} alt="" />
                        </button>
                    </div>

                    {/* Bounty value + steppers */}
                    <div className={styles.bountyRow}>
                        <div className={styles.bountyValue}>
                            <img src={coin_svg} alt="" />
                            <input
                                type="number"
                                value={bounty}
                                onChange={(e) => setBounty(Math.max(1, Number(e.target.value)))}
                            />
                        </div>
                        <div className={styles.bountySteppers}>
                            <button type="button" className={styles.stepperSub} onClick={decrease}>
                                <img src={remove_svg} alt="" />
                            </button>
                            <button type="button" className={styles.stepperAdd} onClick={increase}>
                                <img src={add_svg} alt="" />
                            </button>
                        </div>
                    </div>

                    {/* Confirm strip */}
                    <button type="submit" className={styles.confirmStrip}>Confirm</button>
                </form>
            )}
        </Popover>
    );
}


/* ══════════════════════════════════════════════════════════════════
   MOOD PROMPT  (Dialogue variant — uses dialogueStyles for layout)
   ══════════════════════════════════════════════════════════════════ */
export function MoodPrompt({ onClose }) {
    const [selected, setSelected] = useState(null);

    function getTimeGreeting() {
        const h = new Date().getHours();
        if (h >= 5 && h < 12) return { eyebrow: "morning check-in", title: "Good morning" };
        if (h >= 12 && h < 17) return { eyebrow: "afternoon check-in", title: "Good afternoon" };
        if (h >= 17 && h < 21) return { eyebrow: "evening check-in", title: "Good evening" };
        return { eyebrow: "late night", title: "Hey night owl" };
    }

    const { eyebrow, title } = getTimeGreeting();

    const confirm = async (handleClose) => {
        if (!selected) { toast.error("Pick a mood first"); return; }
        try {
            await axios.patch("/api/users/user/mood", { mood: selected }, { headers: AUTH() });
            handleClose();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.msg || "Failed to save mood");
        }
    };

    return (
        <Dialogue onClose={onClose}>
            {({ handleClose }) => (
                <form
                    style={{ position: "relative" }}
                    onSubmit={(e) => { e.preventDefault(); confirm(handleClose); }}
                >
                    {/* Rail — green for a positive check-in action */}
                    <div className={`${dialogueStyles.rail} ${dialogueStyles.railGreen}`} />

                    {/* Head */}
                    <div className={dialogueStyles.head}>
                        <span className={dialogueStyles.headEyebrow}>{eyebrow}</span>
                        <p className={dialogueStyles.headTitle}>{title}</p>
                    </div>

                    {/* Mood grid */}
                    <div className={dialogueStyles.body}>
                        <p className={dialogueStyles.desc}>How are you feeling right now? Your team will see this.</p>
                        <div className={styles.moodGrid}>
                            {Object.entries(mood).map(([key, src]) => (
                                <button
                                    key={key}
                                    type="button"
                                    className={`${styles.moodOption} ${selected === key ? styles.moodOptionSelected : ""}`}
                                    onClick={() => setSelected(key)}
                                >
                                    <img src={src} alt={key} />
                                    <span>{MOOD_LABELS[key] ?? key}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Divider + footer */}
                    <div className={dialogueStyles.divider} style={{ marginTop: 16 }} />
                    <div className={dialogueStyles.footer}>
                        <button type="button" className={dialogueStyles.btnCancel} onClick={handleClose}>Skip</button>
                        <button type="submit" className={dialogueStyles.btnGreen}>Set mood</button>
                    </div>
                </form>
            )}
        </Dialogue>
    );
}