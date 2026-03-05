// Project Settings page — General, Team, Archives, Marketplace
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
import auction_svg from "../assets/icons/auction.svg";
import unauthorized_svg from "../assets/icons/unauthorized.svg";
import Loading from "../components/Loading";
import mood from "../context/MoodContext";
import styles from "../css/ProjectSettings.module.scss";
import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import { useModal } from "../context/ModalContext";
import { ArchivedCard, MarketCard } from "../components/Card";
import axios from "axios";
import toast from "react-hot-toast";
import { closestCenter, DndContext } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";


/* ══════════════════════════════════════════════════════════════════
   GENERAL SETTINGS
   ══════════════════════════════════════════════════════════════════ */
function GeneralSettings({ project, setProject }) {

    if (project.userRole === "MEMBER") return (
        <div className={styles.settingsPanel}>
            <Unauthorized />
        </div>
    );

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
            const res = await axios.get(`/api/memberships/project/${project._id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            setAdmins(res.data.filter(m => m.role === "ADMIN"));
            setOwner(res.data.find(m => m.role === "OWNER"));
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

    const createdOn = new Date(project.createdAt).toLocaleString("en-GB", { day: "numeric", month: "long", year: "numeric" });

    const handleFileChange = (e) => {
        const f = e.target.files[0];
        if (!f) return;
        setProjectImage(URL.createObjectURL(f));
        setFile(f);
    };

    const saveProject = async () => {
        if (!projectName) { toast.error("Project name is required"); return; }
        if (file) {
            if (file.size > 5 * 1024 * 1024) { toast.error("File is larger than 5 MB"); return; }
            if (file.type !== "image/png") { toast.error("Only PNG is allowed"); return; }
        }
        try {
            const formData = new FormData();
            formData.append("name", projectName);
            if (file) formData.append("image", file);
            const res = await axios.patch(`/api/projects/project/${project._id}`, formData, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            setProject(prev => ({
                ...prev,
                name: projectName,
                projectImage: { url: file ? projectImage : res.data.projectImage.url },
            }));
            setFile(null);
            toast.success("Changes saved!");
        } catch (err) { console.error(err); }
    };

    const projectObj = {
        _id: project._id,
        name: project.name,
        projectImage: project.projectImage
    };

    function SortableBoard({ board }) {
        const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: board._id });
        return (
            <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={styles.generalBoardRow}>
                <img src={drag_svg} className={styles.generalBoardDragHandle} {...listeners} {...attributes} alt="" />
                <div className={styles.generalBoardColorDot} style={{ backgroundColor: board.color }} />
                <p>{board.name}</p>
            </div>
        );
    }

    const handleDragEnd = async ({ active, over }) => {
        if (!over || active.id === over.id) return;
        const oldPos = boards.findIndex(b => b._id === active.id);
        const newPos = boards.findIndex(b => b._id === over.id);
        const repositioned = arrayMove(boards, oldPos, newPos);
        setBoards(repositioned);
        try {
            await Promise.all(repositioned.map((board, index) =>
                axios.patch(`/api/boards/move/${board._id}`, { projectId: project._id, newPosition: index }, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                })
            ));
        } catch (err) { console.error(err); }
    };

    return (
        <div className={styles.settingsPanel}>

            {/* Project image + meta card */}
            <div className={styles.generalProjectCard}>
                <div className={styles.generalProjectImage} onClick={() => fileInputRef.current.click()}>
                    <img src={projectImage || ""} alt={project.name} />
                </div>
                <input type="file" accept="image/png" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileChange} />
                <div className={styles.generalProjectMeta}>
                    <p className={styles.generalProjectMetaName}>{project.name}</p>
                    <p className={styles.generalProjectMetaDate}>Created on {createdOn}</p>
                </div>
                {project.userRole !== "MEMBER" && (
                    <img className={styles.generalRoleBadge} src={project.userRole === "OWNER" ? owner_svg : admin_svg} alt="" />
                )}
            </div>

            {/* Project name input */}
            <div className={styles.generalInputGroup}>
                <span className={styles.fieldLabel}>Project name</span>
                <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
            </div>

            {/* Boards drag-sort */}
            <div className={styles.generalBoardsGroup}>
                <span className={styles.fieldLabel}>Boards</span>
                <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={boards.map(b => b._id)} strategy={verticalListSortingStrategy}>
                        <div className={styles.generalBoardsScroll}>
                            {boards.map(board => <SortableBoard key={board._id} board={board} />)}
                        </div>
                    </SortableContext>
                </DndContext>
                <button className={styles.generalBoardCreateButton} onClick={() => openModal("CREATE_BOARD", { project: projectObj })}>
                    <img src={add_svg} alt="" />
                    <p>Create new board</p>
                </button>
            </div>

            {/* Danger zone — owner: transfer + delete */}
            {project.userRole === "OWNER" && (
                <div className={styles.dangerZone}>
                    <span className={styles.dangerZoneLabel}>Danger zone</span>

                    {/* Transfer ownership */}
                    <div className={styles.dangerZoneRow}>
                        <p>Transfer ownership to an admin</p>
                        <div className={styles.transferWrapper} ref={dropdownRef}>
                            <button className={styles.transferButton} onClick={() => setOpenDropdown(v => !v)}>
                                <p>Transfer</p>
                            </button>
                            {openDropdown && (
                                <ul className={styles.transferDropdown}>
                                    {admins
                                        .filter(admin => {
                                            if (!searchValue) return true;
                                            const full = `${admin.firstname} ${admin.lastname}`.toLowerCase();
                                            return full.startsWith(searchValue.toLowerCase())
                                                || admin.firstname.toLowerCase().startsWith(searchValue.toLowerCase())
                                                || admin.lastname.toLowerCase().startsWith(searchValue.toLowerCase());
                                        })
                                        .map(admin => {
                                            const payload = {
                                                project: { _id: project._id, name: project.name, projectImage: project.projectImage },
                                                admin: { _id: admin._id, firstname: admin.firstname, lastname: admin.lastname, profileImage: admin.profileImage },
                                                owner: owner ? { _id: owner._id, firstname: owner.firstname, lastname: owner.lastname, profileImage: owner.profileImage } : null,
                                            };
                                            return (
                                                <li key={admin._id} className={styles.transferOption} onClick={() => { openModal("TRANSFER_OWNERSHIP", { payload }); setOpenDropdown(false); }}>
                                                    <div className={styles.transferOptionAvatar}>
                                                        <img src={admin.profileImage.url} alt="" />
                                                    </div>
                                                    <span>{admin.firstname} {admin.lastname}</span>
                                                </li>
                                            );
                                        })
                                    }
                                    <div className={styles.transferSearchField}>
                                        <img src={search_svg} alt="" />
                                        <input type="text" placeholder="Search admin" onChange={(e) => setSearchValue(e.target.value)} />
                                    </div>
                                </ul>
                            )}
                        </div>
                    </div>

                    <div className={styles.dangerZoneDivider} />

                    {/* Delete project */}
                    <div className={styles.dangerZoneRow}>
                        <p>Permanently delete this project and all its data</p>
                        <button className={styles.dangerZoneButton} style={{ backgroundColor: "var(--red)" }} onClick={() => openModal("DELETE_PROJECT", { project: projectObj })}>
                            <img src={delete_svg} alt="" />
                            <p style={{ color: "#fff" }}>Delete project</p>
                        </button>
                    </div>
                </div>
            )}

            {/* Danger zone — admin: leave */}
            {project.userRole === "ADMIN" && (
                <div className={styles.dangerZone}>
                    <span className={styles.dangerZoneLabel}>Danger zone</span>
                    <div className={styles.dangerZoneRow}>
                        <p>Leave this project, notifying the owner</p>
                        <button
                            className={styles.dangerZoneButton}
                            style={{ backgroundColor: "var(--red)" }}
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
            )}

            <button
                className={`${styles.saveButton} ${saveNeeded ? styles.saveButtonActive : ""}`}
                disabled={!saveNeeded}
                onClick={saveProject}>
                Save changes
            </button>
        </div>
    );
}


/* ══════════════════════════════════════════════════════════════════
   MEMBER SETTINGS
   ══════════════════════════════════════════════════════════════════ */
function MemberSettings({ project, refreshProject }) {
    const [searchValue, setSearchValue] = useState("");
    const [selected, setSelected] = useState([]);
    const [openDropdownId, setOpenDropdownId] = useState(null);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
    const dropdownRef = useRef(null);
    const members = project.memberships;
    const { openModal } = useModal();
    const navigate = useNavigate();

    /* Close portal dropdown on outside click */
    useEffect(() => {
        if (!openDropdownId) return;
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target))
                setOpenDropdownId(null);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [openDropdownId]);

    /* Measure ··· button position, then open portal dropdown at that spot */
    const handleOpenDropdown = useCallback((e, memberId) => {
        if (openDropdownId === memberId) { setOpenDropdownId(null); return; }
        const rect = e.currentTarget.getBoundingClientRect();
        setDropdownPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
        setOpenDropdownId(memberId);
    }, [openDropdownId]);

    const filteredMembers = members.filter(m => {
        if (!searchValue) return true;
        const full = `${m.user.firstname} ${m.user.lastname}`.toLowerCase();
        return full.startsWith(searchValue.toLowerCase())
            || m.user.lastname.toLowerCase().startsWith(searchValue.toLowerCase());
    });

    const selectableIds = filteredMembers.filter(m => m.role !== "OWNER").map(m => m._id);
    const allSelected = selectableIds.length > 0 && selectableIds.every(id => selected.includes(id));
    const toggleSelectAll = () => allSelected ? setSelected([]) : setSelected(selectableIds);
    const toggleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

    const openChat = async (email) => {
        try {
            const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
            const { data: user } = await axios.get(`/api/users/email/${email}`, { headers });
            const res = await axios.post(`/api/messages/user/${user._id}`, {}, { headers });
            navigate(`/chat/${res.data.chat._id}`);
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.msg || err.message);
        }
    };

    const joinDate = (createdAt) => {
        const d = new Date(createdAt);
        return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
    };

    const activeMember = openDropdownId ? members.find(m => m._id === openDropdownId) : null;

    return (
        <div className={styles.settingsPanel}>

            {/* Project identity row */}
            <div className={styles.panelProjectRow}>
                <div className={styles.panelProjectThumbnail}>
                    <img src={project.projectImage.url} alt={project.name} />
                </div>
                <p className={styles.panelProjectName}>{project.name}</p>
                <img className={styles.panelRoleBadge} src={project.userRole === "OWNER" ? owner_svg : admin_svg} alt="" />
            </div>

            {/* Toolbar — always rendered, actions hidden for non-owners */}
            <div className={styles.memberToolbar}>
                <div className={styles.sharedSearchField} style={{ flex: 1 }}>
                    <img src={search_svg} alt="" />
                    <input type="text" placeholder="Search member…" onChange={(e) => setSearchValue(e.target.value)} />
                </div>
                {project.userRole === "OWNER" && (<>
                    <button className={styles.sharedIconButton} onClick={toggleSelectAll} title="Select all">
                        <img src={selectAll_svg} alt="" />
                    </button>
                    <button
                        className={`${styles.sharedIconButton} ${styles.sharedIconButtonDestructive}`}
                        title="Remove selected"
                        onClick={() => selected.length && openModal("REMOVE_MEMBERS", {
                            memberIds: { projectId: project._id, memberships: selected },
                            onSuccess: refreshProject,
                        })}
                    >
                        <img src={remove_svg} alt="" />
                    </button>
                    <button className={styles.memberInviteButton} onClick={() => openModal("INVITE_USER", { projectId: project._id })}>
                        <img src={add_svg} alt="" />
                        <p>Invite people</p>
                    </button>
                </>)}
            </div>

            {/* Member table */}
            <div className={styles.memberTable}>
                <div className={styles.memberTableHead}>
                    <label />
                    <label>Name</label>
                    <label>Email</label>
                    <label>Role</label>
                    <label style={{ textAlign: "center" }}>Mood</label>
                    <label style={{ textAlign: "center" }}>Joined</label>
                    <label />
                </div>
                <div className={styles.memberTableBody}>
                    {filteredMembers.map(member => {
                        const rolePillClass = `${styles.memberRolePill} ${member.role === "OWNER" ? styles.memberRolePillOwner :
                            member.role === "ADMIN" ? styles.memberRolePillAdmin :
                                styles.memberRolePillMember
                            }`;
                        return (
                            <div className={styles.memberRow} key={member._id}>
                                {/* Checkbox slot — always occupies the column */}
                                {project.userRole === "OWNER" && member.role !== "OWNER"
                                    ? <input
                                        type="checkbox"
                                        className={styles.memberCheckbox}
                                        checked={selected.includes(member._id)}
                                        onChange={() => toggleSelect(member._id)}
                                    />
                                    : <div className={styles.memberCheckboxSpacer} />
                                }
                                <div className={styles.memberIdentity}>
                                    <div className={styles.memberAvatar}>
                                        <img src={member.user.profileImage.url} alt="" />
                                    </div>
                                    <p>{member.user.firstname} {member.user.lastname}</p>
                                </div>
                                <p>{member.user.email}</p>
                                <span className={rolePillClass}>{member.role.toLowerCase()}</span>
                                <img src={mood[member.user.currentMood]} className={styles.memberMood} alt="" />
                                <p style={{ textAlign: "center" }}>{joinDate(member.createdAt)}</p>
                                {project.userRole === "OWNER" && member.role !== "OWNER"
                                    ? <div className={styles.memberRowOptions}>
                                        <div
                                            className={styles.memberRowMoreButton}
                                            onClick={(e) => handleOpenDropdown(e, member._id)}
                                        >
                                            <img src={more_svg} alt="" />
                                        </div>
                                    </div>
                                    : <div />
                                }
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Portal dropdown — attaches to document.body, escapes all overflow containers */}
            {activeMember && createPortal(
                <ul
                    ref={dropdownRef}
                    className={styles.memberRowDropdownPortal}
                    style={{ top: dropdownPos.top, right: dropdownPos.right }}
                >
                    <li className={styles.memberRowOption} onClick={() => { openChat(activeMember.user.email); setOpenDropdownId(null); }}>
                        <img src={message_svg} alt="" />
                        <span>Open chat</span>
                    </li>
                    {activeMember.role === "ADMIN" && (
                        <li className={styles.memberRowOption} onClick={() => { openModal("DEMOTE_ADMIN", { membershipId: activeMember._id, onSuccess: refreshProject }); setOpenDropdownId(null); }}>
                            <img src={demote_svg} alt="" />
                            <span>Demote to member</span>
                        </li>
                    )}
                    {activeMember.role === "MEMBER" && (
                        <li className={styles.memberRowOption} onClick={() => { openModal("PROMOTE_MEMBER", { membershipId: activeMember._id, onSuccess: refreshProject }); setOpenDropdownId(null); }}>
                            <img src={promote_svg} alt="" />
                            <span>Promote to admin</span>
                        </li>
                    )}
                    <li
                        className={`${styles.memberRowOption} ${styles.memberRowOptionDestructive}`}
                        onClick={() => { openModal("REMOVE_MEMBERS", { memberIds: { memberships: [activeMember._id], projectId: project._id }, onSuccess: refreshProject }); setOpenDropdownId(null); }}
                    >
                        <img src={remove_svg} alt="" />
                        <span>Remove from project</span>
                    </li>
                </ul>,
                document.body
            )}
        </div>
    );
}


/* ══════════════════════════════════════════════════════════════════
   ARCHIVE SETTINGS
   ══════════════════════════════════════════════════════════════════ */
function ArchiveSettings({ project }) {

    if (project.userRole === "MEMBER") return (
        <div className={styles.settingsPanel}><Unauthorized /></div>
    );

    const [searchValue, setSearchValue] = useState("");
    const [cards, setCards] = useState([]);
    const [selected, setSelected] = useState([]);
    const { openModal } = useModal();

    useEffect(() => {
        const fetchCards = async () => {
            const res = await axios.get(`/api/archives/project/${project._id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            setCards(res.data);
        };
        fetchCards();
    }, [openModal]);

    const visibleCards = cards.filter(c => !searchValue || c.title.toLowerCase().startsWith(searchValue.toLowerCase()));
    const allSelected = visibleCards.length > 0 && visibleCards.every(c => selected.includes(c._id));
    const toggleSelectAll = () => allSelected ? setSelected([]) : setSelected(visibleCards.map(c => c._id));
    const toggleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

    return (
        <div className={styles.settingsPanel}>

            {/* Section header */}
            <div className={styles.cardSectionHeader}>
                <div className={styles.cardSectionHeaderLeft}>
                    <div className={styles.panelProjectRow}>
                        <div className={styles.panelProjectThumbnail}>
                            <img src={project.projectImage.url} alt={project.name} />
                        </div>
                        <p className={styles.panelProjectName}>{project.name}</p>
                        <img className={styles.panelRoleBadge} src={project.userRole === "OWNER" ? owner_svg : admin_svg} alt="" />
                    </div>
                    <p className={styles.sectionDescription}>
                        Records room — all closed tasks sorted by closure time. Click to select, right-click to restore.
                    </p>
                </div>
            </div>

            {/* Card browser: toolbar + scrollable 3-col grid */}
            <div className={styles.cardBrowser}>
                <div className={styles.cardBrowserToolbar}>
                    <div className={styles.sharedSearchField} style={{ flex: 1 }}>
                        <img src={search_svg} alt="" />
                        <input type="text" placeholder="Search by title…" onChange={(e) => setSearchValue(e.target.value)} />
                    </div>
                    <button className={styles.sharedIconButton} onClick={toggleSelectAll} title="Select all">
                        <img src={selectAll_svg} alt="" />
                    </button>
                    <button
                        className={`${styles.sharedIconButton} ${styles.sharedIconButtonDestructive}`}
                        disabled={selected.length === 0}
                        onClick={() => openModal("ARCHIVE_CLEANUP", {
                            taskIds: selected,
                            projectId: project._id
                        })}>
                        <img src={deleteForever_svg} alt="" />
                    </button>
                </div>
                <div className={styles.cardBrowserGrid}>
                    {visibleCards.length === 0
                        ? <div className={styles.cardBrowserEmpty}>
                            <img src={archive_svg} alt="" />
                            <p>No archived tasks yet.</p>
                        </div>
                        : visibleCards.map(card => (
                            <ArchivedCard
                                key={card._id}
                                task={card}
                                onClick={() => toggleSelect(card._id)}
                                isSelected={selected.includes(card._id)} />
                        ))
                    }
                </div>
            </div>
        </div>
    );
}


/* ══════════════════════════════════════════════════════════════════
   MARKETPLACE
   ══════════════════════════════════════════════════════════════════ */
function Marketplace({ project }) {
    const [cards, setCards] = useState([]);
    const [searchValue, setSearchValue] = useState("");
    const { openModal } = useModal();

    useEffect(() => {
        const fetchCards = async () => {
            const res = await axios.get(`/api/auction/project/${project._id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            setCards(res.data);
        };
        fetchCards();
    }, [openModal]);

    const visibleCards = cards.filter(({ task }) =>
        !searchValue || task.title.toLowerCase().startsWith(searchValue.toLowerCase())
    );

    return (
        <div className={styles.settingsPanel}>

            {/* Section header */}
            <div className={styles.cardSectionHeader}>
                <div className={styles.cardSectionHeaderLeft}>
                    <div className={styles.panelProjectRow}>
                        <div className={styles.panelProjectThumbnail}>
                            <img src={project.projectImage.url} alt={project.name} />
                        </div>
                        <p className={styles.panelProjectName}>{project.name}</p>
                        <img className={styles.panelRoleBadge} src={project.userRole === "OWNER" ? owner_svg : admin_svg} alt="" />
                    </div>
                    <p className={styles.sectionDescription}>
                        Tasks open for bidding. Submit a bid to claim ownership of a task.
                    </p>
                </div>
            </div>

            {/* Card browser: toolbar + scrollable 3-col grid */}
            <div className={styles.cardBrowser}>
                <div className={styles.cardBrowserToolbar}>
                    <div className={styles.sharedSearchField} style={{ flex: 1 }}>
                        <img src={search_svg} alt="" />
                        <input type="text" placeholder="Search by title…" onChange={(e) => setSearchValue(e.target.value)} />
                    </div>
                </div>
                <div className={styles.cardBrowserGrid}>
                    {visibleCards.length === 0
                        ? <div className={styles.cardBrowserEmpty}>
                            <img src={auction_svg} alt="" />
                            <p>No tasks on auction yet.</p>
                        </div>
                        : visibleCards.map(({ task, auction }) => (
                            <MarketCard
                                key={auction._id}
                                task={task}
                                auction={auction}
                                onClick={() => openModal("OPEN_BID", { task })} />
                        ))
                    }
                </div>
            </div>
        </div>
    );
}


/* ══════════════════════════════════════════════════════════════════
   UNAUTHORIZED SHARED COMPONENT
   ══════════════════════════════════════════════════════════════════ */
function Unauthorized() {
    return (
        <div className={styles.unauthorized}>
            <img src={unauthorized_svg} alt="" />
            <p>Unauthorized</p>
            <span>How'd you get in here?</span>
        </div>
    );
}


/* ══════════════════════════════════════════════════════════════════
   ROOT — ProjectSettings
   ══════════════════════════════════════════════════════════════════ */
function ProjectSettings() {
    const { id, tab } = useParams();
    const [project, setProject] = useState(null);
    const [activeTab, setActiveTab] = useState("general");
    const navigate = useNavigate();

    const refreshProject = async () => {
        try {
            const res = await axios.get(`/api/projects/project/${id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            setProject(res.data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        refreshProject();
        if (tab) setActiveTab(tab);
    }, [id]);

    useEffect(() => {
        const link = document.querySelector("link[rel='icon']");
        link.href = favicon;
        if (project) document.title = `Settings | ${project.name}`;
    });

    if (!project) return <Loading />;

    const renderContent = () => {
        switch (activeTab) {
            case "general": return <GeneralSettings project={project} setProject={setProject} />;
            case "team": return <MemberSettings project={project} refreshProject={refreshProject} />;
            case "archive": return <ArchiveSettings project={project} />;
            case "markets": return <Marketplace project={project} />;
            default: return <GeneralSettings project={project} setProject={setProject} />;
        }
    };

    const NavButton = ({ icon, label, tabKey, hidden }) => {
        if (hidden) return null;
        return (
            <button
                className={`${styles.settingsNavButton} ${activeTab === tabKey ? styles.settingsNavButtonActive : ""}`}
                onClick={() => setActiveTab(tabKey)}>
                <img src={icon} alt="" />
                <p>{label}</p>
            </button>
        );
    };

    return (
        <div className={styles.canvas}>
            <Header />
            <div className={styles.container}>
                <Sidebar />
                <main className={styles.projectSettings}>
                    <div className={styles.settingsInner}>

                        <button className={styles.backButton} onClick={() => navigate(-1)}>
                            <img src={back_svg} alt="Back" />
                        </button>

                        {/* Left nav */}
                        <aside className={styles.settingsSidebar}>
                            <span className={styles.settingsSidebarLabel}>Settings</span>
                            <NavButton icon={settings_svg} label="General" tabKey="general" hidden={project.userRole === "MEMBER"} />
                            <NavButton icon={team_svg} label="Team" tabKey="team" />
                            <NavButton icon={archive_svg} label="Archives" tabKey="archive" hidden={project.userRole === "MEMBER"} />
                            <NavButton icon={auction_svg} label="Marketplace" tabKey="markets" />
                        </aside>

                        {renderContent()}

                    </div>
                </main>
            </div>
        </div>
    );
}

export default ProjectSettings;