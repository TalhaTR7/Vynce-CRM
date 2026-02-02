import favicon from "../assets/icons/favicon.svg"
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import Board from "../components/Board";
import styles from "../css/Project.module.scss"
import owner_svg from "../assets/icons/owner.svg"
import admin_svg from "../assets/icons/admin.svg"
import more_svg from "../assets/icons/more.svg"
import boards_svg from "../assets/icons/boards.svg"
import add_svg from "../assets/icons/add.svg"
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useModal } from "../context/ModalContext";
import { Card } from '../components/Card';
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

    const { openModal } = useModal();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get("http://localhost:5000/api/users/user", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setUser(res.data);
            } catch (err) {
                console.error("Failed to fetch user:", err);
            }
        };

        const fetchProject = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get(`http://localhost:5000/api/projects/project/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setProject(res.data);
            } catch (err) {
                console.error("Failed to fetch project:", err);
            }
        };

        const fetchBoards = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get(`http://localhost:5000/api/boards/project/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setBoards(res.data);
            } catch (err) {
                console.error("Failed to fetch boards:", err);
            }
        };

        fetchUser();
        fetchProject();
        fetchBoards();
    }, [id, openModal]);

    useEffect(() => {
        try {
            if (boards.length > 0) {
                const fetchAllTasks = async (boards) => {
                    const results = await Promise.all(
                        boards.map(board =>
                            axios.get(`http://localhost:5000/api/tasks/board/${board._id}`, {
                                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
                            })
                        )
                    );

                    const map = {};
                    boards.forEach((board, idx) => {
                        map[board._id] = results[idx].data;
                    });

                    setTasksByBoard(map);
                };

                fetchAllTasks(boards);
            }
        } catch (err) {
            console.error(err);
        }
    }, [boards]);


    useEffect(() => {
        let link = document.querySelector("link[rel='icon']");
        link.href = favicon;
        document.title = `Vynce | ${project?.name}`;
    });

    if (!project || !user) return <Loading />;

    const userRole = project.memberships.find(member => member.user._id === user._id).role;

    const handleDragStart = (e) => {
        const allTasks = Object.values(tasksByBoard).flat();
        const task = allTasks.find(_task => _task._id === e.active.id);
        setActiveTask(task);
    };

    const handleDragEnd = async (e) => {
        const { active, over } = e;
        if (!over) return;

        const taskId = active.id;
        const destBoardId = over.id;

        let srcBoardId;
        for (const boardId in tasksByBoard) {
            if (tasksByBoard[boardId].some(_task => _task._id === taskId)) {
                srcBoardId = boardId;
                break;
            }
        }

        if (!srcBoardId || srcBoardId === destBoardId) return;

        const movedTask = tasksByBoard[srcBoardId].find(_task => _task._id === taskId);

        setTasksByBoard(prev => ({
            ...prev,
            [srcBoardId]: prev[srcBoardId].filter(_task => _task._id !== taskId),
            [destBoardId]: [...(prev[destBoardId] || []), { ...movedTask, boardId: destBoardId }],
        }));

        try {
            await axios.patch(`http://localhost:5000/api/tasks/task/${taskId}/changeStatus`, { boardId: destBoardId }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });
        } catch (err) {
            console.error(err);
        }
        setActiveTask(null);
    };

    const projectObj = {
        _id: project._id,
        name: project.name,
        image: project.projectImage.url
    }


    return (
        <div className={styles.canvas}>
            <Header />
            <div className={styles.container}>
                <Sidebar />
                <main className={styles.project}>
                    <div className={styles.projectRow}>
                        <div className={styles.projectInfo}>
                            <div className={styles.projectImage}>
                                <img src={project.projectImage.url} />
                            </div>
                            <div className={styles.memberDetails}>
                                <h1>{project.name}</h1>
                                {project.userRole !== "MEMBER" && <img src={project.userRole === "OWNER" ? owner_svg : admin_svg} />}
                            </div>
                        </div>
                        <div className={styles.more}>
                            <img src={more_svg} />
                        </div>
                    </div>
                    <div style={{ height: "25px" }}>
                        {/* spacer */}
                    </div>
                    <DndContext collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                        <div className={styles.boardsContainer} style={{ overflowX: activeTask ? "hidden" : "visible" }}>
                            <div className={styles.boards}>
                                {boards.length === 0 && (
                                    <div className={styles.empty}>
                                        <img src={boards_svg} />
                                        <p>Feels a little lonely in here...</p>
                                        {
                                            (userRole === "OWNER" || userRole === "ADMIN") &&
                                            <button className={styles.createBoard} onClick={() => openModal("CREATE_BOARD", { project: projectObj })}>
                                                <img src={add_svg} />
                                                <p>Create board</p>
                                            </button>
                                        }
                                    </div>
                                )}
                                {boards.map((board) => (
                                    <Board key={board._id} board={board} tasks={tasksByBoard[board._id] || []} role={userRole} />
                                ))}
                                <DragOverlay>
                                    {activeTask ? (
                                        <div style={{ cursor: 'grabbing', width: '350px' }}>
                                            <Card task={activeTask} isOverlay />
                                        </div>
                                    ) : null}
                                </DragOverlay>
                            </div>
                        </div>
                    </DndContext>
                </main>
            </div>
        </div>
    )
}

export default Project