// Project kanban page
import favicon from "../assets/icons/favicon.svg";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import Board from "../components/Board";
import styles from "./css/Project.module.scss";
import owner_svg from "../assets/icons/owner.svg";
import admin_svg from "../assets/icons/admin.svg";
import more_svg from "../assets/icons/more.svg";
import person_svg from "../assets/icons/person.svg";
import team_svg from "../assets/icons/team.svg";
import auction_svg from "../assets/icons/auction.svg";
import archive_svg from "../assets/icons/archive.svg";
import settings_svg from "../assets/icons/settings.svg";
import boards_svg from "../assets/icons/boards.svg";
import add_svg from "../assets/icons/add.svg";
import { Link, useParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useModal } from "../context/ModalContext";
import { Card } from "../components/Card";
import axios from "axios";
import { DndContext, DragOverlay, closestCenter } from "@dnd-kit/core";
import Loading from "../components/Loading";


function Project() {
    const { id } = useParams();

    const [user, setUser] = useState(null);
    const [project, setProject] = useState(null);
    const [boards, setBoards] = useState([]);
    const [tasksByBoard, setTasksByBoard] = useState({});
    const [activeTask, setActiveTask] = useState(null);
    const [openDropdown, setOpenDropdown] = useState(false);
    const [mineOnly, setMineOnly] = useState(false);
    const dropdownRef = useRef(null);
    const { openModal } = useModal();

    /* ── Fetch user, project, boards ─────────────────────────── */
    useEffect(() => {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        const fetchUser = async () => {
            try {
                const res = await axios.get("/api/users/user", { headers });
                setUser(res.data);
            } catch (err) { console.error(err); }
        };
        const fetchProject = async () => {
            try {
                const res = await axios.get(`/api/projects/project/${id}`, { headers });
                setProject(res.data);
            } catch (err) { console.error(err); }
        };
        const fetchBoards = async () => {
            try {
                const res = await axios.get(`/api/boards/project/${id}`, { headers });
                setBoards(res.data);
            } catch (err) { console.error(err); }
        };

        fetchUser();
        fetchProject();
        fetchBoards();
    }, [id, openModal]);

    /* ── Fetch tasks for every board ─────────────────────────── */
    useEffect(() => {
        if (!boards.length) return;
        const fetchAllTasks = async () => {
            try {
                const results = await Promise.all(
                    boards.map(board =>
                        axios.get(`/api/tasks/board/${board._id}`, {
                            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                        })
                    )
                );
                const map = {};
                boards.forEach((board, idx) => { map[board._id] = results[idx].data; });
                setTasksByBoard(map);
            } catch (err) { console.error(err); }
        };
        fetchAllTasks();
    }, [boards]);

    /* ── Close dropdown on outside click ─────────────────────── */
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target))
                setOpenDropdown(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    /* ── Page title ───────────────────────────────────────────── */
    useEffect(() => {
        const link = document.querySelector("link[rel='icon']");
        link.href = favicon;
        if (project) document.title = `Vynce | ${project.name}`;
    }, [project]);

    /* ── Guards ───────────────────────────────────────────────── */
    if (!user) return <Loading />;
    if (!project) return <p style={{ fontFamily: "monospace" }}>403: Unauthorized</p>;

    const userRole = project.memberships.find(m => m.user._id === user._id)?.role;
    const isElevated = userRole === "OWNER" || userRole === "ADMIN";

    const projectObj = { _id: project._id, name: project.name, projectImage: project.projectImage };

    /* ── Drag handlers ────────────────────────────────────────── */
    const handleDragStart = (e) => {
        const allTasks = Object.values(tasksByBoard).flat();
        setActiveTask(allTasks.find(t => t._id === e.active.id));
    };

    const handleDragEnd = async (e) => {
        const { active, over } = e;
        if (!over) { setActiveTask(null); return; }

        const taskId = active.id;
        const destBoardId = over.id;
        let srcBoardId;

        for (const boardId in tasksByBoard) {
            if (tasksByBoard[boardId].some(t => t._id === taskId)) { srcBoardId = boardId; break; }
        }

        if (!srcBoardId || srcBoardId === destBoardId) { setActiveTask(null); return; }

        const movedTask = tasksByBoard[srcBoardId].find(t => t._id === taskId);
        setTasksByBoard(prev => ({
            ...prev,
            [srcBoardId]: prev[srcBoardId].filter(t => t._id !== taskId),
            [destBoardId]: [...(prev[destBoardId] || []), { ...movedTask, boardId: destBoardId }],
        }));

        try {
            await axios.patch(`/api/tasks/task/${taskId}/changeStatus`, { boardId: destBoardId }, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
        } catch (err) { console.error(err); }

        setActiveTask(null);
    };

    const filteredTasks = (tasks = []) => {
        if (!mineOnly) return tasks;
        const myId = localStorage.getItem("_id");
        return myId ? tasks.filter(t => t.assignee?._id === myId) : tasks;
    };


    return (
        <div className={styles.canvas}>
            <Header />
            <div className={styles.container}>
                <Sidebar />

                <main className={styles.project}>

                    {/* ── Project header row ────────────────────── */}
                    <div className={styles.projectRow}>

                        {/* Identity */}
                        <div className={styles.projectInfo}>
                            <div className={styles.projectImage}>
                                <img src={project.projectImage.url} />
                            </div>
                            <div className={styles.projectMeta}>
                                <h1 className={styles.projectName}>{project.name}</h1>
                                {userRole !== "MEMBER" && (
                                    <img src={userRole === "OWNER" ? owner_svg : admin_svg} className={styles.projectRoleBadge} />
                                )}
                            </div>
                        </div>

                        {/* Options dropdown */}
                        <div className={styles.optionsWrapper} ref={dropdownRef}>
                            <div
                                className={styles.optionsButton}
                                onClick={() => setOpenDropdown(prev => !prev)}
                                role="button"
                                aria-label="Project options">
                                <img src={more_svg} className={styles.optionsIcon} />
                            </div>

                            <ul className={`${styles.dropdown} ${openDropdown ? styles.dropdownOpen : styles.dropdownClosed}`}>
                                {isElevated && (
                                    <li className={styles.dropdownOption}
                                        onClick={() => {
                                            openModal("CREATE_BOARD", { project: projectObj });
                                            setOpenDropdown(false);
                                        }}>
                                        <img src={add_svg} className={styles.dropdownOptionIcon} />
                                        <span className={styles.dropdownOptionLabel}>Create board</span>
                                    </li>
                                )}

                                <li className={styles.dropdownOption}
                                    onClick={() => {
                                        setMineOnly(prev => !prev);
                                        setOpenDropdown(false);
                                    }}>
                                    <img src={person_svg} className={styles.dropdownOptionIcon} />
                                    <span className={styles.dropdownOptionLabel}>{mineOnly ? "All tasks" : "My tasks"}</span>
                                </li>

                                <div className={styles.dropdownDivider} />

                                <Link to={`/settings/project/${project._id}/team`} className={styles.dropdownOption} onClick={() => setOpenDropdown(false)}>
                                    <img src={team_svg} className={styles.dropdownOptionIcon} />
                                    <span className={styles.dropdownOptionLabel}>People</span>
                                </Link>
                                <Link to={`/settings/project/${project._id}/markets`} className={styles.dropdownOption} onClick={() => setOpenDropdown(false)}>
                                    <img src={auction_svg} className={styles.dropdownOptionIcon} />
                                    <span className={styles.dropdownOptionLabel}>Markets</span>
                                </Link>

                                {isElevated && <>
                                    <Link to={`/settings/project/${project._id}/archives`} className={styles.dropdownOption} onClick={() => setOpenDropdown(false)}>
                                        <img src={archive_svg} className={styles.dropdownOptionIcon} />
                                        <span className={styles.dropdownOptionLabel}>Archives</span>
                                    </Link>
                                    <Link to={`/settings/project/${project._id}/`} className={styles.dropdownOption} onClick={() => setOpenDropdown(false)}>
                                        <img src={settings_svg} className={styles.dropdownOptionIcon} />
                                        <span className={styles.dropdownOptionLabel}>Settings</span>
                                    </Link>
                                </>}
                            </ul>
                        </div>

                    </div>

                    {/* ── Kanban boards ────────────────────────────── */}
                    <DndContext collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                        <div className={styles.boardsContainer}>
                            <div className={styles.boards}>

                                {/* Empty state */}
                                {boards.length === 0 && (
                                    <div className={styles.emptyState}>
                                        <img src={boards_svg} className={styles.emptyStateIcon} />
                                        <p className={styles.emptyStateMessage}>
                                            Feels a little lonely in here…
                                        </p>
                                        {isElevated && (
                                            <button className={styles.createBoardButton} onClick={() => openModal("CREATE_BOARD", { project: projectObj })}>
                                                <img src={add_svg} />
                                                <p>Create board</p>
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Board columns */}
                                {boards.map(board => (
                                    <Board
                                        key={board._id}
                                        board={board}
                                        tasks={filteredTasks(tasksByBoard[board._id]) || []}
                                        role={userRole} />
                                ))}

                                <DragOverlay>
                                    {activeTask && (
                                        <div style={{ cursor: "grabbing", width: "350px" }}>
                                            <Card task={activeTask} isOverlay />
                                        </div>
                                    )}
                                </DragOverlay>

                            </div>
                        </div>
                    </DndContext>

                </main>
            </div>
        </div>
    );
}

export default Project;