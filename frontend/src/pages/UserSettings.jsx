
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
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useModal } from "../context/ModalContext";
import toast from "react-hot-toast";


function GeneralSettings({ user, setUser }) {

    const [firstname, setFirstName] = useState(user.firstname);
    const [lastname, setLastName] = useState(user.lastname);
    const [profileImage, setProfileImage] = useState("");
    const [file, setFile] = useState(null);
    const fileInputRef = useRef();
    const { openModal } = useModal();

    const saveNeeded = firstname !== user.firstname || lastname !== user.lastname || file !== null;

    useEffect(() => {
        setFirstName(user.firstname);
        setLastName(user.lastname);
        setProfileImage(user.profileImage.url)
    }, [user]);


    if (!user) return <p>Loading user...</p>;


    const handleDivClick = () => fileInputRef.current.click();

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;
        setProfileImage(URL.createObjectURL(selectedFile));
        setFile(selectedFile);
    };

    const saveUser = async () => {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        try {
            if (!firstname) {
                toast.error("First name is required");
                return;
            }
            if (!lastname) {
                toast.error("Last name is required");
                return;
            }

            if (file) {
                const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
                if (file.size > MAX_FILE_SIZE) {
                    toast.error("File is larger than 5 MB");
                    return;
                }
                if (file.type !== "image/png") {
                    toast.error("Only PNG is allowed");
                    return;
                }
            }

            const formData = new FormData();
            formData.append("id", user._id);
            formData.append("firstname", firstname);
            formData.append("lastname", lastname);
            if (file) formData.append("image", file);
            else formData.append("image", "/assets/profile.png");

            const res = await axios.patch("http://localhost:5000/api/users/user", formData, { headers });

            setUser(prev => ({
                ...prev,
                firstname: firstname,
                lastname: lastname,
                profileImage: {
                    url: file
                        ? profileImage
                        : res.data.profileImage.url
                }
            }));
            setFile(null);
        } catch (err) {
            console.error(err);
        }
    }

    return (
        <div className={styles.general}>
            <div className={styles.userPane}>
                <div className={styles.profileImage} onClick={handleDivClick}>
                    <img src={profileImage ? profileImage : null} />
                </div>
                <input
                    type="file"
                    accept="image/png"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={handleFileChange} />
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
                <button style={{ backgroundColor: "var(--green)" }} onClick={() => openModal("CHANGE_PASSWORD")}>
                    <img src={lock_svg} />
                    <p style={{ color: "#181818" }}>Change Password</p>
                </button>
            </div>
            <div className={styles.dangerZone}>
                <p>Danger zone</p>
                <div className={styles.content}>
                    <p>Delete this account forever to a non-recoverable state</p>
                    <button style={{ backgroundColor: "var(--red)" }} onClick={() => openModal("DELETE_ACCOUNT", { user: user })}>
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

    const { openModal } = useModal();

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

    const Button = ({ img, size, text, onSelect = "", dialogue = "", active }) => (
        <button className={activeTab === active ? `${styles.active}` : ""} onClick={() => {
            if (onSelect) setActiveTab(onSelect);
            if (dialogue) openModal(dialogue.toString());
        }}>
            <img src={img} width={size} height={size} />
            <p style={{ flexShrink: "0" }} >{text}</p>
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
                        <Button img={settings_svg} size="15" text="General" active="general" onSelect="general" />
                        <Button img={project_svg} size="15" text="Projects" active="projects" onSelect="projects" />
                        <Button img={logout_svg} size="15" text="Log out" active="logout" dialogue="LOGOUT" />
                    </aside>
                    {renderContent(activeTab)}
                </main>
            </div>
        </div>
    )
}

export default UserSettings;