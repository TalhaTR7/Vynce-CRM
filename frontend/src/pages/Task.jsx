import favicon from "../assets/icons/favicon.svg"
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import styles from "../css/Task.module.scss";
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
import SelectDate from "../components/modals/SelectDate";
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

    const fetchTask = async () => {
        const _headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };

        const res = await axios.get(`http://localhost:5000/api/tasks/task/${id}`, { headers: _headers });

        setTask(res.data);
        setActiveBoard(res.data.board);
        setActiveAssignee(res.data.assignee);

        const _members = await axios.get(`http://localhost:5000/api/memberships/project/${res.data.project._id}`, { headers: _headers });
        setMembers(_members?.data);

        const _boards = await axios.get(`http://localhost:5000/api/boards/project/${res.data.project._id}`, { headers: _headers });
        setBoards(_boards?.data);
    };

    useEffect(() => { fetchTask() }, [id, openModal]);

    useEffect(() => {
        let link = document.querySelector("link[rel='icon']");
        link.href = favicon;
        document.title = `${task?.project?.name}: ${task?.title}`;
    }, [task]);

    useEffect(() => {
        if (task?.title !== undefined)
            setTitle(task.title);
        if (task?.description !== undefined)
            setDescription(task.description);
        if (task?.dueDate != null)
            setDueDate(task.dueDate);
    }, [task]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (openDropdown === "status") {
                if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target)) {
                    setOpenDropdown(null);
                }
            } else if (openDropdown === "assignee") {
                if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(e.target)) {
                    setOpenDropdown(null);
                }
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        setSearchValue("");
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [openDropdown]);

    useEffect(() => {
        if (editing && textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [description, title, editing]);

    useEffect(() => {
        const reassign = async () => {
            if (!task || !activeAssignee) return;
            if (activeAssignee._id === task.assigneeId) return;

            try {
                const res = await axios.patch(`http://localhost:5000/api/tasks/task/${id}/reassign`, { assigneeId: activeAssignee._id }, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    }
                });

                if (res.data.activity) {
                    setTask(prev => ({
                        ...prev,
                        assignee: activeAssignee,
                        activity: [...prev.activity, res.data.activity]
                    }));
                }
            } catch (err) {
                console.error(err);
            }
        };

        reassign();
    }, [activeAssignee]);

    useEffect(() => {
        const changeStatus = async () => {
            if (!task || !activeBoard) return;
            if (activeBoard._id === task.board._id) return;

            try {
                const res = await axios.patch(`http://localhost:5000/api/tasks/task/${id}/changeStatus`, { boardId: activeBoard._id }, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    }
                });

                setTask(prev => ({
                    ...prev,
                    board: activeBoard,
                    activity: [...prev.activity, res.data.activity]
                }));
            } catch (err) {
                console.error(err);
            }
        };

        changeStatus();
    }, [activeBoard]);

    useEffect(() => {
        if (!task) return;
        let baseSeconds = task.worktime || 0;
        if (task.isTimerRunning && task.timerStartedAt)
            baseSeconds += Math.floor((Date.now() - new Date(task.timerStartedAt).getTime()) / 1000);
        setWorktime(baseSeconds);
    }, [task]);

    useEffect(() => {
        if (!task?.isTimerRunning) return;
        const interval = setInterval(() => {
            setWorktime(prev => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [task?.isTimerRunning]);

    useEffect(() => {
        if (activityEndRef.current) {
            const container = activityEndRef.current.parentElement;
            container.scrollTop = container.scrollHeight;
        }
    }, [task?.activity]);


    if (!task) return <Loading />;


    const saveTitle = async () => {
        if (title === task.title) return;
        try {
            const res = await axios.patch(`http://localhost:5000/api/tasks/task/${id}/editTitle`, { title }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                }
            });
            setTask(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    title: title,
                    activity: [...prev.activity, res.data.activity]
                };
            });
        } catch (err) {
            console.error(err);
        }
    };

    const createdAt = new Date(task.createdAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
    });

    const updateDueDate = async (newDate) => {
        if (task?.dueDate !== newDate) {
            const res = await axios.patch(`http://localhost:5000/api/tasks/task/${id}/editDueDate`, { dueDate: newDate }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });
            setTask(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    dueDate: newDate,
                    activity: [...prev.activity, res.data.activity]
                };
            });
        }
    };

    const handleSelectAssignee = (member) => {
        setActiveAssignee(member);
        setOpenDropdown(null);
    };

    const handleSelectStatus = (board) => {
        setActiveBoard(board);
        setOpenDropdown(null);
    };

    const handleDueDateChange = async (date) => {
        setDueDate(date);
        await updateDueDate(date);
    };

    const startTimer = async () => {
        await axios.patch(`http://localhost:5000/api/tasks/task/${id}/startTimer`, {}, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        });
        const res = await axios.get(`http://localhost:5000/api/tasks/task/${id}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        });
        setTask(res.data);
    };

    const stopTimer = async () => {
        await axios.patch(`http://localhost:5000/api/tasks/task/${id}/stopTimer`, {}, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        });
        fetchTask();
    };

    const workedHours = Math.floor(worktime / 3600);
    const workedMinutes = Math.floor((worktime % 3600) / 60);
    const workedSeconds = worktime % 60;
    const motivation = workedMinutes * 2;

    const canEdit = task.fetcher.role === "OWNER" || task.fetcher.role === "ADMIN";

    const saveDescription = async () => {
        if (description === task.description) return;
        try {
            const res = await axios.patch(`http://localhost:5000/api/tasks/task/${id}/editDescription`, { description }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                }
            });
            setTask(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    description: description,
                    activity: [...prev.activity, res.data.activity]
                };
            });
        } catch (err) {
            console.error(err);
        }
    };

    const comment_count = task?.activity?.filter(action => action.type === "COMMENT").length || 0;

    const addComment = async () => {
        if (!comment.trim()) return;
        try {
            const res = await axios.patch(`http://localhost:5000/api/tasks/task/${id}/addComment`, { comment }, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            setTask(prev => ({
                ...prev,
                activity: [...prev.activity, res.data.activity]
            }));
            setComment("");
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className={styles.canvas}>
            <Header />
            <div className={styles.container}>
                <Sidebar />
                <main className={styles.task}>
                    <div className={styles.projectPane}>
                        <button onClick={() => navigate(-1)} className={styles.backButton}>
                            <img src={back_svg} />
                        </button>
                        <div className={styles.projectImage}>
                            <img src={task.project.projectImage.url} />
                        </div>
                        <Link to={`/project/${task.project._id}`} className={styles.projectName}>{task.project.name}</Link>
                    </div>
                    <div className={styles.titlePane}>
                        {(editing !== "title" || !canEdit) ? (
                            <p className={styles.title} onClick={() => canEdit && setEditing("title")} style={{ cursor: canEdit ? 'pointer' : 'default' }}>
                                {title || "Untitled"}
                            </p>
                        ) : (
                            <textarea
                                ref={textareaRef}
                                className={`${styles.title} ${styles.editable}`}
                                value={title}
                                autoFocus
                                onBlur={() => {
                                    setEditing(null);
                                    saveTitle();
                                }}
                                onChange={(e) => setTitle(e.target.value)} />
                        )}
                    </div>
                    <div className={styles.buttons}>
                        {
                            (task.fetcher._id === task.creator._id) && <>
                                <button style={{ backgroundColor: "var(--green)" }} onClick={() => openModal("CLOSE_TASK", { task: task })}>
                                    <img src={archive_svg} style={{ filter: "invert(1)" }} />
                                    <span style={{ color: "#111" }}>Close</span>
                                </button>
                                <button style={{ backgroundColor: "var(--red)" }} onClick={() => openModal("DELETE_TASK", { task: task })}>
                                    <img src={delete_svg} />
                                    <span style={{ color: "#fff" }}>Delete</span>
                                </button>
                                {task.isSubmitted &&
                                    <button style={{ backgroundColor: "var(--blue)" }} onClick={() => openModal("RETURN_TASK", { task: task })}>
                                        <img src={return_svg} />
                                        <span style={{ color: "#fff" }}>Return</span>
                                    </button>
                                }
                            </>
                        }
                        {
                            (!task.isSubmitted && task.fetcher._id === task.assignee._id) &&
                            <button style={{ backgroundColor: "var(--blue)" }} onClick={() => openModal("SUBMIT_TASK", { task: task })} >
                                <img src={check_svg} style={{ filter: "invert(1)" }} />
                                <span style={{ color: "#fff" }}>Submit</span>
                            </button>
                        }
                    </div>
                    <div className={styles.taskDetails}>
                        <div className={styles.left}>
                            {/* creator */}
                            <div className={styles.pair}>
                                <p className={styles.key}>Creator</p>
                                <div className={styles.value}>
                                    <div className={styles.profileImage}>
                                        <img src={task.creator.profileImage.url} />
                                    </div>
                                    <p>{task.creator.firstname} {task.creator.lastname}</p>
                                </div>
                            </div>
                            {/* creation date */}
                            <div className={styles.pair}>
                                <p className={styles.key}>Created at</p>
                                <div className={styles.value}>
                                    <p>{createdAt}</p>
                                </div>
                            </div>
                            {/* assigned reward */}
                            <div className={styles.pair}>
                                <p className={styles.key}>Bounty</p>
                                <div className={`${styles.value} ${canEdit ? styles.editable : ""}`} onClick={() => canEdit ? openModal("SET_BOUNTY", { task: task }) : ""}>
                                    <img src={coin_svg} />
                                    <p>{task.ethereum.assigned}</p>
                                </div>
                            </div>
                            {/* task status */}
                            <div className={styles.pair}>
                                <p className={styles.key}>Status</p>
                                <div className={`${styles.value} ${styles.boards}`} ref={statusDropdownRef} >
                                    <div className={styles.board} style={{ backgroundColor: openDropdown === "status" ? "#181818" : "" }} onClick={() => setOpenDropdown(openDropdown === "status" ? null : "status")}>
                                        <div className={styles.boardColor} style={{ backgroundColor: activeBoard.color }} />
                                        <p>{activeBoard.name}</p>
                                    </div>
                                    {openDropdown === "status" && (
                                        <ul className={styles.dropdown} onClick={(e) => e.stopPropagation()}>
                                            {boards.map(board => (
                                                <li key={board._id} className={`${styles.board} ${styles.option}`} onClick={() => handleSelectStatus(board)}>
                                                    <div className={styles.boardColor} style={{ backgroundColor: board.color }} />
                                                    <p>{board.name}</p>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                            {/* motivation */}
                            <div className={styles.pair}>
                                <p className={styles.key}>MP earned</p>
                                <div className={styles.value}>
                                    <img src={points_svg} />
                                    <p>{motivation}</p>
                                </div>
                            </div>
                        </div>
                        <div className={styles.right}>
                            {/* assignee */}
                            <div className={styles.pair}>
                                <p className={styles.key}>Assignee</p>
                                <div className={`${styles.value} ${styles.members}`} ref={assigneeDropdownRef} style={{ pointerEvents: canEdit ? "" : "none" }}>
                                    <div className={styles.member} style={{ backgroundColor: openDropdown === "assignee" ? "#181818" : "" }} onClick={() => { if (canEdit) { setOpenDropdown(openDropdown === "assignee" ? null : "assignee"); setSearchValue(""); } }}>
                                        <div className={styles.profileImage}>
                                            <img src={activeAssignee.profileImage.url} />
                                        </div>
                                        <p>{activeAssignee.firstname} {activeAssignee.lastname}</p>
                                    </div>
                                    {openDropdown === "assignee" && (
                                        <div className={styles.dropdown} onClick={(e) => e.stopPropagation()}>
                                            <div className={styles.searchField}>
                                                <img src={search_svg} />
                                                <input type="text" placeholder="Search assignee" onChange={(e) => setSearchValue(e.target.value)} onMouseDown={(e) => e.stopPropagation()} />
                                            </div>
                                            <ul className={styles.memberContainer}>
                                                {
                                                    members.filter(member => {
                                                        if (!searchValue) return true;
                                                        const fullName = `${member.firstname} ${member.lastname}`.toLowerCase();
                                                        return fullName.startsWith(searchValue.toLowerCase())
                                                            || member.firstname.toLowerCase().startsWith(searchValue.toLowerCase())
                                                            || member.lastname.toLowerCase().startsWith(searchValue.toLowerCase());
                                                    }).map(member => (
                                                        <li key={member._id} className={styles.option} onClick={() => handleSelectAssignee(member)}>
                                                            <div className={styles.profileImage}>
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
                            {/* due date */}
                            <div className={styles.pair}>
                                <p className={styles.key}>Due date</p>
                                <div className={`${styles.value} ${canEdit ? styles.editable : ""}`}>
                                    <SelectDate
                                        dueDate={dueDate}
                                        onChange={handleDueDateChange}
                                        placeholder="None"
                                        disabled={!canEdit} />
                                </div>
                            </div>
                            {/* task commpletion calculated reward */}
                            <div className={styles.pair}>
                                <p className={styles.key}>Payout</p>
                                <div className={styles.value}>
                                    <img src={coin_svg} />
                                    <p>{task.ethereum.calculated}</p>
                                </div>
                            </div>
                            {/* task difficulty */}
                            <div className={styles.pair}>
                                <p className={styles.key}>Difficulty</p>
                                <div className={`${styles.value} ${styles.stars} ${canEdit ? styles.editable : ""}`} onClick={() => canEdit ? openModal("SET_DIFFICULTY", { task: task }) : ""}>
                                    {
                                        [...Array(5)].map((_, index) => (
                                            <img key={index} src={index < task.difficulty ? difficultyOn_svg : difficultyOff_svg} />
                                        ))
                                    }
                                </div>
                            </div>
                            {/* time tracker */}
                            <div className={styles.pair}>
                                <p className={styles.key}>Time tracker</p>
                                <div className={styles.value}>
                                    <button
                                        disabled={String(task.fetcher?._id) !== String(task.assignee?._id)}
                                        onClick={task.isTimerRunning ? stopTimer : startTimer}
                                        style={String(task.fetcher?._id) === String(task.assignee?._id) ? { cursor: "pointer" } : { cursor: "default" }}>
                                        <div style={{ width: "12px", height: "12px", borderRadius: "30%", backgroundColor: task.isTimerRunning ? "#ff0000" : "#cccccc" }} />
                                    </button>
                                    <p>{workedHours === 0 ? "" : `${workedHours}h `}{workedMinutes === 0 ? "" : `${workedMinutes}m `}{workedSeconds}s</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    {(editing !== "description" || !canEdit) ? (
                        <p className={styles.description} onClick={() => canEdit && setEditing("description")} style={{ cursor: canEdit ? 'pointer' : 'default' }}>
                            {description || "No description"}
                        </p>
                    ) : (
                        <textarea
                            ref={textareaRef}
                            className={`${styles.description} ${styles.editable}`}
                            value={description}
                            autoFocus
                            onChange={(e) => setDescription(e.target.value)}
                            onBlur={() => {
                                setEditing(null);
                                saveDescription();
                            }} />
                    )}
                </main>
                <aside className={styles.activityContainer}>
                    <div className={styles.activityPane}>
                        <div className={styles.info}>
                            <h1>Activity</h1>
                            <div className={styles.comments}>
                                <img src={comment_svg} />
                                <p>{comment_count}</p>
                            </div>
                        </div>
                        {
                            (task.fetcher._id === task.assignee._id) &&
                            <button className={styles.auction} onClick={() => openModal("OPEN_BID", { task })}>
                                <img src={auction_svg} />
                                <span>Place on auction</span>
                            </button>
                        }
                    </div>
                    <div className={styles.activityWindow}>
                        <div style={{ marginTop: 'auto' }} />
                        {
                            task?.activity.map((activity => {
                                const date = new Date(activity.time);
                                const day = date.getDate();
                                const month = date.toLocaleString("en-GB", { month: "short" });
                                const year = date.getFullYear();
                                let hours = date.getHours();
                                const minutes = date.getMinutes().toString().padStart(2, "0");
                                const median = hours >= 12 ? "pm" : "am";
                                hours = hours % 12 || 12;
                                const activityTime = `${day} ${month} ${year} at ${hours}:${minutes} ${median}`;

                                if (activity.type === "ACTION") return (
                                    <div className={styles.action} key={activity._id}>
                                        <p className={styles.content}>{activity.content}</p>
                                        <p className={styles.timestamp}>{activityTime}</p>
                                    </div>
                                )
                                else return (
                                    <div className={styles.comment} key={activity._id}>
                                        <div className={styles.commentInfo}>
                                            <div className={styles.commenter}>
                                                <div className={styles.profileImage}>
                                                    <img src={activity.user.profileImage.url} />
                                                </div>
                                                <p>{activity.user.firstname} {activity.user.lastname}</p>
                                            </div>
                                            <p className={styles.timestamp}>{activityTime}</p>
                                        </div>
                                        <p className={styles.content}>{activity.content}</p>
                                    </div>
                                )
                            }))
                        }
                        <div ref={activityEndRef} />
                    </div>
                    <div className={styles.commentInput}>
                        <input
                            type="text"
                            placeholder="Write a comment"
                            className={styles.inputField}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    addComment();
                                }
                            }} />
                        <button className={styles.sendButton} onClick={addComment}>
                            <img src={send_svg} />
                        </button>
                    </div>
                </aside>
            </div >
        </div >
    )
}

export default Task;



