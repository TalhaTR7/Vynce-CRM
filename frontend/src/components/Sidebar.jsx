import dashboard_svg from "../assets/icons/dashboard.svg";
import inbox_svg from "../assets/icons/inbox.svg";
import leaderboard_svg from "../assets/icons/leaderboard.svg";
import add_svg from "../assets/icons/add.svg";
import shop_svg from "../assets/icons/shop.svg";
import styles from "../css/Sidebar.module.scss";
import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { useModal } from "../context/ModalContext";
import Loading from "./Loading";


function Sidebar() {
    const [user, setUser] = useState(null);
    const [projects, setProjects] = useState([]);
    const [chats, setChats] = useState([]);
    const { openModal } = useModal();
    const { notifications } = useOutletContext();

    const userEntry = notifications.map(mail => mail.users.find(user => user._id === localStorage.getItem("_id")));
    const unreadCount = userEntry.filter(u => u.read === false).length;

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
    }, [openModal]);

    if (!user) return <Loading />;

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
                    {unreadCount ? <span>{unreadCount}</span> : ''}
                </Link>
                <Link to={"/leaderboards"} className={styles.homeElements}>
                    <img src={leaderboard_svg} />
                    <p>Leaderboards</p>
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
                <button className={styles.create} onClick={() => openModal("FIND_USER")}>
                    <img src={add_svg} />
                    <p>Find someone</p>
                </button>
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
                        </Link>
                    ))}
                </div>
                <button className={styles.create} onClick={() => openModal("CREATE_PROJECT")}>
                    <img src={add_svg} />
                    <p>Create project</p>
                </button>
            </div>
            <Link to={"/shop"} className={styles.shop}>
                <img src={shop_svg} />
                <p>Shop</p>
            </Link>
        </aside>
    )
}

export default Sidebar;