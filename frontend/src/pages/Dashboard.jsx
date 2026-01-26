import favicon from "../assets/icons/favicon.svg";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import add_svg from "../assets/icons/add.svg";
import coin_svg from "../assets/icons/coin.svg";
import comment_svg from "../assets/icons/comment.svg";
import link_svg from "../assets/icons/link.svg";
import boards_svg from "../assets/icons/boards.svg";
import tasks_svg from "../assets/icons/tasks.svg";
import styles from "../css/Dashboard.module.scss";
import { useModal } from "../context/ModalContext";
import { useState, useEffect } from 'react';
import axios from "axios";
import { Link } from "react-router-dom";

function Dashboard() {

    const [user, setUser] = useState(null);
    const [projects, setProjects] = useState([]);
    const [activeProjectId, setActiveProjectId] = useState(projects?.[0]?._id || null);
    const [boards, setBoards] = useState([]);
    const [activeBoardId, setActiveBoardId] = useState(boards?.[0]?._id || null);
    const [tasks, setTasks] = useState([]);

    const { openModal } = useModal();

    useEffect(() => {
        let link = document.querySelector("link[rel='icon']");
        link.href = favicon;
        document.title = "Vynce | More Than a CRM";

        const token = localStorage.getItem("token");

        const fetchUser = async () => {
            try {
                const res = await axios.get("http://localhost:5000/api/users/user", {
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                });
                setUser(res.data);
            } catch (err) {
                console.error(err);
                setUser(false);
            }
        };

        const fetchProjects = async () => {
            try {
                const res = await axios.get("http://localhost:5000/api/projects/user", {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                });
                setProjects(res.data);
            } catch (err) {
                console.error(err);
            }
        };

        fetchUser();
        fetchProjects();
    }, []);

    useEffect(() => {
        if (!activeProjectId) return;

        setBoards([]);
        setActiveBoardId(null);
        setTasks([]);

        const fetchBoards = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/boards/project/${activeProjectId}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                });
                setBoards(res.data);
            } catch (err) {
                console.error(err);
            }
        };

        fetchBoards();
    }, [activeProjectId]);

    useEffect(() => {
        if (!activeBoardId) return;

        const fetchTasks = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/tasks/dashboard/${activeBoardId}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                });
                setTasks(res.data);
            } catch (err) {
                console.error(err);
                setTasks([]);
            }
        };

        fetchTasks();
    }, [activeBoardId])

    useEffect(() => {
        if (projects?.length && !activeProjectId) setActiveProjectId(projects[0]._id);
        if (boards?.length && !activeBoardId) setActiveBoardId(boards[0]._id);
    }, [projects, boards]);


    if (user === null) return <p>Loading user...</p>;
    if (user === false) return <p>Unauthorized</p>;

    const createdAt = (task) => new Date(task.createdAt).toLocaleDateString("en-GB", {
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

    return (
        <div className={styles.canvas}>
            <Header />
            <div className={styles.container}>
                <Sidebar />
                <main className={styles.dashboard}>
                    <section className={styles.myWork}>
                        <h1>My work</h1>
                        <div className={styles.projectPane}>
                            {
                                projects.map(project => (
                                    <div key={project._id}
                                        className={`${styles.project} ${activeProjectId === project._id ? styles.active : ""}`}
                                        onClick={() => setActiveProjectId(project._id)}>
                                        <div className={styles.projectImage}>
                                            <img src={project.projectImage.url} />
                                        </div>
                                        <p>{project.name}</p>
                                    </div>
                                ))
                            }
                            <button className={styles.create} onClick={() => openModal("CREATE_PROJECT")}>
                                <img src={add_svg} />
                                <p>Create project</p>
                            </button>
                        </div>
                        <div className={styles.meta}>
                            <div className={styles.boardPane}>
                                {
                                    boards.map(board => (
                                        <p key={board._id}
                                            className={`${styles.board} ${activeBoardId === board._id ? styles.active : ""}`}
                                            onClick={() => setActiveBoardId(board._id)}>
                                            {board.name}
                                        </p>
                                    ))
                                }
                            </div>
                            <p>Created on</p>
                            <p>Due date</p>
                            <p>Worktime</p>
                        </div>
                        {
                            boards?.length > 0 &&
                            <div className={styles.taskList}>
                                {tasks.map(task => {
                                    const workedHours = Math.floor(task.worktime / 60);
                                    const workedMinutes = task.worktime % 60;
                                    return (
                                        <Link key={task._id} to={`/task/${task._id}`} className={styles.task}>
                                            <div className={styles.taskMain}>
                                                <div className={styles.projectImage}>
                                                    <img src={task.projectImage.url} />
                                                </div>
                                                <h3>{task.title}</h3>
                                                <div className={styles.ethereum}>
                                                    <img src={coin_svg} style={{ height: "21px" }} />
                                                    <p>{task.ethereum}</p>
                                                </div>
                                                <div className={styles.comments}>
                                                    <img src={comment_svg} style={{ width: "18px" }} />
                                                    <p>{task.comments}</p>
                                                </div>
                                            </div>
                                            <p>{createdAt(task)}</p>
                                            <p>{formatDueDate(task.dueDate)}</p>
                                            <p>{workedHours === 0 ? "" : `${workedHours}h `}{workedMinutes}m</p>
                                        </Link>
                                    )
                                })}
                            </div>
                        }
                        {(tasks.length === 0) &&
                            <div className={styles.nothing}>
                                <img src={boards.length > 0 ? tasks_svg : boards_svg} />
                                <p>Feels a little lonely in here...</p>
                                <Link to={`/project/${activeProjectId}`} className={styles.link}>Open project</Link>
                            </div>
                        }
                        {(boards.length > 0 && tasks.length > 0) &&
                            <Link to={`/project/${activeProjectId}`} className={styles.link}>
                                <img src={link_svg} />
                                <p>Open project</p>
                                </Link>
                        }
                    </section>
                    <section className={styles.bottomLeft}>
                        <h1>Weekly leaderboards</h1>
                    </section>
                    <section className={styles.bottomRight}>
                        <h1>Notifications</h1>
                    </section>
                </main>
            </div>
        </div>
    )
}

export default Dashboard;