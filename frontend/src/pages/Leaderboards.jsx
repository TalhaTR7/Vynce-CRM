import { useEffect, useState } from "react";
import favicon from "../assets/icons/favicon.svg";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import coin_svg from "../assets/icons/coin.svg";
import leaderboard_svg from "../assets/icons/leaderboard.svg";
import axios from "axios";
import styles from "./css/Leaderboards.module.scss";

const AUTH = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const REWARDS = { 1: 100, 2: 50, 3: 25 };
const RANK_LABELS = { 1: "1st", 2: "2nd", 3: "3rd" };

// Podium order: 2nd, 1st, 3rd
const PODIUM_ORDER = [2, 1, 3];

function Leaderboards() {
    const [projects, setProjects] = useState([]);
    const [activeProjectId, setActiveProjectId] = useState(null);
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const link = document.querySelector("link[rel='icon']");
        link.href = favicon;
        document.title = "Vynce | Leaderboards";

        const fetchProjects = async () => {
            try {
                const res = await axios.get("/api/projects/user", { headers: AUTH() });
                const list = Array.isArray(res.data) ? res.data : [];
                setProjects(list);
                if (list.length) setActiveProjectId(list[0]._id);
            } catch (err) { console.error(err); }
        };
        fetchProjects();
    }, []);

    useEffect(() => {
        if (!activeProjectId) return;
        const fetchLeaderboard = async () => {
            try {
                setLoading(true);
                const res = await axios.get(`/api/leaderboards/project/${activeProjectId}`, { headers: AUTH() });
                setEntries(res.data);
            } catch (err) {
                console.error(err);
                setEntries([]);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, [activeProjectId]);

    const activeProject = projects.find(p => p._id === activeProjectId);
    const podium = PODIUM_ORDER.map(rank => entries.find(e => e.rank === rank)).filter(Boolean);
    const fullList = [...entries].sort((a, b) => a.rank - b.rank);

    return (
        <div className={styles.canvas}>
            <Header />
            <div className={styles.container}>
                <Sidebar />
                <main className={styles.main}>

                    {/* ── Page header ── */}
                    <div className={styles.pageHeader}>
                        <div className={styles.pageHeaderLeft}>
                            <h1 className={styles.pageTitle}>Leaderboards</h1>
                            <p className={styles.pageSubtitle}>Weekly rankings reset every Sunday at midnight</p>
                        </div>

                        {/* Project switcher */}
                        <div className={styles.projectPane}>
                            {projects.map(p => (
                                <div
                                    key={p._id}
                                    className={`${styles.projectTab} ${activeProjectId === p._id ? styles.projectTabActive : ""}`}
                                    onClick={() => setActiveProjectId(p._id)}
                                >
                                    <div className={styles.projectThumb}>
                                        <img src={p.projectImage.url} alt="" />
                                    </div>
                                    <span>{p.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <div className={styles.loadingState}><p>Loading…</p></div>
                    ) : entries.length === 0 ? (
                        <div className={styles.emptyState}>
                            <img src={leaderboard_svg} className={styles.emptyIcon} alt="" />
                            <p>No activity this week yet.</p>
                            <span>Start completing tasks to appear on the board.</span>
                        </div>
                    ) : (
                        <>
                            {/* ── Podium cards ── */}
                            <div className={styles.podium}>
                                {podium.map(entry => {
                                    const reward = REWARDS[entry.rank];
                                    const isFst = entry.rank === 1;
                                    const isSnd = entry.rank === 2;
                                    return (
                                        <div
                                            key={entry.user._id}
                                            className={`${styles.podiumCard} ${styles[`podiumCard${entry.rank}`]}`}
                                        >
                                            {/* Circular avatar */}
                                            <div className={styles.cardAvatar}>
                                                <img src={entry.user.profileImage?.url} alt="" />
                                            </div>

                                            {/* Info panel */}
                                            <div className={styles.cardInfo}>
                                                <span className={styles.cardWatermark}>#{entry.rank}</span>
                                                <span className={styles.cardRankNum}>{entry.rank}</span>

                                                <div className={styles.cardRankPill}>{RANK_LABELS[entry.rank]}</div>

                                                <div className={styles.cardName}>
                                                    <span className={`${styles.cardFirstname} ${isFst ? styles.cardFirstnameFirst : ""}`}>
                                                        {entry.user.firstname}
                                                    </span>
                                                    <span className={`${styles.cardLastname} ${isFst ? styles.cardLastnameFirst : ""}`}>
                                                        {entry.user.lastname}
                                                    </span>
                                                </div>

                                                {activeProject && (
                                                    <div className={styles.cardProject}>
                                                        <div className={styles.cardProjectThumb}>
                                                            <img src={activeProject.projectImage.url} alt="" />
                                                        </div>
                                                        <span>{activeProject.name}</span>
                                                    </div>
                                                )}

                                                <div className={styles.cardMeta}>
                                                    <div className={`${styles.cardXp} ${isFst ? styles.cardXpFirst : ""}`}>
                                                        <img src={leaderboard_svg} alt="" />
                                                        <span>{entry.weeklyXP.toLocaleString()}</span>
                                                    </div>
                                                    {reward && (
                                                        <div className={`${styles.cardReward} ${isFst ? styles.cardRewardFirst : isSnd ? styles.cardRewardSecond : styles.cardRewardThird}`}>
                                                            <img src={coin_svg} alt="" />
                                                            <span>{reward} ETH</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* ── Full ranked list ── */}
                            <div className={styles.tableWrap}>
                                <div className={styles.tableHead}>
                                    <span className={styles.thRank}>#</span>
                                    <span className={styles.thMember}>Member</span>
                                    <span className={styles.thStat}>Weekly XP</span>
                                    <span className={styles.thStat}>All-time MP</span>
                                    <span className={styles.thStat}>Reward</span>
                                </div>
                                <div className={styles.tableBody}>
                                    {fullList.map(entry => (
                                        <div
                                            key={entry.user._id}
                                            className={`${styles.tableRow} ${entry.isMe ? styles.tableRowMe : ""}`}
                                        >
                                            <span className={`${styles.tdRank} ${entry.rank === 1 ? styles.tdRankFirst : entry.rank === 2 ? styles.tdRankSecond : entry.rank === 3 ? styles.tdRankThird : ""}`}>
                                                {entry.rank}
                                            </span>
                                            <div className={styles.tdMember}>
                                                <div className={styles.tdAvatar}>
                                                    <img src={entry.user.profileImage?.url} alt="" />
                                                </div>
                                                <span className={styles.tdName}>
                                                    {entry.user.firstname} {entry.user.lastname}
                                                </span>
                                                {entry.isMe && <span className={styles.meBadge}>you</span>}
                                            </div>
                                            <div className={styles.tdStat}>
                                                <img src={leaderboard_svg} alt="" />
                                                <span>{entry.weeklyXP.toLocaleString()}</span>
                                            </div>
                                            <div className={styles.tdStat}>
                                                <img src={leaderboard_svg} alt="" />
                                                <span>{(entry.user.motivationScore ?? 0).toLocaleString()}</span>
                                            </div>
                                            <div className={styles.tdReward}>
                                                {REWARDS[entry.rank] ? (
                                                    <>
                                                        <img src={coin_svg} alt="" />
                                                        <span>{REWARDS[entry.rank]}</span>
                                                    </>
                                                ) : (
                                                    <span className={styles.tdRewardNone}>—</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}

export default Leaderboards;