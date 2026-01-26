
import favicon from "../assets/icons/favicon.svg";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import back_svg from "../assets/icons/back.svg";
import settings_svg from "../assets/icons/settings.svg";
import project_svg from "../assets/icons/project.svg";
import logout_svg from "../assets/icons/logout.svg";
import lock_svg from "../assets/icons/lock.svg";
import delete_svg from "../assets/icons/delete.svg";
import add_svg from "../assets/icons/add.svg";
import styles from "../css/UserSettings.module.scss";
import { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useModal } from "../context/ModalContext";


function GeneralSettings({ user, setUser }) {

    const [firstname, setFirstName] = useState(user.firstname);
    const [lastname, setLastName] = useState(user.lastname);

    const saveNeeded = firstname !== user.firstname || lastname !== user.lastname;

    useEffect(() => {
        setFirstName(user.firstname);
        setLastName(user.lastname);
    }, [user]);

    if (!user) return <p>Loading user...</p>;

    const saveUser = async () => {
        try {
            const res = await axios.patch("http://localhost:5000/api/users/user", { firstname, lastname }, {
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            })
            setUser(res.data);
        } catch (err) {
            console.error(err);
        }
    }

    return (
        <div className={styles.general}>
            <div className={styles.userPane}>
                <div className={styles.profileImage}>
                    <img src={user.profileImage.url} />
                </div>
                <p>{user.firstname} {user.lastname}</p>
            </div>
            <div className={styles.inputField}>
                <label>First name</label>
                <input type="text"
                    value={firstname}
                    onChange={(e) => setFirstName(e.target.value)}
                    required />
            </div>
            <div className={styles.inputField}>
                <label>Last name</label>
                <input type="text"
                    value={lastname}
                    onChange={(e) => setLastName(e.target.value)}
                    required />
            </div>
            <div className={styles.inputField}>
                <label>Email</label>
                <input type="text" value={user.email} disabled />
            </div>
            <div className={styles.changePassword}>
                <label>Password</label>
                <button style={{ backgroundColor: "var(--green)" }}>
                    <img src={lock_svg} />
                    <p style={{ color: "#181818" }}>Change Password</p>
                </button>
            </div>
            <div className={styles.dangerZone}>
                <p>Danger zone</p>
                <div className={styles.content}>
                    <p>Delete this account forever to a non-recoverable state</p>
                    <button style={{ backgroundColor: "var(--red)" }}>
                        <img src={delete_svg} />
                        <p style={{ color: "#fff" }}>Delete Account</p>
                    </button>
                </div>
            </div>
            <button className={`${styles.save} ${saveNeeded ? styles.active : ""}`} disabled={!saveNeeded} onClick={saveUser}>
                Save
            </button>
        </div>
    )
}


function ProjectSettings() {
    const [projects, setProjects] = useState([]);
    const { openModal } = useModal();

    useEffect(() => {
        const fetchProjects = async () => {
            const res = await axios.get("http://localhost:5000/api/projects/user", {
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });
            setProjects(res.data);
        };
        fetchProjects();
    }, []);

    return (
        <div className={styles.projects}>
            <p>My projects</p>
            <div className={styles.projectContainer}>
                {
                    projects.map(project => (
                        <div key={project._id} className={styles.project}>
                            <div className={styles.projectImage}>
                                <img src={project.projectImage.url} />
                            </div>
                            <div className={styles.projectInfo}>
                                <Link to={`/project/${project._id}`}>{project.name}</Link>
                                <p>Project {project.role.toLowerCase()}</p>
                            </div>
                            {(project.role === "MEMBER") && <p className={styles.leave}>Leave</p>}
                            {(project.role !== "MEMBER") &&
                                <Link
                                    to={`/settings/project/${project._id}`}
                                    state={{ origin: `${project._id}` }}
                                    className={styles.settings}>
                                    Settings
                                </Link>
                            }
                        </div>
                    ))
                }
            </div>
            <div className={styles.create} onClick={() => openModal("CREATE_PROJECT")}>
                <img src={add_svg} />
                <p>Create a new project</p>
            </div>
        </div>
    )
}


function UserSettings() {

    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState("general");
    const navigate = useNavigate();

    useEffect(() => {
        let link = document.querySelector("link[rel='icon']");
        link.href = favicon;
        document.title = "Settings";

        const token = localStorage.getItem("token");

        const fetchUser = async () => {
            try {
                const res = await axios.get("http://localhost:5000/api/users/user", {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setUser(res.data);
            } catch (err) {
                console.error(err);
                setUser(false);
            }
        };

        fetchUser();
    }, []);

    if (!user) return <p>Loading user...</p>;

    const renderContent = () => {
        switch (activeTab) {
            case "general": return <GeneralSettings user={user} setUser={setUser} />;
            case "projects": return <ProjectSettings />;
            case "logout": return <GeneralSettings user={user} setUser={setUser} />;
            default: return <GeneralSettings user={user} setUser={setUser} />;
        }
    };

    const Button = ({ img, size, text, onSelect, active }) => (
        <button className={activeTab === active ? `${styles.active}` : ""} onClick={() => onSelect ? setActiveTab(onSelect) : ``}>
            <img src={img} width={size} height={size} />
            <p style={{flexShrink: "0"}} >{text}</p>
        </button>
    )

    return (
        <div className={styles.canvas}>
            <Header />
            <div className={styles.container}>
                <Sidebar />
                <main className={styles.userSettings}>
                    <button className={styles.back} onClick={() => navigate(-1)}>
                        <img src={back_svg} />
                    </button>
                    <aside className={styles.sidebar}>
                        <p>All Settings</p>
                        <Button img={settings_svg} size="15" text="General" onSelect="general" active="general" />
                        <Button img={project_svg} size="15" text="Projects" onSelect="projects" active="projects" />
                        <Button img={logout_svg} size="15" text="Log out" onSelect={null} active="logout" />
                    </aside>
                    {renderContent(activeTab)}
                </main>
            </div>
        </div>
    )
}

export default UserSettings;