// Popovers.jsx — SetDifficulty, SetBounty
import { Popover, Dialogue } from "./Modal";
import { useEffect, useState } from "react";
import axios from "axios";
import styles from "./css/Popovers.module.scss";
import close_svg from "../assets/icons/close.svg";
import coin_svg from "../assets/icons/coin.svg";
import add_svg from "../assets/icons/add.svg";
import remove_svg from "../assets/icons/remove.svg";
import difficultyOn_svg from "../assets/icons/difficultyOn.svg";
import difficultyOff_svg from "../assets/icons/difficultyOff.svg";
import toast from "react-hot-toast";

const AUTH = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });




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
                    { bounty, mood: task.assignee.mood?.value || "NORMAL" },
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


