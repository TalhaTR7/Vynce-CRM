// OpenBid modal
import Modal from "./Modal";
import { useState } from "react";
import styles from "./css/OpenBid.module.scss";
import close_svg from "../assets/icons/close.svg";
import loading_svg from "../assets/icons/loading.svg";
import difficultyOn_svg from "../assets/icons/difficultyOn.svg";
import difficultyOff_svg from "../assets/icons/difficultyOff.svg";
import clock_svg from "../assets/icons/clock.svg";
import coin_svg from "../assets/icons/coin.svg";
import calendar_svg from "../assets/icons/calendar.svg";
import info_svg from "../assets/icons/info.svg";
import toast from "react-hot-toast";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import SelectDate from "./SelectDate";


function formatDueDate(dueDate) {
    if (!dueDate) return "no due date";
    const diff = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "today";
    if (diff < 0) return "overdue";
    return `${diff} day${diff !== 1 ? "s" : ""}`;
}

function formatDate(iso) {
    if (!iso) return null;
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}


export function OpenBid({ onClose, task }) {
    const [endDate, setEndDate] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Derived — show user what bidding end date will be
    const biddingEndsAt = endDate
        ? new Date(new Date(endDate).getTime() - 2 * 24 * 60 * 60 * 1000)
        : null;

    const submit = async (handleClose) => {
        if (!endDate) {
            toast.error("End date is required");
            return;
        }
        try {
            setLoading(true);
            await axios.post(`/api/auction/task/${task._id}`, {
                endsAt: endDate,
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            handleClose();
            toast.success("Task placed on marketplace");
            navigate(`/settings/project/${task.project._id}/markets`);
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.msg || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal onClose={onClose}>
            {({ handleClose }) => (
                <form
                    style={{ position: "relative" }}
                    onSubmit={(e) => { e.preventDefault(); submit(handleClose); }}
                >
                    {loading && (
                        <div className={styles.loadingOverlay}>
                            <img src={loading_svg} alt="" />
                        </div>
                    )}

                    {/* Header */}
                    <div className={styles.header}>
                        <div className={styles.headerTitle}>
                            <h2>Open a bid</h2>
                            <span>Marketplace auction</span>
                        </div>
                        <button type="button" className={styles.closeButton} onClick={handleClose} aria-label="Close">
                            <img src={close_svg} alt="" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className={styles.body}>

                        {/* Task preview card */}
                        <div className={styles.taskCard}>
                            <div className={styles.cardMeta}>
                                <div className={styles.cardProject}>
                                    <div className={styles.cardProjectThumb}>
                                        <img src={task.project.projectImage.url} alt="" />
                                    </div>
                                    <span>{task.project.name}</span>
                                </div>
                                <div className={styles.cardDue}>
                                    <img src={clock_svg} alt="" />
                                    <span>{formatDueDate(task.dueDate)}</span>
                                </div>
                            </div>

                            <p className={styles.cardTitle}>{task.title}</p>

                            <div className={styles.cardFooter}>
                                <span className={styles.cardBoard}>{task.board.name}</span>
                                <div className={styles.cardStars}>
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <img key={i} src={i < task.difficulty ? difficultyOn_svg : difficultyOff_svg} alt="" />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Base reward — read only */}
                        <div className={styles.fieldRow}>
                            <span className={styles.fieldLabel}>Base reward</span>
                            <div className={styles.fieldBounty}>
                                <img src={coin_svg} alt="" />
                                <span>{task.ethereum.assigned}</span>
                            </div>
                        </div>

                        {/* Auction end date */}
                        <div className={styles.fieldRow}>
                            <span className={styles.fieldLabel}>Auction ends</span>
                            <div className={styles.fieldDate}>
                                <img src={calendar_svg} alt="" />
                                <SelectDate dueDate={endDate} onChange={setEndDate} />
                            </div>
                        </div>

                        {/* Timeline preview — appears once user picks a date */}
                        {biddingEndsAt && (
                            <div className={styles.timeline}>
                                <div className={styles.timelineRow}>
                                    <div className={styles.timelineDot} />
                                    <div className={styles.timelineContent}>
                                        <span className={styles.timelineLabel}>Bidding open</span>
                                        <span className={styles.timelineDate}>Now → {formatDate(biddingEndsAt)}</span>
                                    </div>
                                </div>
                                <div className={styles.timelineLine} />
                                <div className={styles.timelineRow}>
                                    <div className={`${styles.timelineDot} ${styles.timelineDotYellow}`} />
                                    <div className={styles.timelineContent}>
                                        <span className={styles.timelineLabel}>Review period</span>
                                        <span className={styles.timelineDate}>{formatDate(biddingEndsAt)} → {formatDate(endDate)}</span>
                                    </div>
                                </div>
                                <div className={styles.timelineLine} />
                                <div className={styles.timelineRow}>
                                    <div className={`${styles.timelineDot} ${styles.timelineDotGreen}`} />
                                    <div className={styles.timelineContent}>
                                        <span className={styles.timelineLabel}>Auto-assigned</span>
                                        <span className={styles.timelineDate}>Top bidder wins on {formatDate(endDate)}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Notice */}
                        <div className={styles.notice}>
                            <img src={info_svg} alt="" />
                            <div className={styles.noticeLines}>
                                <p>Bidding closes 2 days before the auction ends, giving you time to review bids and pick a winner manually.</p>
                                <p>If you don't choose, the top bidder is assigned automatically when the auction ends.</p>
                                <p>Auction must end at least 3 days from now and 3 days before the task's due date.</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className={styles.footer}>
                        <button type="submit" className={styles.submitButton} disabled={loading}>
                            Place on auction
                        </button>
                    </div>
                </form>
            )}
        </Modal>
    );
}