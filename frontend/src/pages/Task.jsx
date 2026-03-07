// Task detail page
import favicon from "../assets/icons/favicon.svg";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import styles from "./css/Task.module.scss";
import back_svg from "../assets/icons/back.svg";
import archive_svg from "../assets/icons/archive.svg";
import delete_svg from "../assets/icons/delete.svg";
import check_svg from "../assets/icons/check.svg";
import return_svg from "../assets/icons/return.svg";
import search_svg from "../assets/icons/search.svg";
import coin_svg from "../assets/icons/coin.svg";
import difficultyOn_svg from "../assets/icons/difficultyOn.svg";
import difficultyOff_svg from "../assets/icons/difficultyOff.svg";
import points_svg from "../assets/icons/points.svg";
import comment_svg from "../assets/icons/comment.svg";
import auction_svg from "../assets/icons/auction.svg";
import send_svg from "../assets/icons/send.svg";
import { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useModal } from "../context/ModalContext";
import axios from "axios";
import SelectDate from "../modals/SelectDate";
import Loading from "../components/Loading";


function Task() {
    const { id } = useParams();
    const navigate = useNavigate();
    const textareaRef = useRef(null);
    const activityEndRef = useRef(null);

    const [task, setTask] = useState(null);
    const [description, setDescription] = useState("");
    const [title, setTitle] = useState("");
    const [editing, setEditing] = useState("");
    const [dueDate, setDueDate] = useState(null);
    const [worktime, setWorktime] = useState(0);
    const [comment, setComment] = useState("");

    const [openDropdown, setOpenDropdown] = useState(null);
    const statusDropdownRef = useRef(null);
    const assigneeDropdownRef = useRef(null);
    const [members, setMembers] = useState([]);
    const [boards, setBoards] = useState([]);
    const [activeBoard, setActiveBoard] = useState(null);
    const [activeAssignee, setActiveAssignee] = useState(null);
    const [searchValue, setSearchValue] = useState("");

    const { openModal } = useModal();

    /* ── Fetch task + related data ────────────────────────────── */
    const fetchTask = async () => {
        const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
        const res = await axios.get(`/api/tasks/task/${id}`, { headers });
        setTask(res.data);
        setActiveBoard(res.data.board);
        setActiveAssignee(res.data.assignee);

        const _members = await axios.get(`/api/memberships/project/${res.data.project._id}`, { headers });
        setMembers(_members.data);

        const _boards = await axios.get(`/api/boards/project/${res.data.project._id}`, { headers });
        setBoards(_boards.data);
    };

    useEffect(() => { fetchTask(); }, [id, openModal]);

    /* ── Page title ───────────────────────────────────────────── */
    useEffect(() => {
        const link = document.querySelector("link[rel='icon']");
        link.href = favicon;
        if (task) document.title = `${task.project?.name}: ${task.title}`;
    }, [task]);

    /* ── Sync local state from task ───────────────────────────── */
    useEffect(() => {
        if (task?.title !== undefined) setTitle(task.title);
        if (task?.description !== undefined) setDescription(task.description);
        if (task?.dueDate != null) setDueDate(task.dueDate);
    }, [task]);

    /* ── Close dropdowns on outside click ─────────────────────── */
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (openDropdown === "status" && statusDropdownRef.current && !statusDropdownRef.current.contains(e.target))
                setOpenDropdown(null);
            if (openDropdown === "assignee" && assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(e.target))
                setOpenDropdown(null);
        };
        document.addEventListener("mousedown", handleClickOutside);
        setSearchValue("");
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [openDropdown]);

    /* ── Auto-resize textareas ────────────────────────────────── */
    useEffect(() => {
        if (editing && textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
        }
    }, [description, title, editing]);

    /* ── Reassign task ────────────────────────────────────────── */
    useEffect(() => {
        const reassign = async () => {
            if (!task || !activeAssignee) return;
            if (activeAssignee._id === task.assigneeId) return;
            try {
                const res = await axios.patch(`/api/tasks/task/${id}/reassign`, { assigneeId: activeAssignee._id }, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                });
                if (res.data.activity)
                    setTask(prev => ({ ...prev, assignee: activeAssignee, activity: [...prev.activity, res.data.activity] }));
            } catch (err) { console.error(err); }
        };
        reassign();
    }, [activeAssignee]);

    /* ── Change task status ───────────────────────────────────── */
    useEffect(() => {
        const changeStatus = async () => {
            if (!task || !activeBoard) return;
            if (activeBoard._id === task.board._id) return;
            try {
                const res = await axios.patch(`/api/tasks/task/${id}/changeStatus`, { boardId: activeBoard._id }, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                });
                setTask(prev => ({ ...prev, board: activeBoard, activity: [...prev.activity, res.data.activity] }));
            } catch (err) { console.error(err); }
        };
        changeStatus();
    }, [activeBoard]);

    /* ── Worktime base + live counter ─────────────────────────── */
    useEffect(() => {
        if (!task) return;
        let base = task.worktime || 0;
        if (task.isTimerRunning && task.timerStartedAt)
            base += Math.floor((Date.now() - new Date(task.timerStartedAt).getTime()) / 1000);
        setWorktime(base);
    }, [task]);

    useEffect(() => {
        if (!task?.isTimerRunning) return;
        const interval = setInterval(() => setWorktime(prev => prev + 1), 1000);
        return () => clearInterval(interval);
    }, [task?.isTimerRunning]);

    /* ── Auto-scroll activity to bottom ──────────────────────── */
    useEffect(() => {
        if (activityEndRef.current)
            activityEndRef.current.parentElement.scrollTop = activityEndRef.current.parentElement.scrollHeight;
    }, [task?.activity]);

    /* ── Guard ────────────────────────────────────────────────── */
    if (!task) return <Loading />;

    /* ── Derived values ───────────────────────────────────────── */
    const canEdit = task.fetcher.role === "OWNER" || task.fetcher.role === "ADMIN";
    const isCreator = task.fetcher._id === task.creator._id;
    const isAssignee = String(task.fetcher._id) === String(task.assignee._id);

    const workedHours = Math.floor(worktime / 3600);
    const workedMinutes = Math.floor((worktime % 3600) / 60);
    const workedSeconds = worktime % 60;
    const motivation = workedMinutes * 2;
    const commentCount = task?.activity?.filter(a => a.type === "COMMENT").length || 0;

    const createdAt = new Date(task.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

    /* ── Helpers ──────────────────────────────────────────────── */
    const saveTitle = async () => {
        if (title === task.title) return;
        try {
            const res = await axios.patch(`/api/tasks/task/${id}/editTitle`, { title }, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            setTask(prev => ({ ...prev, title, activity: [...prev.activity, res.data.activity] }));
        } catch (err) { console.error(err); }
    };

    const saveDescription = async () => {
        if (description === task.description) return;
        try {
            const res = await axios.patch(`/api/tasks/task/${id}/editDescription`, { description }, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            setTask(prev => ({ ...prev, description, activity: [...prev.activity, res.data.activity] }));
        } catch (err) { console.error(err); }
    };

    const updateDueDate = async (newDate) => {
        if (task?.dueDate === newDate) return;
        const res = await axios.patch(`/api/tasks/task/${id}/editDueDate`, { dueDate: newDate }, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setTask(prev => ({ ...prev, dueDate: newDate, activity: [...prev.activity, res.data.activity] }));
    };

    const handleDueDateChange = async (date) => { setDueDate(date); await updateDueDate(date); };

    const startTimer = async () => {
        await axios.patch(`/api/tasks/task/${id}/startTimer`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
        const res = await axios.get(`/api/tasks/task/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
        setTask(res.data);
    };

    const stopTimer = async () => {
        await axios.patch(`/api/tasks/task/${id}/stopTimer`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
        fetchTask();
    };

    const addComment = async () => {
        if (!comment.trim()) return;
        try {
            const res = await axios.patch(`/api/tasks/task/${id}/addComment`, { comment }, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            setTask(prev => ({ ...prev, activity: [...prev.activity, res.data.activity] }));
            setComment("");
        } catch (err) { console.error(err); }
    };

    const formatActivityTime = (time) => {
        const d = new Date(time);
        const day = d.getDate();
        const month = d.toLocaleString("en-GB", { month: "short" });
        const year = d.getFullYear();
        let hours = d.getHours();
        const minutes = d.getMinutes().toString().padStart(2, "0");
        const median = hours >= 12 ? "pm" : "am";
        hours = hours % 12 || 12;
        return `${day} ${month} ${year} ${hours}:${minutes} ${median}`;
    };


    return (
        <div className={styles.canvas}>
            <Header />
            <div className={styles.container}>
                <Sidebar />

                {/* ══ Main task pane ══════════════════════════════ */}
                <main className={styles.task}>

                    {/* Breadcrumb */}
                    <div className={styles.projectPane}>
                        <button className={styles.backButton} onClick={() => navigate(-1)}>
                            <img src={back_svg} />
                        </button>
                        <div className={styles.projectThumbnail}>
                            <img src={task.project.projectImage.url} />
                        </div>
                        <Link to={`/project/${task.project._id}`} className={styles.projectName}>
                            {task.project.name}
                        </Link>
                    </div>

                    {/* Title */}
                    <div className={styles.titlePane}>
                        {(editing !== "title" || !canEdit) ? (
                            <p className={styles.taskTitle} onClick={() => canEdit && setEditing("title")} style={{ cursor: canEdit ? "pointer" : "default" }}>
                                {title || "Untitled"}
                            </p>
                        ) : (
                            <textarea
                                ref={textareaRef}
                                className={`${styles.taskTitle} ${styles.taskTitleEditable}`}
                                value={title}
                                autoFocus
                                onChange={(e) => setTitle(e.target.value)}
                                onBlur={() => {
                                    setEditing(null);
                                    saveTitle();
                                }} />
                        )}
                    </div>

                    {/* Action buttons */}
                    <div className={styles.actionButtons}>
                        {isCreator && <>
                            <button className={`${styles.actionButton} ${styles.actionButtonClose}`} onClick={() => openModal("CLOSE_TASK", { task })}>
                                <img src={archive_svg} style={{ filter: "invert(1)" }} />
                                <span style={{ color: "#111" }}>Close</span>
                            </button>
                            <button className={`${styles.actionButton} ${styles.actionButtonDelete}`} onClick={() => openModal("DELETE_TASK", { task })}>
                                <img src={delete_svg} />
                                <span style={{ color: "#fff" }}>Delete</span>
                            </button>
                            {task.isSubmitted && (
                                <button className={`${styles.actionButton} ${styles.actionButtonReturn}`} onClick={() => openModal("RETURN_TASK", { task })}>
                                    <img src={return_svg} />
                                    <span style={{ color: "#fff" }}>Return</span>
                                </button>
                            )}
                        </>}
                        {(!task.isSubmitted && isAssignee) && (
                            <button className={`${styles.actionButton} ${styles.actionButtonSubmit}`} onClick={() => openModal("SUBMIT_TASK", { task })}>
                                <img src={check_svg} style={{ filter: "invert(1)" }} />
                                <span style={{ color: "#fff" }}>Submit</span>
                            </button>
                        )}
                    </div>

                    {/* Metadata grid */}
                    <div className={styles.taskDetails}>

                        {/* ── Left column ── */}

                        {/* Creator */}
                        <div className={styles.metaPair}>
                            <span className={styles.metaKey}>Creator</span>
                            <div className={styles.metaValue}>
                                <div className={styles.metaAvatar}>
                                    <img src={task.creator.profileImage.url} />
                                </div>
                                <p>{task.creator.firstname} {task.creator.lastname}</p>
                            </div>
                        </div>

                        {/* Assignee */}
                        <div className={styles.metaPair}>
                            <span className={styles.metaKey}>Assignee</span>
                            <div
                                className={styles.assigneeSelector}
                                ref={assigneeDropdownRef}
                                style={{ pointerEvents: canEdit ? "auto" : "none" }}>
                                <div
                                    className={styles.assigneeTrigger}
                                    onClick={() => {
                                        if (canEdit) {
                                            setOpenDropdown(openDropdown === "assignee" ? null : "assignee");
                                            setSearchValue("");
                                        }
                                    }}>
                                    <div className={styles.metaAvatar}>
                                        <img src={activeAssignee.profileImage.url} />
                                    </div>
                                    <p>{activeAssignee.firstname} {activeAssignee.lastname}</p>
                                </div>
                                {openDropdown === "assignee" && (
                                    <div className={styles.selectorDropdown} onClick={(e) => e.stopPropagation()}>
                                        <div className={styles.selectorSearchField}>
                                            <img src={search_svg} />
                                            <input
                                                type="text"
                                                placeholder="Search member"
                                                onChange={(e) => setSearchValue(e.target.value)}
                                                onMouseDown={(e) => e.stopPropagation()} />
                                        </div>
                                        <ul className={styles.selectorList}>
                                            {members
                                                .filter(m => {
                                                    if (!searchValue) return true;
                                                    const full = `${m.firstname} ${m.lastname}`.toLowerCase();
                                                    return full.startsWith(searchValue.toLowerCase())
                                                        || m.firstname.toLowerCase().startsWith(searchValue.toLowerCase())
                                                        || m.lastname.toLowerCase().startsWith(searchValue.toLowerCase());
                                                })
                                                .map(member => (
                                                    <li key={member._id} className={styles.selectorOption} onClick={() => { setActiveAssignee(member); setOpenDropdown(null); }}>
                                                        <div className={styles.metaAvatar}>
                                                            <img src={member.profileImage.url} />
                                                        </div>
                                                        <p>{member.firstname} {member.lastname}</p>
                                                    </li>
                                                ))
                                            }
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Created at */}
                        <div className={styles.metaPair}>
                            <span className={styles.metaKey}>Created</span>
                            <div className={styles.metaValue}><p>{createdAt}</p></div>
                        </div>

                        {/* Due date */}
                        <div className={styles.metaPair}>
                            <span className={styles.metaKey}>Due date</span>
                            <div className={`${styles.metaValue} ${canEdit ? styles.metaValueEditable : ""}`}>
                                <SelectDate dueDate={dueDate} onChange={handleDueDateChange} placeholder="None" disabled={!canEdit} />
                            </div>
                        </div>

                        {/* Bounty */}
                        <div className={styles.metaPair}>
                            <span className={styles.metaKey}>Bounty</span>
                            <div className={`${styles.metaValue} ${canEdit ? styles.metaValueEditable : ""}`} onClick={() => canEdit && openModal("SET_BOUNTY", { task })}>
                                <img src={coin_svg} />
                                <p>{task.ethereum.assigned}</p>
                            </div>
                        </div>

                        {/* Payout */}
                        <div className={styles.metaPair}>
                            <span className={styles.metaKey}>Payout</span>
                            <div className={styles.metaValue}>
                                <img src={coin_svg} />
                                <p>{task.ethereum.calculated}</p>
                            </div>
                        </div>

                        {/* Status */}
                        <div className={styles.metaPair}>
                            <span className={styles.metaKey}>Status</span>
                            <div className={styles.statusSelector} ref={statusDropdownRef}>
                                <div className={styles.statusTrigger} onClick={() => setOpenDropdown(openDropdown === "status" ? null : "status")}>
                                    <div className={styles.statusColorDot} style={{ backgroundColor: activeBoard.color }} />
                                    <p>{activeBoard.name}</p>
                                </div>
                                {openDropdown === "status" && (
                                    <ul className={styles.selectorDropdown} onClick={(e) => e.stopPropagation()}>
                                        {boards.map(board => (
                                            <li key={board._id} className={styles.selectorOption} onClick={() => { setActiveBoard(board); setOpenDropdown(null); }}>
                                                <div className={styles.statusColorDot} style={{ backgroundColor: board.color }} />
                                                <p>{board.name}</p>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>

                        {/* Difficulty */}
                        <div className={styles.metaPair}>
                            <span className={styles.metaKey}>Difficulty</span>
                            <div className={`${styles.metaValue} ${canEdit ? styles.metaValueEditable : ""}`} onClick={() => canEdit && openModal("SET_DIFFICULTY", { task })}>
                                <div className={styles.difficultyStars}>
                                    {[...Array(5)].map((_, i) => (
                                        <img key={i} src={i < task.difficulty ? difficultyOn_svg : difficultyOff_svg} />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* MP earned */}
                        <div className={styles.metaPair}>
                            <span className={styles.metaKey}>MP earned</span>
                            <div className={styles.metaValue}>
                                <img src={points_svg} />
                                <p>{motivation}</p>
                            </div>
                        </div>

                        {/* Time tracker */}
                        <div className={styles.metaPair}>
                            <span className={styles.metaKey}>Time tracker</span>
                            <div className={styles.metaValue}>
                                <button
                                    className={styles.timerButton}
                                    disabled={!isAssignee}
                                    onClick={task.isTimerRunning ? stopTimer : startTimer}
                                    style={{ cursor: isAssignee ? "pointer" : "default" }}>
                                    <div className={styles.timerDot} style={{ backgroundColor: task.isTimerRunning ? "#ff4444" : "#ffffff4d" }} />
                                </button>
                                <p>
                                    {workedHours > 0 ? `${workedHours}h ` : ""}
                                    {workedMinutes > 0 ? `${workedMinutes}m ` : ""}
                                    {workedSeconds}s
                                </p>
                            </div>
                        </div>

                    </div>

                    {/* Description */}
                    {(editing !== "description" || !canEdit) ? (
                        <p className={styles.taskDescription} onClick={() => canEdit && setEditing("description")} style={{ cursor: canEdit ? "pointer" : "default" }}>
                            {description || "No description"}
                        </p>
                    ) : (
                        <textarea
                            ref={textareaRef}
                            className={`${styles.taskDescription} ${styles.taskDescriptionEditable}`}
                            value={description}
                            autoFocus
                            onChange={(e) => setDescription(e.target.value)}
                            onBlur={() => { setEditing(null); saveDescription(); }} />
                    )}

                </main>

                {/* ══ Activity sidebar ════════════════════════════ */}
                <aside className={styles.activityContainer}>

                    {/* Header */}
                    <div className={styles.activityHeader}>
                        <div className={styles.activityHeadingRow}>
                            <h2 className={styles.activityHeading}>Activity</h2>
                            <div className={styles.activityCommentCount}>
                                <img src={comment_svg} />
                                <p>{commentCount}</p>
                            </div>
                        </div>
                        {isAssignee && (
                            !task.onAuction ?
                                <button className={styles.auctionButton} onClick={() => openModal("OPEN_BID", { task })}>
                                    <img src={auction_svg} />
                                    <span>Place on auction</span>
                                </button> :
                                <button className={styles.auctionButtonDisabled} disabled>
                                    <span>On auction</span>
                                </button>
                        )}
                    </div>

                    {/* Activity feed */}
                    <div className={styles.activityWindow}>
                        <div style={{ marginTop: "auto" }} />
                        {task.activity.map(activity => {
                            const timeStr = formatActivityTime(activity.time);

                            if (activity.type === "ACTION") return (
                                <div className={styles.activityAction} key={activity._id}>
                                    <p className={styles.activityContent}>{activity.content}</p>
                                    <p className={styles.activityTimestamp}>{timeStr}</p>
                                </div>
                            );

                            return (
                                <div className={styles.activityComment} key={activity._id}>
                                    <div className={styles.commentHeader}>
                                        <div className={styles.commenter}>
                                            <div className={styles.commenterAvatar}>
                                                <img src={activity.user.profileImage.url} />
                                            </div>
                                            <p>{activity.user.firstname} {activity.user.lastname}</p>
                                        </div>
                                        <span className={styles.commentTimestamp}>{timeStr}</span>
                                    </div>
                                    <p className={styles.commentContent}>{activity.content}</p>
                                </div>
                            );
                        })}
                        <div ref={activityEndRef} />
                    </div>

                    {/* Comment input */}
                    <div className={styles.commentInput}>
                        <input
                            type="text"
                            placeholder="Write a comment…"
                            className={styles.commentInputField}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    addComment();
                                }
                            }} />
                        <button className={styles.commentSendButton} onClick={addComment}>
                            <img src={send_svg} />
                        </button>
                    </div>

                </aside>

            </div>
        </div>
    );
}

export default Task;