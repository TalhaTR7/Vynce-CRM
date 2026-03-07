// Dashboard page
import favicon from "../assets/icons/favicon.svg";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import add_svg from "../assets/icons/add.svg";
import coin_svg from "../assets/icons/coin.svg";
import comment_svg from "../assets/icons/comment.svg";
import link_svg from "../assets/icons/link.svg";
import noProject_svg from "../assets/icons/noProject.svg";
import boards_svg from "../assets/icons/boards.svg";
import tasks_svg from "../assets/icons/tasks.svg";
import leaderboard_svg from "../assets/icons/leaderboard.svg";
import info_svg from "../assets/icons/info.svg";
import emptyBox_svg from "../assets/icons/emptyBox.svg";
import styles from "./css/Dashboard.module.scss";
import { useModal } from "../context/ModalContext";
import { useState, useEffect } from 'react';
import axios from "axios";
import { Link, useOutletContext } from "react-router-dom";
import Loading from "../components/Loading";


function Dashboard() {

    const [user, setUser] = useState(null);
    const [projects, setProjects] = useState([]);
    const [activeProjectId, setActiveProjectId] = useState(null);
    const [boards, setBoards] = useState([]);
    const [activeBoardId, setActiveBoardId] = useState(null);
    const [tasks, setTasks] = useState([]);

    const { notifications, refreshNotifications } = useOutletContext();
    const topNotifications = notifications.slice(0, 7);
    const { openModal } = useModal();

    /* ── Initial load ─────────────────────────────────────────── */
    useEffect(() => {
        const link = document.querySelector("link[rel='icon']");
        link.href = favicon;
        document.title = "Vynce | Dashboard";

        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        const fetchUser = async () => {
            try {
                const res = await axios.get("/api/users/user", { headers });
                setUser(res.data);
            } catch {
                setUser(false);
            }
        };
        const fetchProjects = async () => {
            try {
                const res = await axios.get("/api/projects/user", { headers });
                setProjects(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
                console.error(err);
            }
        };

        fetchUser();
        fetchProjects();
    }, []);

    /* ── Boards when active project changes ──────────────────── */
    useEffect(() => {
        if (!activeProjectId) return;
        setBoards([]);
        setActiveBoardId(null);
        setTasks([]);

        const fetchBoards = async () => {
            try {
                const res = await axios.get(`/api/boards/project/${activeProjectId}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                });
                setBoards(res.data);
            } catch (err) { console.error(err); }
        };
        fetchBoards();
    }, [activeProjectId]);

    /* ── Tasks when active board changes ─────────────────────── */
    useEffect(() => {
        if (!activeBoardId) return;
        const fetchTasks = async () => {
            try {
                const res = await axios.get(`/api/tasks/dashboard/${activeBoardId}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                });
                setTasks(res.data);
            } catch { setTasks([]); }
        };
        fetchTasks();
    }, [activeBoardId]);

    /* ── Auto-select first project / board ───────────────────── */
    useEffect(() => {
        if (projects.length && !activeProjectId) setActiveProjectId(projects[0]._id);
    }, [projects]);
    useEffect(() => {
        if (boards.length && !activeBoardId) setActiveBoardId(boards[0]._id);
    }, [boards]);

    /* ── Guards ───────────────────────────────────────────────── */
    if (user === null) return <Loading />;
    if (user === false) return <p style={{ fontFamily: "monospace" }}>Unauthorized</p>;

    /* ── Helpers ──────────────────────────────────────────────── */
    const formatCreatedAt = (task) =>
        new Date(task.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

    const formatDueDate = (dueDate) => {
        if (!dueDate) return "—";
        const due = new Date(dueDate);
        const now = new Date();
        due.setHours(0, 0, 0, 0);
        now.setHours(0, 0, 0, 0);
        if (due.getTime() === now.getTime()) return "today";
        if (due.getTime() < now.getTime()) return "overdue";
        return due.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    };

    const dueDateClass = (dueDate) => {
        if (!dueDate) return styles.taskRowMeta;
        const due = new Date(dueDate); due.setHours(0, 0, 0, 0);
        const now = new Date(); now.setHours(0, 0, 0, 0);
        if (due.getTime() === now.getTime()) return `${styles.taskRowMeta} ${styles.taskRowMetaToday}`;
        if (due.getTime() < now.getTime()) return `${styles.taskRowMeta} ${styles.taskRowMetaOverdue}`;
        return styles.taskRowMeta;
    };

    function formatIcon(icon) {
        if (icon.type === "SVG") return icon.refId;
        const build = (type, refId) => `/api/uploads/${type}/${refId}.png`;
        return icon.type === "USER"
            ? build("users", icon.refId)
            : build("projects", icon.refId);
    }

    const handleNotificationClick = async (id) => {
        try {
            await axios.patch("/api/inbox/read", { mailId: id }, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
        } catch (err) { console.error(err); }
        finally { refreshNotifications(); }
    };


    return (
        <div className={styles.canvas}>
            <Header />
            <div className={styles.container}>
                <Sidebar />

                <main className={styles.dashboard}>

                    {/* ══ MY WORK ═════════════════════════════════ */}
                    <section className={styles.myWork}>
                        <h2 className={styles.panelHeading}>My work</h2>

                        {projects.length > 0 ? (<>
                            {/* Project tabs */}
                            <div className={styles.projectPane}>
                                {projects.map(project => (
                                    <div
                                        key={project._id}
                                        className={`${styles.projectTab} ${activeProjectId === project._id ? styles.projectTabActive : ""}`}
                                        onClick={() => setActiveProjectId(project._id)}
                                    >
                                        <div className={styles.projectTabThumbnail}>
                                            <img src={project.projectImage.url} />
                                        </div>
                                        <span className={styles.projectTabName}>{project.name}</span>
                                    </div>
                                ))}
                                <button
                                    className={styles.projectCreateButton}
                                    onClick={() => openModal("CREATE_PROJECT")}
                                >
                                    <img src={add_svg} />
                                    <p>Create project</p>
                                </button>
                            </div>

                            {/* Board tabs + column headers */}
                            {boards.length &&
                                <div className={styles.metaRow}>
                                    <div className={styles.boardPane}>
                                        {boards.map(board => (
                                            <span
                                                key={board._id}
                                                className={`${styles.boardTab} ${activeBoardId === board._id ? styles.boardTabActive : ""}`}
                                                onClick={() => setActiveBoardId(board._id)}
                                            >
                                                {board.name}
                                            </span>
                                        ))}
                                    </div>
                                    <span className={styles.metaColumnLabel}>Created</span>
                                    <span className={styles.metaColumnLabel}>Due</span>
                                    <span className={styles.metaColumnLabel}>Worktime</span>
                                </div>
                            }

                            {/* Task rows */}
                            {boards.length > 0 && (
                                <div className={styles.taskList}>
                                    {tasks.map(task => {
                                        const workedHours = Math.floor(task.worktime / 60);
                                        const workedMinutes = task.worktime % 60;
                                        return (
                                            <Link
                                                key={task._id}
                                                to={`/task/${task._id}`}
                                                className={styles.taskRow}
                                            >
                                                <div className={styles.taskRowMain}>
                                                    <div className={styles.taskProjectThumbnail}>
                                                        <img src={task.projectImage.url} />
                                                    </div>
                                                    <h3 className={styles.taskTitle}>{task.title}</h3>
                                                    <div className={styles.taskBadge}>
                                                        <img src={coin_svg} />
                                                        <p>{task.ethereum}</p>
                                                    </div>
                                                    <div className={styles.taskBadge}>
                                                        <img src={comment_svg} />
                                                        <p>{task.comments}</p>
                                                    </div>
                                                </div>
                                                <span className={styles.taskRowMeta}>{formatCreatedAt(task)}</span>
                                                <span className={dueDateClass(task.dueDate)}>{formatDueDate(task.dueDate)}</span>
                                                <span className={styles.taskRowMeta}>
                                                    {workedHours > 0 ? `${workedHours}h ` : ""}{workedMinutes}m
                                                </span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Empty boards / tasks state */}
                            {tasks.length === 0 && (
                                <div className={styles.nothingState}>
                                    <img src={boards.length > 0 ? tasks_svg : boards_svg} />
                                    <p>Feels a little lonely in here…</p>
                                    <Link to={`/project/${activeProjectId}`} className={styles.nothingStateLink}>
                                        Open project
                                    </Link>
                                </div>
                            )}

                            {/* Open project link */}
                            {boards.length > 0 && tasks.length > 0 && (
                                <Link to={`/project/${activeProjectId}`} className={styles.panelLink}>
                                    <img src={link_svg} />
                                    <p>Open project</p>
                                </Link>
                            )}
                        </>
                        ) : (
                            /* No projects at all */
                            <div className={styles.emptyState}>
                                <img src={noProject_svg} className={styles.emptyStateIcon} />
                                <p className={styles.emptyStateMessage}>
                                    Looks empty… how about we get started?
                                </p>
                                <button
                                    onClick={() => openModal("CREATE_PROJECT")}
                                    className={styles.createProject}
                                >
                                    <img src={add_svg} style={{ width: "14px" }} />
                                    Create your first project
                                </button>
                            </div>
                        )}
                    </section>

                    {/* ══ LEADERBOARDS ════════════════════════════ */}
                    <section className={styles.leaderboards}>
                        <h2 className={styles.panelHeading}>Weekly leaderboards</h2>
                        {projects.length === 0 && (
                            <div className={styles.emptyState}>
                                <img src={leaderboard_svg} className={styles.emptyStateIcon} />
                                <p className={styles.emptyStateMessage}>
                                    Nothing to show here yet. Check back once you've joined a project.
                                </p>
                                <div className={styles.emptyStateInfo}>
                                    <img src={info_svg} />
                                    <p>Join or create a project to come alive</p>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* ══ NOTIFICATIONS ═══════════════════════════ */}
                    <section className={styles.notifications}>
                        <h2 className={styles.panelHeading}>Notifications</h2>

                        {notifications.length > 0 ? (
                            <>
                                <div className={styles.notificationsList}>
                                    {topNotifications.map(mail => {
                                        const userEntry = mail.users.find(u => u._id === localStorage.getItem("_id"));
                                        const isUnread = !userEntry?.read;
                                        const isProject = mail.icon.type === "PROJECT";
                                        const createdAt = new Date(mail.createdAt).toLocaleDateString("en-GB", {
                                            day: "numeric", month: "short",
                                        });

                                        return (
                                            <Link
                                                key={mail._id}
                                                to={mail.action.type === "NAVIGATE" ? mail.action.url : ""}
                                                className={styles.notificationItem}
                                                onClick={async () => {
                                                    if (mail.type === "PROJECT_INVITATION")
                                                        openModal("INVITE_RESPONSE", { payload: mail.payload });
                                                    if (mail.type === "OWNERSHIP_REQUEST")
                                                        openModal("TRANSFER_OWNERSHIP", { payload: mail.payload });
                                                    await handleNotificationClick(mail._id);
                                                }}
                                            >
                                                <div className={`${styles.notificationIcon} ${isProject ? styles.notificationIconSquircle : ""}`}>
                                                    <img src={formatIcon(mail.icon)} />
                                                </div>
                                                <span className={`${styles.notificationTitle} ${isUnread ? styles.notificationTitleUnread : ""}`}>
                                                    {mail.title}
                                                </span>
                                                <span className={styles.notificationTime}>{createdAt}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                                <Link to="/inbox" className={styles.panelLink}>
                                    <img src={link_svg} />
                                    <p>Open inbox</p>
                                </Link>
                            </>
                        ) : (
                            <div className={styles.emptyState}>
                                <img src={emptyBox_svg} className={styles.emptyStateIcon} />
                                <p className={styles.emptyStateMessage}>
                                    Nothing here yet. Seems your inbox chose peace.
                                </p>
                                <Link to="/inbox" className={styles.panelLink} style={{ position: "relative", bottom: "auto", left: "auto", marginTop: "4px" }}>
                                    <img src={link_svg} />
                                    <p>Open inbox</p>
                                </Link>
                            </div>
                        )}
                    </section>

                </main>
            </div>
        </div>
    );
}

export default Dashboard;