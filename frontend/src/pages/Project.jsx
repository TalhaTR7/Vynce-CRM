import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import Board from "../components/Board";
import styles from "../css/Project.module.scss"
import more_svg from "../assets/more.svg"
import boards_svg from "../assets/boards.svg"
import create_svg from "../assets/create.svg"
import favicon from "../assets/favicon.svg"
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";

function Project() {
    const { id } = useParams();
    const [user, setUser] = useState(null);
    const [project, setProject] = useState(null);
    const [boards, setBoards] = useState([]);

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
    }, [id]);

    useEffect(() => {
        let link = document.querySelector("link[rel='icon']");
        link.href = favicon;
        document.title = `Vynce | ${project?.name}`;
    });

    if (!project) return <p>Loading project...</p>;
    if (!user) return <p>Loading user...</p>;

    const userRole = project.members.find(member => member.userId._id === user._id).role;

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
                                <p>Project {userRole.toLowerCase()}</p>
                            </div>
                        </div>
                        <div className={styles.more}>
                            <img src={more_svg} />
                        </div>
                    </div>
                    <div style={{ height: "25px" }}>
                        {/* spacer */}
                    </div>
                    <div className={styles.boardsContainer}>
                        <div className={styles.boards}>
                            {boards.length === 0 && (
                                <div className={styles.empty}>
                                    <img src={boards_svg} />
                                    <p>Feels a little lonely in here...</p>
                                    {
                                        (userRole === "OWNER" || userRole === "ADMIN") &&
                                        <button className={styles.createBoard}>
                                            <img src={create_svg} />
                                            <p>Create board</p>
                                        </button>
                                    }
                                </div>
                            )}
                            {boards.map((board) => (
                                <Board key={board._id} board={board} role={userRole} />
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}

export default Project