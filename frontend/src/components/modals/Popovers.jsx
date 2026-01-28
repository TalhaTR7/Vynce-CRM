import { Popover } from "./Modal";
import { useEffect, useState } from "react";
import styles from "./css/Popovers.module.scss";
import close_svg from "../../assets/icons/close.svg";
import coin_svg from "../../assets/icons/coin.svg";
import add_svg from "../../assets/icons/add.svg";
import remove_svg from "../../assets/icons/remove.svg";
import difficultyOn_svg from "../../assets/icons/difficultyOn.svg";
import difficultyOff_svg from "../../assets/icons/difficultyOff.svg";
import axios from "axios";


export function SetDifficulty({ onClose, task }) {
    const [difficulty, setDifficulty] = useState(1);

    useEffect(() => {
        setDifficulty(task.difficulty);
    }, []);

    const handleStarClick = (index) => {
        setDifficulty(index + 1);
    };

    const confirm = async (handleClose) => {
        const token = localStorage.getItem("token");
        try {
            if (task.difficulty === difficulty) handleClose();
            else await axios.patch(`http://localhost:5000/api/tasks/task/${task._id}/changeDifficulty`, { difficulty }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            handleClose();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <Popover onClose={onClose}>
            {({ handleClose }) => (
                <form onSubmit={(e) => { e.preventDefault(); confirm(handleClose); }}>
                    <div className={styles.titlePane}>
                        <label>Set difficulty</label>
                        <img src={close_svg} onClick={handleClose} />
                    </div>
                    <div className={styles.stars}>
                        {Array.from({ length: 5 }).map((_, index) => (
                            <img key={index}
                                src={index < difficulty ? difficultyOn_svg : difficultyOff_svg}
                                onClick={() => handleStarClick(index)}
                                className={styles.star} />
                        ))}
                    </div>
                    <button type="submit" className={styles.submission}>Confirm</button>
                </form>
            )}
        </Popover>
    );
}

export function SetBounty({ onClose, task }) {
    const [bounty, setBounty] = useState(1);

    useEffect(() => {
        setBounty(task.ethereum.assigned);
    }, []);

    const increaseBounty = () => {
        setBounty((prev) => Number(prev) + 1);
    };

    const decreaseBounty = () => {
        setBounty((prev) => {
            const current = Number(prev);
            if (current - 1 === 0) return current;
            return current - 1;
        });
    };

    const confirm = async (handleClose) => {
        const token = localStorage.getItem("token");
        try {
            if (task.ethereum.assigned === bounty) handleClose();
            else await axios.patch(`http://localhost:5000/api/tasks/task/${task._id}/changeBounty`, {
                bounty: bounty,
                mood: task.assignee.currentMood
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            handleClose();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <Popover onClose={onClose}>
            {({ handleClose }) => (
                <form onSubmit={(e) => { e.preventDefault(); confirm(handleClose); }}>
                    <div className={styles.titlePane}>
                        <label>Set the bounty</label>
                        <img src={close_svg} onClick={handleClose} />
                    </div>
                    <div className={styles.container}>
                        <div className={styles.bounty}>
                            <img src={coin_svg} />
                            <input type="number" value={bounty} onChange={(e) => {
                                const val = e.target.value;
                                setBounty(val < 1 ? 1 : val);
                            }} />
                        </div>
                        <div className={styles.buttons}>
                            <button type="button" style={{ backgroundColor: "var(--red)" }} onClick={() => decreaseBounty()} >
                                <img src={remove_svg} />
                            </button>
                            <button type="button" style={{ backgroundColor: "var(--green)" }} onClick={() => increaseBounty()} >
                                <img src={add_svg} style={{ filter: "invert(1)" }} />
                            </button>
                        </div>
                    </div>
                    <button type="submit" className={styles.submission}>Confirm</button>
                </form>
            )}
        </Popover>
    );
}


export default Popover;