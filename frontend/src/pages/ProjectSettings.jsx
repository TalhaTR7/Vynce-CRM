
import favicon from "../assets/icons/favicon.svg";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import back_svg from "../assets/icons/back.svg";
import settings_svg from "../assets/icons/settings.svg";
import team_svg from "../assets/icons/team.svg";
import owner_svg from "../assets/icons/owner.svg";
import admin_svg from "../assets/icons/admin.svg";
import drag_svg from "../assets/icons/drag.svg";
import more_svg from "../assets/icons/more.svg";
import delete_svg from "../assets/icons/delete.svg";
import add_svg from "../assets/icons/add.svg";
import remove_svg from "../assets/icons/close.svg";
import selectAll_svg from "../assets/icons/selectAll.svg";
import search_svg from "../assets/icons/search.svg";
import styles from "../css/ProjectSettings.module.scss";
import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom"

import angry_emoji from "../assets/moods/angry.svg";
import exhausted_emoji from "../assets/moods/exhausted.svg";
import sick_emoji from "../assets/moods/sick.svg";
import sad_emoji from "../assets/moods/sad.svg";
import normal_emoji from "../assets/moods/normal.svg";
import okay_emoji from "../assets/moods/okay.svg";
import vibing_emoji from "../assets/moods/vibing.svg";
import happy_emoji from "../assets/moods/happy.svg";
import chilling_emoji from "../assets/moods/chilling.svg";


function GeneralSettings({ project, setProject }) {

    const [projectName, setProjectName] = useState("");
    const boards = project.boards;

    const saveNeeded = projectName !== project.name;

    useEffect(() => {
        setProjectName(project.name);
    }, [project]);

    const createdOn = new Date(project.createdAt).toLocaleString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    const saveProject = async () => {
        try {
            const res = await axios.patch("http://localhost:5000/api/users/user", { name }, {
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            })
            setProject(res.data);
        } catch (err) {
            console.error(err);
        }
    }

    return (
        <div className={styles.general}>
            <div className={styles.projectPane}>
                <div className={styles.projectImage}>
                    <img src={project.projectImage.url} />
                </div>
                <div className={styles.projectInfo}>
                    <h3>{project.name}</h3>
                    <p>Created on {createdOn}</p>
                </div>
                <img className={styles.memberStatus} src={project.userRole === "OWNER" ? owner_svg : admin_svg} />
            </div>
            <div className={styles.inputField}>
                <label>Project name</label>
                <input type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    required />
            </div>
            <div className={styles.boardsContainer}>
                <label>Boards</label>
                <div className={styles.boards}>
                    {
                        boards.map(board => (
                            <div key={board._id} className={styles.board}>
                                <img src={drag_svg} className={styles.drag} />
                                <div className={styles.boardColor} style={{ backgroundColor: board.color }} />
                                <p>{board.name}</p>
                                <img src={more_svg} className={styles.more} />
                            </div>
                        ))
                    }
                </div>
                <div className={styles.create}>
                    <img src={add_svg} />
                    <p>Create new board</p>
                </div>
            </div>
            {
                (project.userRole === "OWNER") &&
                <div className={styles.dangerZone}>
                    <label>Danger zone</label>
                    <div className={styles.box}>
                        <div className={styles.fields}>
                            <p>Transfer ownership</p>
                            <button style={{ backgroundColor: "#303030" }}>
                                <p style={{ color: "#ccc" }}>Transfer</p>
                            </button>
                        </div>
                        <div style={{ borderTop: "1px solid #333" }} />
                        <div className={styles.fields}>
                            <p>Delete this project</p>
                            <button style={{ backgroundColor: "var(--red)" }}>
                                <img src={delete_svg} />
                                <p style={{ color: "#fff" }}>Delete project</p>
                            </button>
                        </div>
                    </div>
                </div>
            }
            {
                (project.userRole === "ADMIN") &&
                <div className={styles.dangerZone}>
                    <label>Danger zone</label>
                    <div className={styles.box}>
                        <div className={styles.fields}>
                            <p>Leave this project notifying the owner</p>
                            <button style={{ backgroundColor: "var(--red)", padding: "3px 15px" }}>
                                <p style={{ color: "#fff" }}>Leave</p>
                            </button>
                        </div>
                    </div>
                </div>
            }

            <button className={`${styles.save} ${saveNeeded ? styles.active : ""}`} disabled={!saveNeeded} onClick={saveProject}>
                Save
            </button>
        </div>
    )
}


function MemberSettings({ project }) {

    const [searchValue, setSearchValue] = useState("");
    const members = project.memberships;

    return (
        <div className={styles.memberSettings}>
            <div className={styles.infoPane}>
                <div className={styles.project}>
                    <div className={styles.projectImage}>
                        <img src={project.projectImage.url} />
                    </div>
                    <h3>{project.name}</h3>
                    <img src={project.userRole === "OWNER" ? owner_svg : admin_svg} />
                </div>
                {
                    (project.userRole === "OWNER") &&
                    <div className={styles.buttons}>
                        <button className={styles.button}>
                            <img src={remove_svg} />
                        </button>
                        <button className={styles.button}>
                            <img src={selectAll_svg} />
                        </button>
                        <button className={styles.invite}>
                            <img src={add_svg} />
                            <p>Invite people</p>
                        </button>
                    </div>
                }
            </div>
            <div className={styles.searchField}>
                <img src={search_svg} />
                <input type="text"
                    placeholder="Search member"
                    onChange={(e) => setSearchValue(e.target.value)} />
            </div>
            <div className={styles.memberTable}>
                <div className={styles.head}>
                    <label style={{ textAlign: "let" }}>Name</label>
                    <label style={{ textAlign: "left" }}>Email</label>
                    <label style={{ textAlign: "left" }}>Role</label>
                    <label style={{ textAlign: "center" }}>Mood</label>
                    <label style={{ textAlign: "center" }}>Joined on</label>
                </div>
                <div className={styles.membersContainer}>
                    {
                        members.filter(member => {
                            if (!searchValue) return true;
                            const fullName = `${member.user.firstname} ${member.user.lastname}`.toLowerCase();
                            return fullName.startsWith(searchValue.toLowerCase());
                        }).map(member => {
                            const joinDate = () => {
                                const month = new Date(member.createdAt).toLocaleString("en-GB", { month: "2-digit" });
                                const day = new Date(member.createdAt).toLocaleString("en-GB", { day: "2-digit" });
                                const year = new Date(member.createdAt).toLocaleString("en-GB", { year: "numeric" });
                                return `${month}/${day}/${year}`;
                            }

                            const mood = {
                                ANGRY: angry_emoji,
                                EXHAUSTED: exhausted_emoji,
                                SICK: sick_emoji,
                                SAD: sad_emoji,
                                NORMAL: normal_emoji,
                                OKAY: okay_emoji,
                                VIBING: vibing_emoji,
                                HAPPY: happy_emoji,
                                CHILLING: chilling_emoji
                            }

                            return (
                                <div className={styles.member}>
                                    {
                                        (project.userRole === "OWNER") &&
                                        <input type="checkbox" />
                                    }
                                    <div className={styles.memberInfo}>
                                        <div className={styles.profileImage}>
                                            <img src={member.user.profileImage.url} />
                                        </div>
                                        <p style={{ textAlign: "left" }}>{member.user.firstname} {member.user.lastname}</p>
                                    </div>
                                    <p style={{ textAlign: "left" }}>{member.user.email}</p>
                                    <p style={{ textTransform: "capitalize" }}>{member.role.toLowerCase()}</p>
                                    <img src={mood[member.user.currentMood]} className={styles.mood} />
                                    <p style={{ textAlign: "center" }}>{joinDate()}</p>
                                    {
                                        (project.userRole === "OWNER") &&
                                        <img src={more_svg} className={styles.more} />
                                    }
                                </div>
                            )
                        })
                    }
                </div>
            </div>
        </div>
    )
}


function ProjectSettings() {

    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [activeTab, setActiveTab] = useState("general");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/projects/project/${id}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                });
                setProject(res.data);
            } catch (err) {
                console.error(err);
                setProject(false);
            }
        };

        fetchProject();
    }, []);

    useEffect(() => {
        let link = document.querySelector("link[rel='icon']");
        link.href = favicon;
        document.title = `Settings | ${project?.name}`;
    });

    if (!project) return <p>Loading project...</p>;

    const renderContent = () => {
        switch (activeTab) {
            case "general": return <GeneralSettings project={project} setProject={setProject} />;
            case "team": return <MemberSettings project={project} />;
            default: return <GeneralSettings project={project} setProject={setProject} />;
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
                <main className={styles.projectSettings}>
                    <button className={styles.back} onClick={() => navigate(-1)}>
                        <img src={back_svg} />
                    </button>
                    <aside className={styles.sidebar}>
                        <p>All Settings</p>
                        <Button img={settings_svg} text="General" onSelect="general" active="general" />
                        <Button img={team_svg} text="Team" onSelect="team" active="team" />
                    </aside>
                    {renderContent(activeTab)}
                </main>
            </div>
        </div>
    )
}

export default ProjectSettings;