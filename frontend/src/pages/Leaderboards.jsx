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
const RANK_LABELS = { 1: "#1", 2: "#2", 3: "#3" };
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

        (async () => {
            try {
                const res = await axios.get("/api/projects/user", { headers: AUTH() });
                const list = Array.isArray(res.data) ? res.data : [];
                setProjects(list);
                if (list.length) setActiveProjectId(list[0]._id);
            } catch (err) { console.error(err); }
        })();
    }, []);

    useEffect(() => {
        if (!activeProjectId) return;
        (async () => {
            try {
                setLoading(true);
                const res = await axios.get(
                    `/api/leaderboards/project/${activeProjectId}`,
                    { headers: AUTH() }
                );
                setEntries(res.data);
            } catch (err) {
                console.error(err);
                setEntries([]);
            } finally {
                setLoading(false);
            }
        })();
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

                    {/* ══ Page header — redesigned ══ */}
                    <div className={styles.pageHeader}>
                        <div className={styles.pageHeaderLeft}>
                            <div className={styles.pageTitleRow}>
                                <div className={styles.pageTitleIcon} />
                                <h1 className={styles.pageTitle}>Leaderboards</h1>
                            </div>
                            <p className={styles.pageSubtitle}>Resets every Sunday at midnight</p>
                        </div>

                        {/* Segmented project switcher */}
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

                    {/* ══ Content ══ */}
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
                            {/* ══ Podium cards — UNCHANGED ══ */}
                            <div className={styles.podium}>
                                {podium.map(entry => (
                                    <div
                                        key={entry.user._id}
                                        className={`${styles.podiumCard} ${styles[`podiumCard${entry.rank}`]}`}
                                    >
                                        <span className={styles.ghostNum}>#{entry.rank}</span>

                                        <div className={styles.xpBlock}>
                                            <span className={styles.xpNum}>{entry.weeklyXP.toLocaleString()}</span>
                                            <span className={styles.xpLabel}>weekly xp</span>
                                        </div>

                                        <div className={styles.cardAvatar}>
                                            <div className={styles.avatarRing}>
                                                {entry.user.profileImage?.url
                                                    ? <img src={entry.user.profileImage.url} alt="" />
                                                    : entry.user.firstname?.[0]
                                                }
                                            </div>
                                        </div>

                                        <div className={styles.cardContent}>
                                            <span className={styles.firstName}>{entry.user.firstname}</span>
                                            <span className={styles.lastName}>{entry.user.lastname}</span>

                                            <div className={styles.metaRow}>
                                                <span className={styles.rankChip}>{RANK_LABELS[entry.rank]}</span>

                                                {activeProject && (
                                                    <>
                                                        <div className={styles.metaDivider} />
                                                        <div className={styles.projectTag}>
                                                            <div className={styles.projectThumbSmall}>
                                                                <img src={activeProject.projectImage.url} alt="" />
                                                            </div>
                                                            <span className={styles.projectName}>{activeProject.name}</span>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* ══ Full ranked table — redesigned ══ */}
                            <div className={styles.tableWrap}>

                                {/* Caption bar */}
                                <div className={styles.tableCaption}>
                                    <div className={styles.tableCaptionLeft}>
                                        <div className={styles.tableCaptionDot} />
                                        <span className={styles.tableCaptionTitle}>Full Rankings</span>
                                    </div>
                                    <span className={styles.tableCaptionCount}>{fullList.length} members</span>
                                </div>

                                {/* Column headers */}
                                <div className={styles.tableHead}>
                                    <span className={styles.thRank}>Rank</span>
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
                                            {/* Rank */}
                                            <span className={`${styles.tdRank} ${entry.rank === 1 ? styles.tdRankFirst :
                                                    entry.rank === 2 ? styles.tdRankSecond :
                                                        entry.rank === 3 ? styles.tdRankThird : ""
                                                }`}>
                                                {entry.rank}
                                            </span>

                                            {/* Member */}
                                            <div className={styles.tdMember}>
                                                <div className={styles.tdAvatar}>
                                                    <img src={entry.user.profileImage?.url} alt="" />
                                                </div>
                                                <div className={styles.tdNameBlock}>
                                                    <span className={styles.tdName}>
                                                        {entry.user.firstname} {entry.user.lastname}
                                                    </span>
                                                </div>
                                                {entry.isMe && (
                                                    <span className={styles.meBadge}>you</span>
                                                )}
                                            </div>

                                            {/* Weekly XP */}
                                            <div className={styles.tdStat}>
                                                <img src={leaderboard_svg} alt="" />
                                                <span>{entry.weeklyXP.toLocaleString()}</span>
                                            </div>

                                            {/* All-time MP */}
                                            <div className={styles.tdStat}>
                                                <img src={leaderboard_svg} alt="" />
                                                <span>{(entry.user.motivationScore ?? 0).toLocaleString()}</span>
                                            </div>

                                            {/* Reward */}
                                            <div className={styles.tdReward}>
                                                {REWARDS[entry.rank] ? (
                                                    <div className={styles.rewardPill}>
                                                        <img src={coin_svg} alt="" />
                                                        <span>{REWARDS[entry.rank]}</span>
                                                    </div>
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