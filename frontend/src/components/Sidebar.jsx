
import styles from "../css/Sidebar.module.scss";
import dashboard_svg from "../assets/dashboard.svg";
import inbox_svg from "../assets/inbox.svg";
import askai_svg from "../assets/askai.svg";
import create_svg from "../assets/create.svg";
import more_svg from "../assets/more.svg";
import axios from "axios";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function Sidebar() {

    const [user, setUser] = useState(null);
    const [projects, setProjects] = useState([]);
    const [chats, setChats] = useState([]);


    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem("token");
            const res = await axios.get("http://localhost:5000/api/users/user", {
                headers: {
                    Authorization: `Bearer ${token}`
                },
            });
            setUser(res.data);
        };

        const fetchChats = async () => {
            const res = await axios.get("http://localhost:5000/api/messages/user", {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            setChats(res.data);
        };

        const fetchProjects = async () => {
            const res = await axios.get("http://localhost:5000/api/projects/user", {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            setProjects(res.data);
        };

        fetchUser();
        fetchChats();
        fetchProjects();
    }, []);

    if (!user) return <p>Loading...</p>;

    return (
        <aside className={styles.sidebar}>
            <h1>Home</h1>
            <div className={styles.homePages}>
                <Link to={"/dashboard"} className={styles.homeElements}>
                    <img src={dashboard_svg} />
                    <p>Dashboard</p>
                </Link>
                <Link to={"/inbox"} className={styles.homeElements}>
                    <img src={inbox_svg} />
                    <p>Inbox</p>
                </Link>
            </div>
            <div className={styles.divider}>{/* divider */}</div>
            <div className={styles.chats}>
                <span>Chats</span>
                <div className={styles.listContainer}>
                    {chats.map((chat) => (
                        <Link to={`/chat/${chat._id}`} key={chat._id} className={styles.chat}>
                            <div className={styles.profileImage}>
                                <img src={chat.otherUser.profileImage.url} />
                            </div>
                            <p className={styles.name}>{chat.otherUser.firstname} {chat.otherUser.lastname}</p>
                        </Link>
                    ))}
                </div>
                <div className={styles.create}>
                    <img src={create_svg} />
                    <p>Add member</p>
                </div>
            </div>
            <div className={styles.divider}>{/* divider */}</div>
            <div className={styles.projects}>
                <span>Projects</span>
                <div className={styles.listContainer}>
                    {projects.map(project => (
                        <Link key={project._id} to={`/project/${project._id}`} className={styles.project}>
                            <div className={styles.projectImage}>
                                <img src={project.projectImage.url} />
                            </div>
                            <p className={styles.name}>{project.name}</p>
                            <img src={more_svg} className={styles.more} />
                        </Link>
                    ))}
                </div>
                <div className={styles.create}>
                    <img src={create_svg} />
                    <p>Create project</p>
                </div>
            </div>
            <button className={styles.askAI}>
                <img src={askai_svg} />
                Ask AI
            </button>
        </aside>
    )
}

export default Sidebar;