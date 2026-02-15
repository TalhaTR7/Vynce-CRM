import Modal from "./Modal";
import { useState } from "react";
import styles from "./css/OpenBid.module.scss";
import close_svg from "../../assets/icons/close.svg";
import loading_svg from "../../assets/icons/loading.svg";
import difficultyOn_svg from "../../assets/icons/difficultyOn.svg";
import difficultyOff_svg from "../../assets/icons/difficultyOff.svg";
import clock_svg from "../../assets/icons/clock.svg";
import coin_svg from "../../assets/icons/coin.svg";
import calendar_svg from "../../assets/icons/calendar.svg";
import info_svg from "../../assets/icons/info.svg";
import toast from "react-hot-toast";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import SelectDate from "./SelectDate";


export function OpenBid({ onClose, task }) {
    const [endDate, setEndDate] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();


    const submit = async (handleClose) => {
        try {
            setLoading(true);

            handleClose();
            toast.success("Task placed on marketplace")
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formateDueDate = (dueDate) => {
        const due = new Date(dueDate);
        const now = new Date();
        const difference = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
        if (difference === 0) return "today";
        else if (difference < 0) return "overdue";
        else return `${difference} day${difference > 1 ? "s" : ""}`;
    };

    return (
        <Modal onClose={onClose} >
            {({ handleClose }) => (<>
                <div className={styles.loading} style={{ visibility: loading ? "visible" : "hidden" }}  >
                    <img src={loading_svg} />
                </div>
                <form onSubmit={(e) => { e.preventDefault(); submit(handleClose); }} style={{ visibility: loading ? "hidden" : "visible" }}>
                    <div className={styles.titlePane}>
                        <label>Opening a bid</label>
                        <img src={close_svg} onClick={handleClose} />
                    </div>
                    <div className={styles.card}>
                        <div className={styles.upperPane}>
                            <div className={styles.project}>
                                <div className={styles.projectImage}>
                                    <img src={task.project.projectImage.url} />
                                </div>
                                <span>{task.project.name}</span>
                            </div>
                            <div className={styles.dueDate}>
                                <img src={clock_svg} />
                                <p>{formateDueDate(task.dueDate)}</p>
                            </div>
                        </div>
                        <h1>{task.title}</h1>
                        <div className={styles.lowerPane}>
                            <span className={styles.status}>{task.board.name}</span>
                            <div className={styles.difficulty}>
                                {
                                    [...Array(5)].map((_, index) => (
                                        <img key={index} src={index < task.difficulty ? difficultyOn_svg : difficultyOff_svg} />
                                    ))
                                }
                            </div>
                        </div>
                    </div>
                    <div className={styles.bounty}>
                        <span>Base reward</span>
                        <div className={styles.coins}>
                            <img src={coin_svg} />
                            <p>{task.ethereum.assigned}</p>
                        </div>
                    </div>
                    <div className={styles.auctionTime}>
                        <span>Ends at</span>
                        <div className={styles.inputField}>
                            <img className={styles.icon} src={calendar_svg} />
                            <SelectDate dueDate={endDate} onChange={setEndDate} />
                        </div>
                    </div>
                    <div className={styles.notice}>
                        <img src={info_svg} />
                        <p >Your action will be notified to the creator. If no one places a bid before the auction ends, the task will still be yours to complete before the due date.</p>
                    </div>
                    <button type="submit" className={styles.submit}>Place task on auction</button>
                </form>
            </>)}
        </Modal>
    );
}