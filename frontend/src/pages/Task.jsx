import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import back_svg from "../assets/back.svg";
import more_svg from "../assets/more.svg";
import eth_svg from "../assets/eth.svg";
import timerRunning_svg from "../assets/timer_running.svg";
import timerStopped_svg from "../assets/timer_stopped.svg";
import mp_svg from "../assets/mp.svg";
import comment_svg from "../assets/comment.svg";
import send_svg from "../assets/send.svg";
import favicon from "../assets/favicon.svg";
import styles from "../css/Task.module.scss";
import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";


function Task() {
    const { id } = useParams();
    const navigate = useNavigate();
    const textareaRef = useRef(null);
    const activityEndRef = useRef(null);

    const [task, setTask] = useState(null);
    const [description, setDescription] = useState("");
    const [title, setTitle] = useState("");
    const [editing, setEditing] = useState("");
    const [worktime, setWorktime] = useState(0);
    const [comment, setComment] = useState("");


    useEffect(() => {
        const fetchTask = async () => {
            const res = await axios.get(`http://localhost:5000/api/tasks/task/${id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            setTask(res.data);
        };

        fetchTask();
    }, [id]);

    useEffect(() => {
        let link = document.querySelector("link[rel='icon']");
        link.href = favicon;
        document.title = `${task?.project?.name}: ${task?.title}`;
    }, [task]);

    useEffect(() => {
        if (task?.title !== undefined) {
            setTitle(task.title);
        }
        if (task?.description !== undefined) {
            setDescription(task.description);
        }

    }, [task]);

    useEffect(() => {
        if (editing && textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [description, title, editing]);

    useEffect(() => {
        if (!task) return;
        let baseWorktime = task.worktime;
        if (task.isTimerRunning && task.timerStartedAt) {
            const elapsedMinutes = Math.floor((Date.now() - new Date(task.timerStartedAt).getTime()) / 60000);
            baseWorktime += elapsedMinutes;
        }
        setWorktime(baseWorktime);
    }, [task]);

    useEffect(() => {
        if (!task?.isTimerRunning) return;
        const interval = setInterval(() => {
            setWorktime(prev => prev + 1);
        }, 60000);
        return () => clearInterval(interval);
    }, [task?.isTimerRunning]);

    useEffect(() => {
        if (activityEndRef.current) {
            const container = activityEndRef.current.parentElement;
            container.scrollTop = container.scrollHeight;
        }
    }, [task?.activity]);


    if (!task) return <p>Loading task ...</p>;

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

    const formatDueDate = (dueDate) => {
        if (!dueDate) return "None";
        const due = new Date(dueDate);
        const now = new Date();
        due.setHours(0, 0, 0, 0);
        now.setHours(0, 0, 0, 0);
        if (due.getTime() === now.getTime()) return "today";
        else if (due.getTime() < now.getTime()) return "overdue";
        else return due.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    }

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
        const res = await axios.get(`http://localhost:5000/api/tasks/task/${id}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        });
        setTask(res.data);
    };

    const workedHours = Math.floor(worktime / 60);
    const workedMinutes = worktime % 60;
    const motivation = worktime * 2;

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
                        <h1 className={styles.projectName}>{task.project.name}</h1>
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
                        {
                            (canEdit) ? <img src={more_svg} /> : <></>
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
                                <div className={`${styles.value} ${canEdit ? styles.editable : ""}`}>
                                    <img src={eth_svg} />
                                    <p>{task.ethereum.assigned}</p>
                                </div>
                            </div>
                            {/* task status */}
                            <div className={styles.pair}>
                                <p className={styles.key}>Status</p>
                                <div className={`${styles.value} ${canEdit ? styles.editable : ""}`}>
                                    <div className={styles.color} style={{ backgroundColor: task.board.color }} />
                                    <p>{task.board.name}</p>
                                </div>
                            </div>
                            {/* motivation */}
                            <div className={styles.pair}>
                                <p className={styles.key}>MP earned</p>
                                <div className={styles.value}>
                                    <img src={mp_svg} />
                                    <p>{motivation}</p>
                                </div>
                            </div>
                        </div>
                        <div className={styles.right}>
                            {/* assignee */}
                            <div className={styles.pair}>
                                <p className={styles.key}>Assignee</p>
                                <div className={`${styles.value} ${canEdit ? styles.editable : ""}`}>
                                    <div className={styles.profileImage}>
                                        <img src={task.assignee.profileImage.url} />
                                    </div>
                                    <p>{task.assignee.firstname} {task.assignee.lastname}</p>
                                </div>
                            </div>
                            {/* due date */}
                            <div className={styles.pair}>
                                <p className={styles.key}>Due date</p>
                                <div className={`${styles.value} ${canEdit ? styles.editable : ""}`}>
                                    <p>{formatDueDate(task.dueDate)}</p>
                                </div>
                            </div>
                            {/* task commpletion calculated reward */}
                            <div className={styles.pair}>
                                <p className={styles.key}>Payout</p>
                                <div className={styles.value}>
                                    <img src={eth_svg} />
                                    <p>{task.ethereum.calculated}</p>
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
                                        <img src={task.isTimerRunning ? timerRunning_svg : timerStopped_svg} />
                                    </button>
                                    <p>{workedHours === 0 ? "" : `${workedHours}h `}{workedMinutes}m</p>
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
                            onBlur={() => {
                                setEditing(null);
                                saveDescription();
                            }}
                            onChange={(e) => setDescription(e.target.value)} />
                    )}
                </main>
                <aside className={styles.activityContainer}>
                    <div className={styles.activityPane}>
                        <h1>Activity</h1>
                        <div className={styles.comments}>
                            <img src={comment_svg} />
                            <p>{comment_count}</p>
                        </div>
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
                                    <div className={styles.action}>
                                        <p className={styles.content}>{activity.content}</p>
                                        <p className={styles.timestamp}>{activityTime}</p>
                                    </div>
                                )
                                else return (
                                    <div className={styles.comment}>
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
            </div>
        </div>
    )
}

export default Task;