import { useState, useEffect, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import styles from "./css/AuctionDetails.module.scss";
import close_svg from "../assets/icons/close.svg";
import open_svg from "../assets/icons/open.svg";
import clock_svg from "../assets/icons/clock.svg";
import coin_svg from "../assets/icons/coin.svg";
import difficultyOn_svg from "../assets/icons/difficultyOn.svg";
import difficultyOff_svg from "../assets/icons/difficultyOff.svg";
import { useNavigate } from "react-router-dom";


const AUTH = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

function getTokenUserId() {
    try {
        const token = localStorage.getItem("token");
        if (!token) return null;
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.id ?? payload._id ?? payload.userId ?? null;
    } catch {
        return null;
    }
}

function formatDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function formatTime(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function formatTimeRemaining(iso) {
    if (!iso) return null;
    const diff = new Date(iso) - new Date();
    if (diff <= 0) return { label: "ended", ended: true };
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    return { label: parts.join(" ") || "< 1m", ended: false };
}

const sortBids = (bids) => [...bids].sort((a, b) =>
    a.amount !== b.amount
        ? a.amount - b.amount
        : new Date(a.createdAt) - new Date(b.createdAt)
);


export default function AuctionDetails({ taskId, onClose }) {
    const [data, setData] = useState(null);
    const [bids, setBids] = useState([]);
    const [bidAmount, setBidAmount] = useState(1);
    const [fetching, setFetching] = useState(true);
    const [loading, setLoading] = useState(false);
    const [closing, setClosing] = useState(false);
    const [selectedBidderId, setSelectedBidderId] = useState(null);
    const scrimRef = useRef(null);
    const navigate = useNavigate();

    /* ── Fetch on mount ── */
    useEffect(() => {
        const fetch = async () => {
            try {
                setFetching(true);
                const res = await axios.get(`/api/auction/task/${taskId}`, { headers: AUTH() });
                setData(res.data);
                setBids(res.data.bids ?? []);
                setBidAmount(res.data.baseReward ?? 1);
                if (res.data.winner) setSelectedBidderId(String(res.data.winner._id));
            } catch (err) {
                toast.error(err.response?.data?.msg || "Failed to load auction");
                animatedClose();
            } finally {
                setFetching(false);
            }
        };
        fetch();
    }, [taskId]);

    /* ── ESC ── */
    useEffect(() => {
        const onKey = (e) => { if (e.key === "Escape") animatedClose(); };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, []);

    const animatedClose = () => {
        setClosing(true);
        setTimeout(onClose, 200);
    };

    const refreshBids = async () => {
        const res = await axios.get(`/api/auction/task/${taskId}`, { headers: AUTH() });
        setBids(res.data.bids ?? []);
    };

    const decrease = () => setBidAmount(p => Math.max(1, p - 1));
    const increase = () => setBidAmount(p => p + 1);

    const placeBid = async () => {
        try {
            setLoading(true);
            await axios.patch(`/api/auction/task/${taskId}`, { amount: bidAmount }, { headers: AUTH() });
            toast.success("Bid placed");
            await refreshBids();
        } catch (err) {
            toast.error(err.response?.data?.msg || "Failed to place bid");
        } finally {
            setLoading(false);
        }
    };

    const removeFromMarket = async () => {
        try {
            setLoading(true);
            await axios.delete(`/api/auction/task/${taskId}`, { headers: AUTH() });
            toast.success("Task removed from marketplace");
            animatedClose();
        } catch (err) {
            toast.error(err.response?.data?.msg || "Failed to remove from market");
        } finally {
            setLoading(false);
        }
    };

    const closeAuction = async () => {
        if (!selectedBidderId) return;
        try {
            setLoading(true);
            await axios.patch(`/api/auction/task/${taskId}/close`, { winnerId: selectedBidderId }, { headers: AUTH() });
            toast.success("Auction closed — task assigned");
            animatedClose();
        } catch (err) {
            toast.error(err.response?.data?.msg || "Failed to close auction");
        } finally {
            setLoading(false);
        }
    };

    /* ── Derived — only valid once data is loaded ── */
    const now = new Date();
    const isOpen = data?.status === "OPEN";
    const biddingEnded = data ? now > new Date(data.biddingEndsAt) : false;
    const auctionEnded = data ? now > new Date(data.endsAt) : false;
    const canBid = isOpen && !biddingEnded;
    const isAssignee = data ? getTokenUserId() === String(data.task?.assignee?._id) : false;
    const biddingTimeLeft = data ? formatTimeRemaining(data.biddingEndsAt) : null;
    const auctionTimeLeft = data ? formatTimeRemaining(data.endsAt) : null;
    const sorted = sortBids(bids);

    return (
        <>
            {/* Scrim */}
            <div
                ref={scrimRef}
                className={`${styles.scrim} ${closing ? styles.closing : ""}`}
                onClick={(e) => { if (e.target === scrimRef.current) animatedClose(); }}
            />

            {/* Panel */}
            <div className={`${styles.panel} ${closing ? styles.closing : ""}`}>

                {/* ── Hero ── */}
                <div className={styles.hero}>
                    <div className={styles.heroTop}>
                        <div className={styles.heroProject}>
                            {data && (
                                <>
                                    <div className={styles.heroThumb}>
                                        <img src={data.project.projectImage.url} alt="" />
                                    </div>
                                    <span className={styles.heroProjectName}>{data.project.name}</span>
                                    <div className={styles.heroDot} />
                                </>
                            )}
                            <span className={styles.heroLabel}>Auction</span>
                        </div>
                        <div className={styles.heroActions}>
                            {data && (
                                <button
                                    className={styles.goToTaskButton}
                                    onClick={() => navigate(`/task/${data.task._id}`)}
                                    title="Go to task"
                                    type="button"
                                >
                                    <img src={open_svg} alt="" />
                                </button>
                            )}
                            <button className={styles.closeButton} onClick={animatedClose} aria-label="Close">
                                <img src={close_svg} alt="" />
                            </button>
                        </div>
                    </div>

                    {fetching ? (
                        <p className={styles.heroTitle} style={{ opacity: 0.3 }}>Loading…</p>
                    ) : (
                        <p className={styles.heroTitle}>{data.task.title}</p>
                    )}

                    <div className={styles.heroPills}>
                        {data && (
                            <div className={styles.stars}>
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <img key={i} src={i < data.task.difficulty ? difficultyOn_svg : difficultyOff_svg} alt="" />
                                ))}
                            </div>
                        )}

                        {/* Bidding active — show bidding countdown */}
                        {!fetching && canBid && biddingTimeLeft && (
                            <div className={`${styles.pill} ${styles.pillBidding}`}>
                                <img src={clock_svg} alt="" />
                                <span>Bidding ends {biddingTimeLeft.label}</span>
                            </div>
                        )}

                        {/* Bidding closed, auction still running — review window */}
                        {!fetching && biddingEnded && !auctionEnded && isOpen && (
                            <div className={`${styles.pill} ${styles.pillReview}`}>
                                <span>Review period</span>
                                {auctionTimeLeft && <span>· ends {auctionTimeLeft.label}</span>}
                            </div>
                        )}

                        {/* Auction over */}
                        {!fetching && (auctionEnded || !isOpen) && (
                            <div className={`${styles.pill} ${styles.pillEnded}`}>
                                <span>ended</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Body ── */}
                <div className={styles.body}>
                    {fetching ? (
                        <div className={styles.bidsEmpty} style={{ flex: 1, justifyContent: "center" }}>
                            <p>Loading auction data…</p>
                        </div>
                    ) : (
                        <>
                            {/* Description */}
                            <div className={styles.description}>
                                <p>{data.task.description || "No description provided."}</p>
                            </div>

                            {/* Creator + Assignee */}
                            <div className={styles.peopleRow}>
                                <div className={styles.personCell}>
                                    <span className={styles.personLabel}>Task creator</span>
                                    <div className={styles.personValue}>
                                        <div className={styles.personAvatar}>
                                            <img src={data.task.creator?.profileImage?.url} alt="" />
                                        </div>
                                        <span>{data.task.creator?.firstname} {data.task.creator?.lastname}</span>
                                    </div>
                                </div>
                                <div className={styles.personCell}>
                                    <span className={styles.personLabel}>Original assignee</span>
                                    <div className={styles.personValue}>
                                        {data.task.assignee
                                            ? <>
                                                <div className={styles.personAvatar}>
                                                    <img src={data.task.assignee.profileImage?.url} alt="" />
                                                </div>
                                                <span>{data.task.assignee.firstname} {data.task.assignee.lastname}</span>
                                            </>
                                            : <span style={{ color: "var(--text-muted)" }}>—</span>
                                        }
                                    </div>
                                </div>
                            </div>

                            {/* Bounty · Bidding ends · Auction ends · Due */}
                            <div className={styles.statsStrip}>
                                <div className={styles.statCell}>
                                    <span className={styles.statLabel}>Base bounty</span>
                                    <div className={styles.statValue}>
                                        <img src={coin_svg} alt="" />
                                        {data.baseReward}
                                    </div>
                                </div>
                                <div className={styles.statCell}>
                                    <span className={styles.statLabel}>Bidding ends</span>
                                    <div className={`${styles.statValue} ${biddingEnded ? styles.statValueMuted : ""}`}>
                                        {formatDate(data.biddingEndsAt)}
                                    </div>
                                </div>
                                <div className={styles.statCell}>
                                    <span className={styles.statLabel}>Auction ends</span>
                                    <div className={styles.statValue}>{formatDate(data.endsAt)}</div>
                                </div>
                                <div className={styles.statCell}>
                                    <span className={styles.statLabel}>Due</span>
                                    <div className={styles.statValue}>{formatDate(data.task.dueDate)}</div>
                                </div>
                            </div>

                            {/* Winner strip */}
                            {data.winner && (
                                <div className={styles.winnerStrip}>
                                    <span className={styles.winnerLabel}>Current winner</span>
                                    <div className={styles.winnerValue}>
                                        <div className={styles.winnerAvatar}>
                                            <img src={data.winner.profileImage?.url} alt="" />
                                        </div>
                                        <span>{data.winner.firstname} {data.winner.lastname}</span>
                                    </div>
                                </div>
                            )}

                            {/* Bid action */}
                            <div className={styles.bidSection}>
                                {isAssignee ? (
                                    <>
                                        <span className={styles.bidLabel}>Your listing</span>
                                        {!biddingEnded ? (
                                            <button
                                                className={styles.removeBtn}
                                                onClick={removeFromMarket}
                                                disabled={loading}
                                            >
                                                {loading ? "Removing…" : "Take off marketplace"}
                                            </button>
                                        ) : (
                                            <p className={styles.reviewNote}>
                                                Bidding has closed. Select a winner below or the top bidder will be assigned automatically when the auction ends.
                                            </p>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <span className={styles.bidLabel}>Your bid</span>
                                        <div className={styles.bidControls}>
                                            <div className={styles.stepper}>
                                                <button type="button" className={styles.stepBtn} onClick={decrease} disabled={!canBid}>−</button>
                                                <div className={styles.stepCenter}>
                                                    <img src={coin_svg} alt="" />
                                                    <input
                                                        type="number"
                                                        value={bidAmount}
                                                        onChange={(e) => setBidAmount(Math.max(1, Number(e.target.value)))}
                                                        disabled={!canBid}
                                                    />
                                                </div>
                                                <button type="button" className={styles.stepBtn} onClick={increase} disabled={!canBid}>+</button>
                                            </div>
                                            <button
                                                className={styles.bidBtn}
                                                onClick={placeBid}
                                                disabled={loading || !canBid}
                                            >
                                                {loading ? "Placing…" : canBid ? "Place bid" : biddingEnded ? "Bidding closed" : "Auction closed"}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Bids list */}
                            <div className={styles.bidsSection}>
                                <span className={styles.bidsLabel}>
                                    Bids{bids.length > 0 ? ` · ${bids.length}` : ""}
                                    {isAssignee && bids.length > 0 && biddingEnded && (
                                        <span className={styles.bidsLabelHint}> — tap a row to select winner</span>
                                    )}
                                </span>

                                {bids.length > 0 ? (
                                    <>
                                        <div className={styles.bidsTableHead}>
                                            <span>Bidder</span>
                                            <span>Amount</span>
                                            <span>Date</span>
                                            <span>Time</span>
                                        </div>
                                        {sorted.map((bid, i) => {
                                            const bidderId = String(bid.bidder?._id);
                                            const isSelected = isAssignee && selectedBidderId === bidderId;
                                            return (
                                                <div
                                                    key={bid._id}
                                                    className={`${styles.bidEntry} ${isSelected ? styles.bidEntrySelected : ""}`}
                                                    onClick={isAssignee && biddingEnded ? () => setSelectedBidderId(bidderId) : undefined}
                                                    style={isAssignee && biddingEnded ? { cursor: "pointer" } : undefined}
                                                >
                                                    <div className={styles.bidUser}>
                                                        <span className={`${styles.bidIndex} ${i === 0 ? styles.bidIndexFirst : ""}`}>
                                                            {i + 1}
                                                        </span>
                                                        <div className={styles.bidAvatar}>
                                                            <img src={bid.bidder?.profileImage?.url} alt="" />
                                                        </div>
                                                        <span>{bid.bidder?.firstname} {bid.bidder?.lastname}</span>
                                                    </div>
                                                    <div className={styles.bidAmount}>
                                                        <img src={coin_svg} alt="" />
                                                        <span>{bid.amount}</span>
                                                    </div>
                                                    <span className={styles.bidDate}>{formatDate(bid.createdAt)}</span>
                                                    <span className={styles.bidTime}>{formatTime(bid.createdAt)}</span>
                                                </div>
                                            );
                                        })}

                                        {/* Only show close button during review window */}
                                        {isAssignee && selectedBidderId && biddingEnded && !auctionEnded && (
                                            <button
                                                className={styles.closeAuctionBtn}
                                                onClick={closeAuction}
                                                disabled={loading}
                                            >
                                                {loading ? "Closing…" : "Assign & close auction"}
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <div className={styles.bidsEmpty}>
                                        <p>No bids yet — be the first.</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}