
import favicon from "../assets/icons/favicon.svg";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import back_svg from "../assets/icons/back.svg";
import settings_svg from "../assets/icons/settings.svg";
import team_svg from "../assets/icons/team.svg";
import archive_svg from "../assets/icons/archive.svg";
import owner_svg from "../assets/icons/owner.svg";
import admin_svg from "../assets/icons/admin.svg";
import drag_svg from "../assets/icons/drag.svg";
import more_svg from "../assets/icons/more.svg";
import delete_svg from "../assets/icons/delete.svg";
import deleteForever_svg from "../assets/icons/deleteForever.svg";
import message_svg from "../assets/icons/comment.svg";
import promote_svg from "../assets/icons/promote.svg";
import demote_svg from "../assets/icons/demote.svg";
import add_svg from "../assets/icons/add.svg";
import remove_svg from "../assets/icons/close.svg";
import selectAll_svg from "../assets/icons/selectAll.svg";
import search_svg from "../assets/icons/search.svg";
import unauthorized_svg from "../assets/icons/unauthorized.svg";

import Loading from "../components/Loading";
import mood from "../context/MoodContext";
import styles from "../css/ProjectSettings.module.scss";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom"
import { useModal } from "../context/ModalContext";
import { ArchivedCard } from "../components/Card";
import axios from "axios";
import toast from "react-hot-toast";
import { closestCenter, DndContext } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";


function GeneralSettings({ project, setProject }) {

    if (project.userRole === "MEMBER") return (
        <div className={styles.unauthorized}>
            <img src={unauthorized_svg} />
            <p>Unauthorized</p>
            <span>How'd you get in here?</span>
        </div>
    )

    const [projectName, setProjectName] = useState("");
    const [projectImage, setProjectImage] = useState("");
    const [file, setFile] = useState(null);
    const fileInputRef = useRef();
    const { openModal } = useModal();
    const [boards, setBoards] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [owner, setOwner] = useState(null);
    const [openDropdown, setOpenDropdown] = useState(false);
    const dropdownRef = useRef(null);
    const [searchValue, setSearchValue] = useState("");

    const saveNeeded = projectName !== project.name || file !== null;

    useEffect(() => {
        setProjectName(project.name);
        setProjectImage(project.projectImage.url);
        setBoards(project.boards);
        const fetchAdmins = async () => {
            const res = await axios.get(`http://localhost:5000/api/memberships/project/${project._id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });
            setAdmins(res.data.filter(member => member.role === "ADMIN"));
            setOwner(res.data.find(member => member.role === "OWNER"));
        };
        fetchAdmins();
    }, [project]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target))
                setOpenDropdown(null);
        };
        document.addEventListener("mousedown", handleClickOutside);
        setSearchValue("");
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [openDropdown]);

    const createdOn = new Date(project.createdAt).toLocaleString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    const handleDivClick = () => fileInputRef.current.click();

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;
        setProjectImage(URL.createObjectURL(selectedFile));
        setFile(selectedFile);
    };

    const saveProject = async () => {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        try {
            if (!projectName) {
                toast.error("Project name is required");
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
            formData.append("name", projectName);
            if (file) formData.append("image", file);

            const res = await axios.patch(`http://localhost:5000/api/projects/project/${project._id}`, formData, { headers });

            setProject(prev => ({
                ...prev,
                name: projectName,
                projectImage: {
                    url: file
                        ? projectImage
                        : res.data.projectImage.url
                }
            }));
            setFile(null);
            toast.success("Changes saved!");
        } catch (err) {
            console.error(err);
        }
    };

    const projectObj = {
        _id: project._id,
        name: project.name,
        projectImage: project.projectImage
    }

    function SortableBoard({ board }) {
        const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: board._id });
        const style = {
            transform: CSS.Transform.toString(transform),
            transition,
        };

        return (
            <div ref={setNodeRef} style={style} className={styles.board}>
                <img src={drag_svg} className={styles.drag} {...listeners} {...attributes} />
                <div className={styles.boardColor} style={{ backgroundColor: board.color }} />
                <p>{board.name}</p>
            </div>
        );
    }

    const handleDragEnd = async ({ active, over }) => {
        if (!over || active.id === over.id) return;

        const oldPosition = boards.findIndex(board => board._id === active.id);
        const newPosition = boards.findIndex(board => board._id === over.id);
        const repositioned = arrayMove(boards, oldPosition, newPosition);
        setBoards(repositioned);

        try {
            await Promise.all(repositioned.map((board, index) =>
                axios.patch(`http://localhost:5000/api/boards/move/${board._id}`, {
                    projectId: project._id,
                    newPosition: index
                }, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                })
            ));
        } catch (err) {
            console.error(err);
        }
    };


    return (
        <div className={styles.general}>
            <div className={styles.projectPane} >
                <div className={styles.projectImage} onClick={handleDivClick}>
                    <img src={projectImage ? projectImage : null} />
                </div>
                <input
                    type="file"
                    accept="image/png"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={handleFileChange} />
                <div className={styles.projectInfo}>
                    <h3>{project.name}</h3>
                    <p>Created on {createdOn}</p>
                </div>
                {project.userRole !== "MEMBER" && <img className={styles.memberStatus} src={project.userRole === "OWNER" ? owner_svg : admin_svg} />}
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
                <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={boards.map(board => board._id)} strategy={verticalListSortingStrategy}>
                        <div className={styles.boards}>
                            {boards.map(board => (
                                <SortableBoard key={board._id} board={board} />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
                <div className={styles.create} onClick={() => openModal("CREATE_BOARD", { project: projectObj })}>
                    <img src={add_svg} />
                    <p>Create new board</p>
                </div>
            </div>
            {
                (project.userRole === "OWNER") &&
                <div className={styles.dangerZone}>
                    <label>Danger zone</label>
                    <div className={styles.box}>
                        <div className={styles.transfer}>
                            <p>Transfer ownership</p>
                            <div className={styles.wrapper} ref={dropdownRef}>
                                <button style={{ backgroundColor: "#303030" }} onClick={() => setOpenDropdown(openDropdown ? false : true)} className={styles.transfer}>
                                    <p style={{ color: "#ccc" }}>Transfer</p>
                                </button>
                                {
                                    openDropdown &&
                                    <ul className={styles.dropdown}>
                                        {
                                            admins.filter(admin => {
                                                if (!searchValue) return true;
                                                const fullName = `${admin.firstname} ${admin.lastname}`.toLowerCase();
                                                return fullName.startsWith(searchValue.toLowerCase())
                                                    || admin.firstname.toLowerCase().startsWith(searchValue.toLowerCase())
                                                    || admin.lastname.toLowerCase().startsWith(searchValue.toLowerCase());
                                            }).map(admin => {
                                                const payload = {
                                                    project: {
                                                        _id: project._id,
                                                        name: project.name,
                                                        projectImage: project.projectImage
                                                    },
                                                    admin: {
                                                        _id: admin._id,
                                                        firstname: admin.firstname,
                                                        lastname: admin.lastname,
                                                        profileImage: admin.profileImage
                                                    },
                                                    owner: {
                                                        _id: owner._id,
                                                        firstname: owner.firstname,
                                                        lastname: owner.lastname,
                                                        profileImage: owner.profileImage
                                                    }
                                                }
                                                return (
                                                    <li key={admin._id} className={styles.option} onClick={() => { openModal("TRANSFER_OWNERSHIP", { payload }); setOpenDropdown(false) }}>
                                                        <div className={styles.profileImage}>
                                                            <img src={admin.profileImage.url} />
                                                        </div>
                                                        <span>{admin.firstname} {admin.lastname}</span>
                                                    </li>
                                                )
                                            })
                                        }
                                        <div className={styles.searchField}>
                                            <img src={search_svg} />
                                            <input type="text" placeholder="Search member" onChange={(e) => setSearchValue(e.target.value)} />
                                        </div>
                                    </ul>
                                }
                            </div>
                        </div>
                        <div style={{ borderTop: "1px solid #333" }} />
                        <div className={styles.delete}>
                            <p>Delete this project</p>
                            <button style={{ backgroundColor: "var(--red)" }} onClick={() => openModal("DELETE_PROJECT", { project: projectObj })}>
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
                        <div className={styles.leave}>
                            <p>Leave this project notifying the owner</p>
                            <button style={{ backgroundColor: "var(--red)", padding: "3px 15px" }}
                                onClick={() => openModal("LEAVE_PROJECT", {
                                    project: {
                                        _id: project._id,
                                        name: project.name
                                    }
                                })}>
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
    const [selected, setSelected] = useState([]);
    const [openDropdownId, setOpenDropdownId] = useState(null);
    const dropdownRefs = useRef({});
    const members = project.memberships;
    const { openModal } = useModal();

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!openDropdownId) return;
            const ref = dropdownRefs.current[openDropdownId];
            if (ref && !ref.contains(e.target)) setOpenDropdownId(null);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [openDropdownId]);

    const allSelected = selected.length === members.length - 1;
    const toggleSelectAll = () => {
        if (allSelected) setSelected([]);
        else setSelected(members
            .filter(member => {
                if (!searchValue) return true;
                const fullName = `${member.user.firstname} ${member.user.lastname}`;
                return fullName.toLowerCase().startsWith(searchValue.toLowerCase())
                    || member.user.lastname.toLowerCase().startsWith(searchValue.toLowerCase());
            })
            .filter(member => member.role !== "OWNER")
            .map(member => member._id)
        );
    };

    const toggleSelect = (id) => {
        setSelected(prev => prev.includes(id)
            ? prev.filter(_id => _id !== id)
            : [...prev, id]
        );
    };

    const memberIds = {
        projectId: project._id,
        memberships: selected
    }

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
                        <button className={styles.button} onClick={() => openModal("REMOVE_MEMBERS", { memberIds })}>
                            <img src={remove_svg} />
                        </button>
                        <button className={styles.button} onClick={() => toggleSelectAll()}>
                            <img src={selectAll_svg} />
                        </button>
                        <button className={styles.invite} onClick={() => openModal("INVITE_USER", { projectId: project._id })}>
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
                    {members.filter(member => {
                        if (!searchValue) return true;
                        const fullName = `${member.user.firstname} ${member.user.lastname}`;
                        const lastName = member.user.lastname;
                        return fullName.toLowerCase().startsWith(searchValue.toLowerCase())
                            || lastName.toLowerCase().startsWith(searchValue.toLowerCase());
                    }).map(member => {
                        const joinDate = () => {
                            const month = new Date(member.createdAt).toLocaleString("en-GB", { month: "2-digit" });
                            const day = new Date(member.createdAt).toLocaleString("en-GB", { day: "2-digit" });
                            const year = new Date(member.createdAt).toLocaleString("en-GB", { year: "numeric" });
                            return `${month}/${day}/${year}`;
                        }

                        return (
                            <div className={styles.member} key={member._id}>
                                {
                                    (project.userRole === "OWNER" && member.role !== "OWNER") &&
                                    <input
                                        type="checkbox"
                                        checked={selected.includes(member._id)}
                                        onChange={() => toggleSelect(member._id)} />
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
                                    (project.userRole === "OWNER" && member.role !== "OWNER") &&
                                    <div className={styles.options} ref={e => dropdownRefs.current[member._id] = e}>
                                        <img src={more_svg} className={styles.more} onClick={() => setOpenDropdownId(openDropdownId === member._id ? null : member._id)} />
                                        <ul className={`${styles.dropdown} ${openDropdownId === member._id ? styles.dropdownOpen : styles.dropdownClosed}`}>
                                            <li className={styles.option}>
                                                <img src={message_svg} />
                                                <span>Message</span>
                                            </li>
                                            {member.role === "ADMIN" &&
                                                <li className={styles.option}>
                                                    <img src={demote_svg} />
                                                    <span>Demote to member</span>
                                                </li>
                                            }
                                            {member.role === "MEMBER" &&
                                                <li className={styles.option}>
                                                    <img src={promote_svg} />
                                                    <span>Promote to admin</span>
                                                </li>
                                            }
                                            <li className={`${styles.option} ${styles.remove}`}>
                                                <img src={remove_svg} />
                                                <span>Remove from project</span>
                                            </li>
                                        </ul>
                                    </div>
                                }
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    )
}


function ArchiveSettings({ project }) {

    if (project.userRole === "MEMBER") return (
        <div className={styles.unauthorized}>
            <img src={unauthorized_svg} />
            <p>Unauthorized</p>
            <span>How'd you get in here?</span>
        </div>
    )

    const [searchValue, setSearchValue] = useState("");
    const [cards, setCards] = useState([]);
    const [selected, setSelected] = useState([]);
    const { openModal } = useModal();

    useEffect(() => {
        const fetchCards = async () => {
            const res = await axios.get(`http://localhost:5000/api/archives/project/${project._id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });
            setCards(res.data);
        }
        fetchCards();
    }, [openModal]);

    const allSelected = cards.length > 0 && selected.length === cards.length;
    const toggleSelectAll = () => {
        if (allSelected) setSelected([]);
        else setSelected(cards.filter(card =>
            searchValue
                ? card.title.toLowerCase().startsWith(searchValue.toLowerCase())
                : true
        ).map(card => card._id));
    };

    const toggleSelect = (id) => {
        setSelected(prev => prev.includes(id)
            ? prev.filter(_id => _id !== id)
            : [...prev, id]
        );
    };

    return (
        <div className={styles.archiveSettings}>
            <div className={styles.infoPane}>
                <div className={styles.project}>
                    <div className={styles.projectImage}>
                        <img src={project.projectImage.url} />
                    </div>
                    <h3>{project.name}</h3>
                    <img src={project.userRole === "OWNER" ? owner_svg : admin_svg} />
                </div>
            </div>
            <p className={styles.description}>
                This is the records room of this project. All these tasks are sorted by the time of closing. Click on a card to select. Right click to open options.
            </p>
            <div className={styles.actionPane}>
                <div className={styles.inputField}>
                    <img src={search_svg} />
                    <input type="text" onChange={(e) => setSearchValue(e.target.value)} placeholder="Search by title" />
                </div>
                <button className={styles.selectAll} onClick={() => toggleSelectAll()}>
                    <img src={selectAll_svg} />
                </button>
                <button className={styles.delete}
                    style={{ backgroundColor: selected.length === 0 ? "#242424" : "var(--red)" }}
                    onClick={() => openModal("ARCHIVE_CLEANUP", { taskIds: selected, projectId: project._id })}
                    disabled={selected.length === 0}>
                    <img src={deleteForever_svg} />
                </button>
            </div>
            <div className={styles.taskContainer}>
                {cards.filter(card => {
                    return searchValue
                        ? card.title.toLowerCase().startsWith(searchValue.toLowerCase())
                        : true;
                }).map(card => (
                    <ArchivedCard
                        key={card._id}
                        task={card}
                        onClick={() => toggleSelect(card._id)}
                        isSelected={selected.includes(card._id)}
                    />
                ))}
            </div>
        </div>
    )
}


function ProjectSettings() {

    const { id, tab } = useParams();
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
        if (tab) setActiveTab(tab);
    }, []);

    useEffect(() => {
        let link = document.querySelector("link[rel='icon']");
        link.href = favicon;
        document.title = `Settings | ${project?.name}`;
    });

    if (!project) return <Loading />

    const renderContent = () => {
        switch (activeTab) {
            case "general": return <GeneralSettings project={project} setProject={setProject} />;
            case "team": return <MemberSettings project={project} />;
            case "archive": return <ArchiveSettings project={project} />;
            default: return <GeneralSettings project={project} setProject={setProject} />;
        }
    };

    const Button = ({ img, size, text, onSelect, active }) => (
        <button className={activeTab === active ? `${styles.active}` : ""} onClick={() => onSelect ? setActiveTab(onSelect) : ``}>
            <img src={img} width={size} height={size} />
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
                        {project.userRole !== "MEMBER" &&
                            <Button img={settings_svg} size={15} text="General" onSelect="general" active="general" />}
                        <Button img={team_svg} size={15} text="Team" onSelect="team" active="team" />
                        {project.userRole !== "MEMBER" &&
                            <Button img={archive_svg} size={15} text="Archives" onSelect="archive" active="archive" />}
                    </aside>
                    {renderContent(activeTab)}
                </main>
            </div>
        </div>
    )
}

export default ProjectSettings;
