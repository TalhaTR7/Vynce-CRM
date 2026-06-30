// CreateTask + RestoreTask modals
import Modal from "./Modal";
import mood from "../context/MoodContext";
import { useState, useRef, useEffect } from "react";
import styles from "./css/CreateTask.module.scss";
import close_svg from "../assets/icons/close.svg";
import calendar_svg from "../assets/icons/calendar.svg";
import assignee_svg from "../assets/icons/assignee.svg";
import search_svg from "../assets/icons/search.svg";
import coin_svg from "../assets/icons/coin.svg";
import add_svg from "../assets/icons/add.svg";
import remove_svg from "../assets/icons/remove.svg";
import delete_svg from "../assets/icons/deleteforever.svg";
import difficultyOn_svg from "../assets/icons/difficultyOn.svg";
import difficultyOff_svg from "../assets/icons/difficultyOff.svg";
import loading_svg from "../assets/icons/loading.svg";
import toast from "react-hot-toast";
import axios from "axios";
import SelectDate from "./SelectDate";
import { useNavigate } from "react-router-dom";


/* ══════════════════════════════════════════════════════════════════
   CREATE TASK
   ══════════════════════════════════════════════════════════════════ */
export function CreateTask({ onClose, project, board }) {
    const [title, setTitle] = useState("");
    const [status, setStatus] = useState(null);
    const [assignee, setAssignee] = useState(null);
    const [dueDate, setDueDate] = useState(null);
    const [bounty, setBounty] = useState(1);
    const [difficulty, setDifficulty] = useState(1);
    const [description, setDescription] = useState("");
    const [members, setMembers] = useState([]);
    const [boards, setBoards] = useState([]);
    const [openDropdown, setOpenDropdown] = useState(null);
    const [searchValue, setSearchValue] = useState("");
    const [loading, setLoading] = useState(false);
    const boardDropdownRef = useRef(null);
    const assigneeDropdownRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => { if (board) setStatus(board); }, [board]);

    useEffect(() => {
        const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
        const fetchAll = async () => {
            setLoading(true);
            try {
                const [mem, brd] = await Promise.all([
                    axios.get(`/api/memberships/project/${project._id}`, { headers }),
                    axios.get(`/api/boards/project/${project._id}`, { headers }),
                ]);
                setMembers(mem.data);
                setBoards(brd.data);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetchAll();
        setAssignee(null);
    }, [project._id, board._id]);

    useEffect(() => {
        const handler = (e) => {
            if (openDropdown === "status" && boardDropdownRef.current && !boardDropdownRef.current.contains(e.target)) setOpenDropdown(null);
            if (openDropdown === "assignee" && assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(e.target)) setOpenDropdown(null);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [openDropdown]);

    const decreaseBounty = () => setBounty(p => Math.max(1, Number(p) - 1));
    const increaseBounty = () => setBounty(p => Number(p) + 1);

    const submit = async (handleClose) => {
        if (!title) { toast.error("Task title is required"); return; }
        if (!assignee) { toast.error("Assignee is required"); return; }
        try {
            setLoading(true);
            console.log("above route");
            const res = await axios.post("/api/tasks/create", {
                projectId: project._id,
                boardId: status._id,
                title, description,
                assigneeId: assignee._id,
                dueDate, ethereum:bounty, difficulty,
            }, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
            console.log("below route");
            handleClose();
            navigate(`/task/${res.data._id}`);
            toast.success("Task created!");
        } catch (err) {
            toast.error(err.response?.data?.msg || err.message);
        } finally { setLoading(false); }
    };

    const filteredMembers = members.filter(m => {
        if (!searchValue) return true;
        const full = `${m.user?.firstname ?? m.firstname} ${m.user?.lastname ?? m.lastname}`.toLowerCase();
        return full.startsWith(searchValue.toLowerCase());
    });

    return (
        <Modal onClose={onClose}>
            {({ handleClose }) => (
                <form style={{ position: "relative" }} onSubmit={(e) => { e.preventDefault(); submit(handleClose); }}>

                    {loading && <div className={styles.loadingOverlay}><img src={loading_svg} alt="" /></div>}

                    {/* Header */}
                    <div className={styles.header}>
                        <div className={styles.headerTitle}>
                            <h2>New task</h2>
                            <span>Task creation</span>
                        </div>
                        <button type="button" className={styles.closeButton} onClick={handleClose} aria-label="Close">
                            <img src={close_svg} alt="" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className={styles.body}>

                        {/* Title */}
                        <div className={styles.fieldGroup}>
                            <label>Title</label>
                            <input
                                className={styles.textInput}
                                type="text"
                                placeholder="What needs to be done?"
                                onChange={(e) => setTitle(e.target.value)}
                                required />
                        </div>

                        {/* Project + Board */}
                        <div className={styles.twoCol}>

                            {/* Project — read only */}
                            <div className={styles.fieldGroup}>
                                <label>Project</label>
                                <div className={styles.selectTrigger} style={{ cursor: "default", backgroundColor: "var(--border)" }}>
                                    <div className={styles.selectThumb}>
                                        <img src={project.projectImage.url} alt="" />
                                    </div>
                                    <span className={styles.selectLabel}>{project.name}</span>
                                </div>
                            </div>

                            {/* Board / Status */}
                            <div className={styles.fieldGroup} style={{ position: "relative" }} ref={boardDropdownRef}>
                                <label>Status</label>
                                <div
                                    className={styles.selectTrigger}
                                    onClick={() => setOpenDropdown(p => p === "status" ? null : "status")}>
                                    {status
                                        ? <>
                                            <div className={styles.selectDot} style={{ background: status.color }} />
                                            <span className={styles.selectLabel}>{status.name}</span>
                                        </>
                                        : <span className={styles.selectPlaceholder}>Select status…</span>
                                    }
                                </div>
                                {openDropdown === "status" && (
                                    <ul className={styles.dropdown}>
                                        {boards.map(b => (
                                            <li key={b._id} className={styles.dropdownOption} onClick={() => { setStatus(b); setOpenDropdown(null); }}>
                                                <div className={styles.optionDot} style={{ background: b.color }} />
                                                <span className={styles.optionLabel}>{b.name}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>

                        {/* Assignee + Due date */}
                        <div className={styles.twoCol}>

                            {/* Assignee */}
                            <div className={styles.fieldGroup} style={{ position: "relative" }} ref={assigneeDropdownRef}>
                                <label>Assignee</label>
                                <div
                                    className={styles.selectTrigger}
                                    onClick={() => {
                                        setOpenDropdown(p => p === "assignee" ? null : "assignee");
                                        setSearchValue("");
                                    }}>
                                    {assignee
                                        ? <>
                                            <div className={styles.selectAvatar}>
                                                <img src={assignee.profileImage?.url ?? assignee.user?.profileImage?.url} alt="" />
                                            </div>
                                            <span className={styles.selectLabel}>{assignee.firstname ?? assignee.user?.firstname} {assignee.lastname ?? assignee.user?.lastname}</span>
                                            <img src={mood[assignee.mood?.value || assignee.user?.mood?.value || "NORMAL"]} className={styles.selectMood} alt="" />
                                        </>
                                        : <>
                                            <img src={assignee_svg} className={styles.selectIcon} alt="" />
                                            <span className={styles.selectPlaceholder}>Assign to…</span>
                                        </>
                                    }
                                </div>
                                {openDropdown === "assignee" && (
                                    <ul className={styles.dropdown}>
                                        <div className={styles.dropdownSearch}>
                                            <img src={search_svg} alt="" />
                                            <input type="text" placeholder="Search member…" onChange={(e) => setSearchValue(e.target.value)} />
                                        </div>
                                        {filteredMembers.map(m => {
                                            const u = m.user ?? m;
                                            return (
                                                <li key={m._id} className={styles.dropdownOption} onClick={() => { setAssignee(u); setOpenDropdown(null); }}>
                                                    <div className={styles.optionAvatar}><img src={u.profileImage?.url} alt="" /></div>
                                                    <span className={styles.optionLabel}>{u.firstname} {u.lastname}</span>
                                                    <img src={mood[u.mood?.value || "NORMAL"]} className={styles.optionMood} alt="" />
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </div>

                            {/* Due date */}
                            <div className={styles.fieldGroup}>
                                <label>Due date</label>
                                <div className={styles.selectTrigger} style={{ cursor: "pointer" }}>
                                    <img src={calendar_svg} className={styles.selectIcon} alt="" />
                                    <SelectDate dueDate={dueDate} onChange={setDueDate} />
                                </div>
                            </div>
                        </div>

                        {/* Bounty + Difficulty */}
                        <div className={styles.outcomesRow}>

                            <div className={styles.fieldGroup}>
                                <label>Bounty</label>
                                <div className={styles.bountyControl}>
                                    <button type="button" className={styles.bountyStepBtn} onClick={decreaseBounty}>
                                        <img src={remove_svg} alt="" />
                                    </button>
                                    <div className={styles.bountyValue}>
                                        <img src={coin_svg} alt="" />
                                        <input
                                            type="number"
                                            value={bounty}
                                            onChange={(e) => setBounty(Math.max(1, Number(e.target.value)))} />
                                    </div>
                                    <button type="button" className={styles.bountyStepBtn} onClick={increaseBounty}>
                                        <img src={add_svg} alt="" />
                                    </button>
                                </div>
                            </div>

                            <div className={styles.fieldGroup}>
                                <label>Difficulty</label>
                                <div className={styles.starsControl}>
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <img
                                            key={i}
                                            src={i < difficulty ? difficultyOn_svg : difficultyOff_svg}
                                            className={styles.star}
                                            onClick={() => setDifficulty(i + 1)} />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className={styles.fieldGroup}>
                            <label>Description</label>
                            <textarea
                                className={styles.textArea}
                                placeholder="Optional context, requirements, links…"
                                onChange={(e) => setDescription(e.target.value)} />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className={styles.footer}>
                        <div className={styles.footerSpacer} />
                        <button type="submit" className={styles.submitButton} disabled={loading}>
                            Create task
                        </button>
                    </div>

                </form>
            )}
        </Modal>
    );
}


/* ══════════════════════════════════════════════════════════════════
   RESTORE TASK
   ══════════════════════════════════════════════════════════════════ */
export function RestoreTask({ onClose, task }) {
    const [title, setTitle] = useState(task.title);
    const [status, setStatus] = useState(null);
    const [assignee, setAssignee] = useState(null);
    const [dueDate, setDueDate] = useState(null);
    const [bounty, setBounty] = useState(task.ethereum?.assigned ?? 1);
    const [difficulty, setDifficulty] = useState(task.difficulty ?? 1);
    const [description, setDescription] = useState(task.description ?? "");
    const [members, setMembers] = useState([]);
    const [boards, setBoards] = useState([]);
    const [openDropdown, setOpenDropdown] = useState(null);
    const [searchValue, setSearchValue] = useState("");
    const [loading, setLoading] = useState(false);
    const boardDropdownRef = useRef(null);
    const assigneeDropdownRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
        const fetchAll = async () => {
            setLoading(true);
            try {
                const [mem, brd] = await Promise.all([
                    axios.get(`/api/memberships/project/${task.project._id}`, { headers }),
                    axios.get(`/api/boards/project/${task.project._id}`, { headers }),
                ]);
                setMembers(mem.data);
                setBoards(brd.data);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetchAll();
    }, []);

    useEffect(() => {
        const handler = (e) => {
            if (openDropdown === "status" && boardDropdownRef.current && !boardDropdownRef.current.contains(e.target)) setOpenDropdown(null);
            if (openDropdown === "assignee" && assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(e.target)) setOpenDropdown(null);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [openDropdown]);

    const decreaseBounty = () => setBounty(p => Math.max(1, Number(p) - 1));
    const increaseBounty = () => setBounty(p => Number(p) + 1);

    const remove = async (handleClose) => {
        try {
            setLoading(true);
            await axios.delete(`/api/archives/task/${task._id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            handleClose();
            toast.success("Task permanently deleted");
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const submit = async (handleClose) => {
        if (!title) { toast.error("Title is required"); return; }
        if (!assignee) { toast.error("Assignee is required"); return; }
        if (!status) { toast.error("Status is required"); return; }
        try {
            setLoading(true);
            const res = await axios.post(`/api/archives/restore/${task._id}`, {
                boardId: status._id,
                title, description,
                assigneeId: assignee._id,
                dueDate, ethereum: bounty, difficulty,
            }, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
            handleClose();
            navigate(`/task/${res.data._id}`);
            toast.success("Task restored!");
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.msg);
        } finally { setLoading(false); }
    };

    const filteredMembers = members.filter(m => {
        if (!searchValue) return true;
        const u = m.user ?? m;
        const full = `${u.firstname} ${u.lastname}`.toLowerCase();
        return full.startsWith(searchValue.toLowerCase());
    });

    return (
        <Modal onClose={onClose}>
            {({ handleClose }) => (
                <form style={{ position: "relative" }} onSubmit={(e) => { e.preventDefault(); submit(handleClose); }}>

                    {loading && <div className={styles.loadingOverlay}><img src={loading_svg} alt="" /></div>}

                    {/* Header */}
                    <div className={styles.header}>
                        <div className={styles.headerTitle}>
                            <h2>Restore task</h2>
                            <span>Task restoration</span>
                        </div>
                        <button type="button" className={styles.closeButton} onClick={handleClose} aria-label="Close">
                            <img src={close_svg} alt="" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className={styles.body}>

                        {/* Title */}
                        <div className={styles.fieldGroup}>
                            <label>Title</label>
                            <input
                                className={styles.textInput}
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required />
                        </div>

                        {/* Project + Board */}
                        <div className={styles.twoCol}>

                            <div className={styles.fieldGroup}>
                                <label>Project</label>
                                <div className={styles.selectTrigger} style={{ cursor: "default" }}>
                                    <div className={styles.selectThumb}>
                                        <img src={task.project.projectImage.url} alt="" />
                                    </div>
                                    <span className={styles.selectLabel}>{task.project.name}</span>
                                </div>
                            </div>

                            <div className={styles.fieldGroup} style={{ position: "relative" }} ref={boardDropdownRef}>
                                <label>Status</label>
                                <div
                                    className={styles.selectTrigger}
                                    onClick={() => setOpenDropdown(p => p === "status" ? null : "status")}>
                                    {status
                                        ? <>
                                            <div className={styles.selectDot} style={{ background: status.color }} />
                                            <span className={styles.selectLabel}>{status.name}</span>
                                        </>
                                        : <span className={styles.selectPlaceholder}>Select status…</span>
                                    }
                                </div>
                                {openDropdown === "status" && (
                                    <ul className={styles.dropdown}>
                                        {boards.map(b => (
                                            <li key={b._id} className={styles.dropdownOption} onClick={() => { setStatus(b); setOpenDropdown(null); }}>
                                                <div className={styles.optionDot} style={{ background: b.color }} />
                                                <span className={styles.optionLabel}>{b.name}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>

                        {/* Assignee + Due date */}
                        <div className={styles.twoCol}>

                            <div className={styles.fieldGroup} style={{ position: "relative" }} ref={assigneeDropdownRef}>
                                <label>Assignee</label>
                                <div
                                    className={styles.selectTrigger}
                                    onClick={() => {
                                        setOpenDropdown(p => p === "assignee" ? null : "assignee");
                                        setSearchValue("");
                                    }}>
                                    {assignee
                                        ? <>
                                            <div className={styles.selectAvatar}>
                                                <img src={assignee.profileImage?.url} alt="" />
                                            </div>
                                            <span className={styles.selectLabel}>{assignee.firstname} {assignee.lastname}</span>
                                            <img src={mood[assignee.mood?.value || "NORMAL"]} className={styles.selectMood} alt="" />
                                        </>
                                        : <>
                                            <img src={assignee_svg} className={styles.selectIcon} alt="" />
                                            <span className={styles.selectPlaceholder}>Assign to…</span>
                                        </>
                                    }
                                </div>
                                {openDropdown === "assignee" && (
                                    <ul className={styles.dropdown}>
                                        <div className={styles.dropdownSearch}>
                                            <img src={search_svg} alt="" />
                                            <input type="text" placeholder="Search member…" onChange={(e) => setSearchValue(e.target.value)} />
                                        </div>
                                        {filteredMembers.map(m => {
                                            const u = m.user ?? m;
                                            return (
                                                <li key={m._id} className={styles.dropdownOption} onClick={() => { setAssignee(u); setOpenDropdown(null); }}>
                                                    <div className={styles.optionAvatar}><img src={u.profileImage?.url} alt="" /></div>
                                                    <span className={styles.optionLabel}>{u.firstname} {u.lastname}</span>
                                                    <img src={mood[u.mood?.value || "NORMAL"]} className={styles.optionMood} alt="" />
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </div>

                            <div className={styles.fieldGroup}>
                                <label>Due date</label>
                                <div className={styles.selectTrigger} style={{ cursor: "pointer" }}>
                                    <img src={calendar_svg} className={styles.selectIcon} alt="" />
                                    <SelectDate dueDate={dueDate} onChange={setDueDate} />
                                </div>
                            </div>
                        </div>

                        {/* Bounty + Difficulty */}
                        <div className={styles.outcomesRow}>

                            <div className={styles.fieldGroup}>
                                <label>Bounty</label>
                                <div className={styles.bountyControl}>
                                    <button type="button" className={styles.bountyStepBtn} onClick={decreaseBounty}>
                                        <img src={remove_svg} alt="" />
                                    </button>
                                    <div className={styles.bountyValue}>
                                        <img src={coin_svg} alt="" />
                                        <input
                                            type="number"
                                            value={bounty}
                                            onChange={(e) => setBounty(Math.max(1, Number(e.target.value)))} />
                                    </div>
                                    <button type="button" className={styles.bountyStepBtn} onClick={increaseBounty}>
                                        <img src={add_svg} alt="" />
                                    </button>
                                </div>
                            </div>

                            <div className={styles.fieldGroup}>
                                <label>Difficulty</label>
                                <div className={styles.starsControl}>
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <img
                                            key={i}
                                            src={i < difficulty ? difficultyOn_svg : difficultyOff_svg}
                                            className={styles.star}
                                            onClick={() => setDifficulty(i + 1)} />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className={styles.fieldGroup}>
                            <label>Description</label>
                            <textarea
                                className={styles.textArea}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)} />
                        </div>
                    </div>

                    {/* Footer — delete left, restore right */}
                    <div className={styles.footer}>
                        <button type="button" className={styles.deleteButton} onClick={() => remove(handleClose)}>
                            <img src={delete_svg} alt="" />
                        </button>
                        <div className={styles.footerSpacer} />
                        <button type="submit" className={styles.submitButton} disabled={loading}>
                            Restore task
                        </button>
                    </div>

                </form>
            )}
        </Modal>
    );
}