// Dashboard sidebar navigation
import dashboard_svg from "../assets/icons/dashboard.svg";
import inbox_svg from "../assets/icons/inbox.svg";
import leaderboard_svg from "../assets/icons/leaderboard.svg";
import add_svg from "../assets/icons/add.svg";
import more_svg from "../assets/icons/more.svg";
import team_svg from "../assets/icons/team.svg";
import auction_svg from "../assets/icons/auction.svg";
import archive_svg from "../assets/icons/archive.svg";
import settings_svg from "../assets/icons/settings.svg";
import shop_svg from "../assets/icons/shop.svg";
import styles from "../css/Sidebar.module.scss";
import axios from "axios";
import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { useModal } from "../context/ModalContext";
import Loading from "./Loading";


function ProjectPopout({ project, anchorRect, onClose }) {
    const navigate = useNavigate();
    const popoutRef = useRef(null);

    useEffect(() => {
        const handleClick = (e) => {
            if (popoutRef.current && !popoutRef.current.contains(e.target)) onClose();
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [onClose]);

    useEffect(() => {
        document.addEventListener("scroll", onClose, true);
        return () => document.removeEventListener("scroll", onClose, true);
    }, [onClose]);

    if (!anchorRect) return null;

    const style = {
        position: "fixed",
        top: anchorRect.top,
        left: anchorRect.right + 8,
        zIndex: 9999,
    };

    const go = (path) => { navigate(path); onClose(); };

    return createPortal(
        <div className={styles.projectPopout} style={style} ref={popoutRef}>

            {/* Identity header */}
            <div className={styles.projectPopoutHeader}>
                <div className={styles.projectPopoutThumbnail}>
                    <img src={project.projectImage.url} />
                </div>
                <div className={styles.projectPopoutMeta}>
                    <span className={styles.projectPopoutName}>{project.name}</span>
                    <span className={styles.projectPopoutRole}>{project.role}</span>
                </div>
            </div>

            <button className={styles.projectPopoutButton} onClick={() => go(`/settings/project/${project._id}/team`)}>
                <img src={team_svg} />
                <span>Team</span>
            </button>
            <button className={styles.projectPopoutButton} onClick={() => go(`/settings/project/${project._id}/market`)}>
                <img src={auction_svg} />
                <span>Market</span>
            </button>
            {project.role !== "MEMBER" && <>
                <button className={styles.projectPopoutButton} onClick={() => go(`/settings/project/${project._id}/archives`)}>
                    <img src={archive_svg} />
                    <span>Archives</span>
                </button>
                <button className={styles.projectPopoutButton} onClick={() => go(`/settings/project/${project._id}`)}>
                    <img src={settings_svg} />
                    <span>Settings</span>
                </button>
            </>}
        </div>,
        document.body
    );
}


function Sidebar() {
    const [user, setUser] = useState(null);
    const [projects, setProjects] = useState([]);
    const [chats, setChats] = useState([]);
    const [openPopout, setOpenPopout] = useState(null); // { projectId, anchorRect }
    const { openModal } = useModal();
    const { notifications } = useOutletContext();
    const navigate = useNavigate();

    const userEntry = notifications.map(mail => mail.users.find(u => u._id === localStorage.getItem("_id")));
    const unreadCount = userEntry.filter(u => u?.read === false).length;

    useEffect(() => {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        const fetchUser = async () => { const res = await axios.get("/api/users/user", { headers }); setUser(res.data); };
        const fetchChats = async () => { const res = await axios.get("/api/messages/user", { headers }); setChats(res.data); };
        const fetchProjects = async () => { const res = await axios.get("/api/projects/user", { headers }); setProjects(res.data); };

        fetchUser();
        fetchChats();
        fetchProjects();
    }, [openModal]);

    const closePopout = useCallback(() => setOpenPopout(null), []);

    const togglePopout = (e, project) => {
        e.preventDefault();
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        setOpenPopout((prev) =>
            prev?.projectId === project._id ? null : { projectId: project._id, anchorRect: rect }
        );
    };

    if (!user) return <Loading />;

    return (
        <aside className={styles.sidebar}>

            {/* ── Home ──────────────────────────────────────────── */}
            <span className={styles.sectionHeading}>Home</span>

            <nav className={styles.homeNavList}>
                <Link to="/dashboard" className={styles.homeNavLink}>
                    <img src={dashboard_svg} className={styles.homeNavIcon} />
                    <span className={styles.homeNavLabel}>Dashboard</span>
                </Link>
                <Link to="/inbox" className={styles.homeNavLink}>
                    <img src={inbox_svg} className={styles.homeNavIcon} />
                    <span className={styles.homeNavLabel}>Inbox</span>
                    {unreadCount > 0 && <span className={styles.homeNavBadge}>{unreadCount}</span>}
                </Link>
                <Link to="/leaderboards" className={styles.homeNavLink}>
                    <img src={leaderboard_svg} className={styles.homeNavIcon} />
                    <span className={styles.homeNavLabel}>Leaderboards</span>
                </Link>
            </nav>

            <div className={styles.sectionDivider} />

            {/* ── Chats ─────────────────────────────────────────── */}
            <div className={styles.listSection}>
                <span className={styles.listSectionLabel}>Chats</span>
                <div className={styles.listScrollContainer}>
                    {chats.map((chat) => (
                        <Link to={`/chat/${chat._id}`} key={chat._id} className={styles.chatLink}>
                            <div className={styles.chatAvatar}>
                                <img src={chat.otherUser.profileImage.url} />
                            </div>
                            <span className={styles.chatName}>
                                {chat.otherUser.firstname} {chat.otherUser.lastname}
                            </span>
                        </Link>
                    ))}
                </div>
                <button className={styles.listCreateButton} onClick={() => openModal("FIND_USER")}>
                    <img src={add_svg} className={styles.listCreateIcon} />
                    <span className={styles.listCreateLabel}>Find someone</span>
                </button>
            </div>

            <div className={styles.sectionDivider} />

            {/* ── Projects ──────────────────────────────────────── */}
            <div className={styles.listSection}>
                <span className={styles.listSectionLabel}>Projects</span>
                <div className={styles.listScrollContainer}>
                    {projects.map((project) => {
                        const isOpen = openPopout?.projectId === project._id;
                        return (
                            <div
                                key={project._id}
                                className={styles.projectRow}
                            >
                                {/* Navigate to project */}
                                <div
                                    className={styles.projectRowLink}
                                    onClick={() => navigate(`/project/${project._id}`)}
                                >
                                    <div className={styles.projectThumbnail}>
                                        <img src={project.projectImage.url} />
                                    </div>
                                    <span className={styles.projectName}>{project.name}</span>
                                </div>

                                {/* More button — triggers portal popout */}
                                <button
                                    className={`${styles.projectMoreButton} ${isOpen ? styles.projectMoreButtonActive : ""}`}
                                    onClick={(e) => togglePopout(e, project)}
                                    aria-label="Project options"
                                >
                                    <img src={more_svg} className={styles.projectMoreIcon} />
                                </button>
                            </div>
                        );
                    })}
                </div>
                <button className={styles.listCreateButton} onClick={() => openModal("CREATE_PROJECT")}>
                    <img src={add_svg} className={styles.listCreateIcon} />
                    <span className={styles.listCreateLabel}>Create project</span>
                </button>
            </div>

            {/* ── Shop ──────────────────────────────────────────── */}
            <Link to="/shop" className={styles.shopLink}>
                <img src={shop_svg} className={styles.shopIcon} />
                <span className={styles.shopLabel}>Shop</span>
            </Link>

            {/* ── Portal popout (renders into document.body) ────── */}
            {openPopout && (
                <ProjectPopout
                    project={projects.find(p => p._id === openPopout.projectId)}
                    anchorRect={openPopout.anchorRect}
                    onClose={closePopout}
                />
            )}

        </aside>
    );
}

export default Sidebar;