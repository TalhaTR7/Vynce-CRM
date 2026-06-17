// User settings page
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
import styles from "./css/UserSettings.module.scss";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useModal } from "../context/ModalContext";
import toast from "react-hot-toast";
import Loading from "../components/Loading";


/* ══════════════════════════════════════════════════════════════════
   GENERAL SETTINGS
   ══════════════════════════════════════════════════════════════════ */
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
        setProfileImage(user.profileImage.url);
    }, [user]);

    if (!user) return <Loading />;

    const handleDivClick = () => fileInputRef.current.click();
    const handleFileChange = (e) => {
        const f = e.target.files[0];
        if (!f) return;
        setProfileImage(URL.createObjectURL(f));
        setFile(f);
    };

    const saveUser = async () => {
        if (!firstname) { toast.error("First name is required"); return; }
        if (!lastname) { toast.error("Last name is required"); return; }
        if (file) {
            if (file.size > 5 * 1024 * 1024) { toast.error("File is larger than 5 MB"); return; }
            if (file.type !== "image/png") { toast.error("Only PNG is allowed"); return; }
        }
        try {
            const formData = new FormData();
            formData.append("id", user._id);
            formData.append("firstname", firstname);
            formData.append("lastname", lastname);
            formData.append("image", file ?? "/assets/profile.png");

            const res = await axios.patch("/api/users/user", formData, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            setUser(prev => ({
                ...prev,
                firstname,
                lastname,
                profileImage: { url: file ? profileImage : res.data.profileImage.url },
            }));
            setFile(null);
            toast.success("Changes saved!");
        } catch (err) { console.error(err); }
    };

    return (
        <div className={styles.generalPanel}>
            <h2 className={styles.sectionHeading}>General</h2>

            {/* Avatar + identity hero */}
            <div className={styles.avatarHero}>
                <div className={styles.avatarButton} onClick={handleDivClick}>
                    <img src={profileImage || undefined} />
                </div>
                <input
                    type="file"
                    accept="image/png"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={handleFileChange} />
                <div>
                    <p className={styles.avatarName}>{user.firstname} {user.lastname}</p>
                    <p className={styles.avatarEmail}>{user.email}</p>
                </div>
            </div>

            {/* Name fields */}
            <div className={styles.formField}>
                <label>First name</label>
                <input
                    type="text"
                    value={firstname}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name" />
            </div>
            <div className={styles.formField}>
                <label>Last name</label>
                <input
                    type="text"
                    value={lastname}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name" />
            </div>

            {/* Email (read only) */}
            <div className={styles.formField}>
                <label>Email</label>
                <input type="text" value={user.email} disabled />
            </div>

            {/* Change password */}
            <div className={styles.inlineActionRow}>
                <div>
                    <p className={styles.inlineActionLabel}>Password</p>
                    <p className={styles.inlineActionSub}>Change your account password</p>
                </div>
                <button
                    className={styles.inlineActionButton}
                    style={{ background: "var(--green)", color: "#f8f8f8ff" }}
                    onClick={() => openModal("CHANGE_PASSWORD")}>
                    <img src={lock_svg} style={{filter: "invert(1.0)"}} />
                    Change password
                </button>
            </div>

            {/* Danger zone */}
            <div className={styles.dangerZone}>
                <div className={styles.dangerZoneText}>
                    <p className={styles.dangerZoneTitle}>Delete account</p>
                    <p className={styles.dangerZoneSub}>Permanently delete this account. This cannot be undone.</p>
                </div>
                <button
                    className={styles.inlineActionButton}
                    style={{ background: "var(--red)", color: "#fff" }}
                    onClick={() => openModal("DELETE_ACCOUNT", { user })}>
                    <img src={delete_svg} style={{filter: "brightness(5.0)"}} />
                    Delete account
                </button>
            </div>

            {/* Save */}
            <button
                className={`${styles.saveButton} ${saveNeeded ? styles.saveButtonActive : ""}`}
                disabled={!saveNeeded}
                onClick={saveUser}>
                Save changes
            </button>
        </div>
    );
}


/* ══════════════════════════════════════════════════════════════════
   PROJECTS SETTINGS
   ══════════════════════════════════════════════════════════════════ */
function ProjectSettings() {
    const [projects, setProjects] = useState([]);
    const { openModal } = useModal();

    useEffect(() => {
        const fetch = async () => {
            const res = await axios.get("/api/projects/user", {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            setProjects(res.data);
        };
        fetch();
    }, []);

    return (
        <div className={styles.projectsPanel}>
            <h2 className={styles.sectionHeading}>Projects</h2>

            {projects.length > 0 && (
                <div className={styles.projectList}>
                    {projects.map(project => (
                        <div key={project._id} className={styles.projectRow}>
                            <div className={styles.projectThumbnail}>
                                <img src={project.projectImage.url} />
                            </div>

                            <div className={styles.projectRowInfo}>
                                <Link to={`/project/${project._id}`} className={styles.projectRowName}>
                                    {project.name}
                                </Link>
                                <span className={styles.projectRowRole}>{project.role.toLowerCase()}</span>
                            </div>

                            {project.role === "MEMBER" ? (
                                <span
                                    className={styles.projectRowLeave}
                                    onClick={() => openModal("LEAVE_PROJECT", {
                                        project: {
                                            _id: project._id,
                                            name: project.name
                                        }
                                    })}>
                                    Leave
                                </span>
                            ) : (
                                <Link
                                    to={`/settings/project/${project._id}`}
                                    state={{ origin: project._id }}
                                    className={styles.projectRowSettings}>
                                    Settings
                                </Link>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <button className={styles.createProjectButton} onClick={() => openModal("CREATE_PROJECT")}>
                <img src={add_svg} />
                <p>Create a new project</p>
            </button>
        </div>
    );
}


/* ══════════════════════════════════════════════════════════════════
   ROOT — UserSettings
   ══════════════════════════════════════════════════════════════════ */
function UserSettings() {
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState("general");
    const navigate = useNavigate();
    const { openModal } = useModal();
    const { tab } = useParams();

    useEffect(() => {
        if (tab) setActiveTab(tab);
    }, [user]);

    useEffect(() => {
        const link = document.querySelector("link[rel='icon']");
        link.href = favicon;
        document.title = "Vynce | Settings";

        const fetch = async () => {
            try {
                const res = await axios.get("/api/users/user", {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                });
                setUser(res.data);
            } catch (err) {
                console.error(err);
                setUser(false);
            }
        };
        fetch();
    }, []);

    if (!user) return <Loading />;

    const navItems = [
        {
            id: "general",
            icon: settings_svg,
            label: "General",
            action: () => setActiveTab("general")
        },
        {
            id: "projects",
            icon: project_svg,
            label: "Projects",
            action: () => setActiveTab("projects")
        },
    ];

    const renderContent = () => {
        if (activeTab === "projects") return <ProjectSettings />;
        return <GeneralSettings user={user} setUser={setUser} />;
    };

    return (
        <div className={styles.canvas}>
            <Header />
            <div className={styles.container}>
                <Sidebar />

                <main className={styles.userSettings}>
                    <div className={styles.settingsInner}>

                        {/* ── Left nav ─────────────────────────────── */}
                        <nav className={styles.settingsNav}>
                            <button className={styles.settingsNavBack} onClick={() => navigate(-1)}>
                                <img src={back_svg} />
                            </button>

                            <span className={styles.settingsNavLabel}>Settings</span>

                            {navItems.map(item => (
                                <button
                                    key={item.id}
                                    className={`${styles.settingsNavButton} ${activeTab === item.id ? styles.settingsNavButtonActive : ""}`}
                                    onClick={item.action}>
                                    <img src={item.icon} />
                                    <p>{item.label}</p>
                                </button>
                            ))}

                            <div className={styles.settingsNavDivider} />

                            <button className={`${styles.settingsNavButton} ${styles.settingsNavButtonLogout}`} onClick={() => openModal("LOGOUT")}>
                                <img src={logout_svg} style={{rotate: "180deg", filter: "grayscale(1.0)"}} />
                                <p>Log out</p>
                            </button>
                        </nav>

                        {/* ── Content ──────────────────────────────── */}
                        <div className={styles.settingsContent}>
                            {renderContent()}
                        </div>

                    </div>
                </main>
            </div>
        </div>
    );
}

export default UserSettings;