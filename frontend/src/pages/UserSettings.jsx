
import favicon from "../assets/favicon.svg"
import settings_svg from "../assets/settings.svg"
import project_svg from "../assets/project.svg"
import logout_svg from "../assets/logout.svg"
import lock_svg from "../assets/lock.svg"
import delete_svg from "../assets/delete.svg"
import styles from "../css/UserSettings.module.scss"
import Header from "../components/Header"
import Sidebar from "../components/Sidebar"
import { useState, useEffect } from "react";
import axios from "axios";


function GeneralSettings({ user }) {

    const [firstname, setFirstName] = useState(user.firstname);
    const [lastname, setLastName] = useState(user.lastname);

    // useEffect(() => {
    //     if (firstname !== user.firstname || lastname !== user.lastname) {
    //         const button = document.getElementsByClassName("save")[0];
    //         button.classList.add("active");
    //     }
    // }, [firstname, lastname]);
    const saveNeeded = firstname !== user.firstname || lastname !== user.lastname;


    return (
        <main className={styles.general}>
            <div className={styles.userPane}>
                <div className={styles.profileImage}>
                    <img src={user.profileImage.url} />
                </div>
                <p>{user.firstname} {user.lastname}</p>
            </div>
            <div className={styles.inputField}>
                <label>First name</label>
                <input type="text"
                    defaultValue={user.firstname}
                    onChange={(e) => setFirstName(e.target.value)}
                    required />
            </div>
            <div className={styles.inputField}>
                <label>Last name</label>
                <input type="text"
                    defaultValue={user.lastname}
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
            <button className={`${styles.save} ${saveNeeded ? styles.active : ""}`} disabled={!saveNeeded}>
                Save
            </button>
        </main>
    )
}

function UserSettings() {

    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState("general");

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
                    },
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
            case "general": return <GeneralSettings user={user} />;
            case "projects": return <ProjectSettings user={user} />;
            case "logout": return <GeneralSettings user={user} />;
            default: return <GeneralSettings user={user} />;
        }
    };

    const Button = ({ img, text, onSelect, active }) => (
        <button className={activeTab === active ? `${styles.active}` : ""} onClick={() => onSelect ? setActiveTab(onSelect) : ``}>
            <img src={img} />
            <p>{text}</p>
        </button>
    )

    return (
        <div className={styles.canvas}>
            <Header />
            <div className={styles.container}>
                <Sidebar />
                <div className={styles.userSettings}>
                    <aside className={styles.sidebar}>
                        <p>All Settings</p>
                        <Button img={settings_svg} text="General" onSelect="general" active="general" />
                        <Button img={project_svg} text="Projects" onSelect="projects" active="projects" />
                        <Button img={logout_svg} text="Log out" onSelect={null} active="logout" />
                    </aside>
                    {renderContent(activeTab)}
                </div>
            </div>
        </div>
    )
}

export default UserSettings;