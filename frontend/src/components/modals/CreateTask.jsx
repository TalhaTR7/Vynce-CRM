import Modal from "./Modal";
import mood from "../../context/MoodContext";
import { useState, useRef, useEffect } from "react";
import close_svg from "../../assets/icons/close.svg";
import calendar_svg from "../../assets/icons/calendar.svg";
import assignee_svg from "../../assets/icons/assignee.svg";
import search_svg from "../../assets/icons/search.svg";
import coin_svg from "../../assets/icons/coin.svg";
import add_svg from "../../assets/icons/add.svg";
import remove_svg from "../../assets/icons/remove.svg";
import delete_svg from "../../assets/icons/deleteforever.svg";
import difficultyOn_svg from "../../assets/icons/difficultyOn.svg";
import difficultyOff_svg from "../../assets/icons/difficultyOff.svg";
import loading_svg from "../../assets/icons/loading.svg";
import toast from "react-hot-toast";
import axios from "axios";
import styles from "./css/CreateTask.module.scss";
import SelectDate from "./SelectDate";
import { useNavigate } from "react-router-dom";


export function CreateTask({ onClose, project, board }) {
    const [title, setTitle] = useState("");
    const [status, setStatus] = useState(null);
    const [assignee, setAssignee] = useState(null);
    const [dueDate, setDueDate] = useState(null);
    const [bounty, setBounty] = useState(1);
    const [difficulty, setDifficulty] = useState(1);
    const [description, setDescription] = useState("");

    const [members, setMembers] = useState([]);
    const [boards, seBoards] = useState([]);
    const [openDropdown, setOpenDropdown] = useState(false);
    const dropdownRef = useRef(null);
    const [searchValue, setSearchValue] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (board) setStatus(board);
    }, [board]);

    const handleSelectAssignee = (member) => {
        setAssignee(member);
        setOpenDropdown(null);
    };

    const handleSelectStatus = (status) => {
        setStatus(status);
        setOpenDropdown(null);
    };


    useEffect(() => {
        const fetchMembers = async () => {
            try {
                setLoading(true);
                const res = await axios.get(`http://localhost:5000/api/memberships/project/${project._id}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                });

                setMembers(res.data);
            } catch (err) {
                console.error("Failed to fetch members", err);
            } finally {
                setLoading(false);
            }
        };
        fetchMembers();
        setAssignee(null);

        const fetchBoards = async () => {
            try {
                setLoading(true);
                const res = await axios.get(`http://localhost:5000/api/boards/project/${project._id}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                });

                seBoards(res.data);
            } catch (err) {
                console.error("Failed to fetch boards", err);
            } finally {
                setLoading(false);
            }
        };
        fetchBoards();
    }, [project._id, board._id]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target))
                setOpenDropdown(null);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [openDropdown]);

    const increaseBounty = () => {
        setBounty((prev) => Number(prev) + 1);
    };

    const decreaseBounty = () => {
        setBounty((prev) => {
            const current = Number(prev);
            if (current - 1 === 0) return current;
            return current - 1;
        });
    };

    const handleStarClick = (index) => {
        setDifficulty(index + 1);
    };

    const submit = async (handleClose) => {
        if (!title) {
            toast.error("Task title is required");
            return;
        }
        if (!assignee) {
            toast.error("Task Assignee is required");
            return;
        }

        try {
            setLoading(true);
            const res = await axios.post("http://localhost:5000/api/tasks/create", {
                projectId: project._id,
                boardId: status._id,
                title: title,
                description: description,
                assigneeId: assignee._id,
                dueDate: dueDate,
                ethereum: bounty,
                difficulty: difficulty
            }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            })
            handleClose();
            navigate(`/task/${res.data._id}`);
            toast.success(`Task successfully created`);
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal onClose={onClose}>
            {({ handleClose }) => (<>
                <div className={styles.loading} style={{ visibility: loading ? "visible" : "hidden" }}  >
                    <img src={loading_svg} />
                </div>
                <form onSubmit={(e) => { e.preventDefault(); submit(handleClose); }} style={{ visibility: loading ? "hidden" : "visible" }}>
                    <div className={styles.titlePane}>
                        <label>Task creation</label>
                        <img src={close_svg} onClick={handleClose} />
                    </div>
                    <div className={styles.title}>
                        <label>Title</label>
                        <input type="text" onChange={(e) => setTitle(e.target.value)} required />
                    </div>
                    {/* set up parents */}
                    <div className={styles.parents}>
                        <div className={styles.project}>
                            <label>Project</label>
                            <div className={styles.inputField}>
                                <div className={styles.projectImage}>
                                    <img src={project.projectImage.url} />
                                </div>
                                <input disabled value={project.name} />
                            </div>
                        </div>
                        <div className={styles.board} ref={dropdownRef}>
                            <label>Status</label>
                            <div className={styles.inputField} ref={openDropdown === "status" ? dropdownRef : null} onClick={() => setOpenDropdown(openDropdown === "status" ? null : "status")}>
                                <div className={styles.activeBoard}>
                                    <div className={styles.boardColor} style={{ backgroundColor: status?.color }} />
                                    <span>{status?.name}</span>
                                </div>
                                {
                                    openDropdown === "status" &&
                                    <ul className={styles.dropdown}>
                                        {
                                            boards.map(status => (
                                                <li key={status._id} className={styles.option} onClick={() => handleSelectStatus(status)}>
                                                    <div className={styles.boardColor} style={{ backgroundColor: status.color }} />
                                                    <span>{status.name}</span>
                                                </li>
                                            ))
                                        }
                                    </ul>
                                }

                            </div>
                        </div>
                    </div>

                    <div className={styles.taskInfo}>
                        {/* set assignee */}
                        <div className={styles.assignee} ref={openDropdown === "assignee" ? dropdownRef : null}>
                            <label>Assignee</label>
                            <div className={styles.inputField} onClick={() => { setOpenDropdown(openDropdown === "assignee" ? null : "assignee"); setSearchValue("") }}>
                                {
                                    assignee === null &&
                                    <div className={styles.activeMember}>
                                        <img className={styles.icon} src={assignee_svg} />
                                    </div>
                                }
                                {
                                    assignee &&
                                    <div className={styles.activeMember}>
                                        <div className={styles.profileImage}>
                                            <img src={assignee.profileImage.url} />
                                        </div>
                                        <span>{assignee.firstname} {assignee.lastname}</span>
                                        <img src={mood[assignee.currentMood]} className={styles.mood} />
                                    </div>
                                }
                            </div>
                            {
                                openDropdown === "assignee" &&
                                <ul className={styles.dropdown}>
                                    <div className={styles.searchField}>
                                        <img src={search_svg} />
                                        <input type="text" placeholder="Search member" onChange={(e) => setSearchValue(e.target.value)} />
                                    </div>
                                    {
                                        members.filter(member => {
                                            if (!searchValue) return true;
                                            const fullName = `${member.firstname} ${member.lastname}`.toLowerCase();
                                            return fullName.startsWith(searchValue.toLowerCase())
                                                || member.firstname.toLowerCase().startsWith(searchValue.toLowerCase())
                                                || member.lastname.toLowerCase().startsWith(searchValue.toLowerCase());
                                        }).map(member => (
                                            <li key={member._id} className={styles.option} onClick={() => handleSelectAssignee(member)}>
                                                <div className={styles.profileImage}>
                                                    <img src={member.profileImage.url} />
                                                </div>
                                                <span>{member.firstname} {member.lastname}</span>
                                                <img src={mood[member.currentMood]} className={styles.mood} />
                                            </li>
                                        ))
                                    }
                                </ul>
                            }
                        </div>
                        {/* set due date */}
                        <div className={styles.dueDate}>
                            <label>Due date</label>
                            <div className={styles.inputField}>
                                <img className={styles.icon} src={calendar_svg} />
                                <SelectDate dueDate={dueDate} onChange={setDueDate} />
                            </div>
                        </div>
                    </div>

                    <div className={styles.taskOutcomes}>
                        {/* set bounty */}
                        <div className={styles.bounty}>
                            <label>Bounty</label>
                            <div className={styles.inputField}>
                                <img src={remove_svg} onClick={() => decreaseBounty()} />
                                <div className={styles.coins}>
                                    <img src={coin_svg} />
                                    <input type="number" value={bounty} onChange={(e) => {
                                        const val = e.target.value;
                                        setBounty(val < 1 ? 1 : val);
                                    }} />
                                </div>
                                <img src={add_svg} onClick={() => increaseBounty()} />
                            </div>
                        </div>
                        {/* set difficulty */}
                        <div className={styles.difficulty}>
                            <label>Difficulty</label>
                            <div className={styles.stars}>
                                {Array.from({ length: 5 }).map((_, index) => (
                                    <img key={index}
                                        src={index < difficulty ? difficultyOn_svg : difficultyOff_svg}
                                        onClick={() => handleStarClick(index)}
                                        className={styles.star} />
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className={styles.description}>
                        <label>Description</label>
                        <textarea onChange={(e) => setDescription(e.target.value)} />
                    </div>
                    <div className={styles.submission}>
                        <button type="submit">Create task</button>
                    </div>
                </form>
            </>)}
        </Modal>
    );
}


export function RestoreTask({ onClose, task }) {
    const [title, setTitle] = useState("");
    const [status, setStatus] = useState(null);
    const [assignee, setAssignee] = useState(null);
    const [dueDate, setDueDate] = useState(null);
    const [bounty, setBounty] = useState(1);
    const [difficulty, setDifficulty] = useState(1);
    const [description, setDescription] = useState("");

    const [members, setMembers] = useState([]);
    const [boards, seBoards] = useState([]);
    const [openDropdown, setOpenDropdown] = useState(null);
    const [searchValue, setSearchValue] = useState("");
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        setTitle(task.title);
        setStatus(null);
        setAssignee(null);
        setDueDate(null);
        setBounty(task.ethereum.assigned);
        setDifficulty(task.difficulty);
        setDescription(task.description);

        const fetchMembers = async () => {
            try {
                setLoading(true);
                const res = await axios.get(`http://localhost:5000/api/memberships/project/${task.project._id}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                });
                setMembers(res.data);
            } catch (err) {
                console.error("Failed to fetch members", err);
            } finally {
                setLoading(false);
            }
        };
        fetchMembers();

        const fetchBoards = async () => {
            try {
                setLoading(true);
                const res = await axios.get(`http://localhost:5000/api/boards/project/${task.project._id}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                });

                seBoards(res.data);
            } catch (err) {
                console.error("Failed to fetch boards", err);
            } finally {
                setLoading(false);
            }
        };
        fetchBoards();
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target))
                setOpenDropdown(null);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [openDropdown]);

    const handleSelectAssignee = (member) => {
        setAssignee(member);
        setOpenDropdown(null);
    };

    const handleSelectStatus = (status) => {
        setStatus(status);
        setOpenDropdown(null);
    };

    const increaseBounty = () => {
        setBounty((prev) => Number(prev) + 1);
    };

    const decreaseBounty = () => {
        setBounty((prev) => {
            const current = Number(prev);
            if (current - 1 === 0) return current;
            return current - 1;
        });
    };

    const handleStarClick = (index) => {
        setDifficulty(index + 1);
    };

    const remove = async (handleClose) => {
        try {
            setLoading(true);
            await axios.delete(`http://localhost:5000/api/archives/task/${task._id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });
            handleClose();
            toast.success("Task deleted permanently");
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const submit = async (handleClose) => {
        if (!title) {
            toast.error("Task title is required");
            return;
        }
        if (!assignee) {
            toast.error("Task Assignee is required");
            return;
        }
        if (!status) {
            toast.error("Status is required");
            return;
        }

        try {
            setLoading(true);
            const res = await axios.post(`http://localhost:5000/api/archives/restore/${task._id}`, {
                boardId: status._id,
                title: title,
                description: description,
                assigneeId: assignee._id,
                dueDate: dueDate,
                ethereum: bounty,
                difficulty: difficulty
            }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            })
            handleClose();
            navigate(`/task/${res.data._id}`);
            toast.success(`Task successfully restored`);
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal onClose={onClose}>
            {({ handleClose }) => (<>
                <div className={styles.loading} style={{ visibility: loading ? "visible" : "hidden" }}  >
                    <img src={loading_svg} />
                </div>
                <form onSubmit={(e) => { e.preventDefault(); submit(handleClose); }} style={{ visibility: loading ? "hidden" : "visible" }}>
                    <div className={styles.titlePane}>
                        <label>Task restoration</label>
                        <img src={close_svg} onClick={handleClose} />
                    </div>
                    <div className={styles.title}>
                        <label>Title</label>
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
                    </div>
                    {/* set up parents */}
                    <div className={styles.parents}>
                        <div className={styles.project}>
                            <label>Project</label>
                            <div className={styles.inputField}>
                                <div className={styles.projectImage}>
                                    <img src={task.project.projectImage.url} />
                                </div>
                                <input disabled value={task.project.name} />
                            </div>
                        </div>
                        <div className={styles.board} ref={dropdownRef}>
                            <label>Status</label>
                            <div className={styles.inputField} ref={openDropdown === "status" ? dropdownRef : null} onClick={() => setOpenDropdown(openDropdown === "status" ? null : "status")}>
                                <div className={styles.activeBoard}>
                                    <div className={styles.boardColor} style={{ backgroundColor: status?.color }} />
                                    <span>{status?.name}</span>
                                </div>
                                {
                                    openDropdown === "status" &&
                                    <ul className={styles.dropdown}>
                                        {
                                            boards.map(status => (
                                                <li key={status._id} className={styles.option} onClick={() => handleSelectStatus(status)}>
                                                    <div className={styles.boardColor} style={{ backgroundColor: status.color }} />
                                                    <span>{status.name}</span>
                                                </li>
                                            ))
                                        }
                                    </ul>
                                }
                            </div>
                        </div>
                    </div>
                    <div className={styles.taskInfo}>
                        {/* set assignee */}
                        <div className={styles.assignee} ref={openDropdown === "assignee" ? dropdownRef : null}>
                            <label>Assignee</label>
                            <div className={styles.inputField} onClick={() => { setOpenDropdown(openDropdown === "assignee" ? null : "assignee"); setSearchValue("") }}>
                                {
                                    assignee === null &&
                                    <div className={styles.activeMember}>
                                        <img className={styles.icon} src={assignee_svg} />
                                    </div>
                                }
                                {
                                    assignee &&
                                    <div className={styles.activeMember}>
                                        <div className={styles.profileImage}>
                                            <img src={assignee.profileImage.url} />
                                        </div>
                                        <span>{assignee.firstname} {assignee.lastname}</span>
                                        <img src={mood[assignee.currentMood]} className={styles.mood} />
                                    </div>
                                }
                            </div>
                            {
                                openDropdown === "assignee" &&
                                <ul className={styles.dropdown}>
                                    <div className={styles.searchField}>
                                        <img src={search_svg} />
                                        <input type="text" placeholder="Search member" onChange={(e) => setSearchValue(e.target.value)} />
                                    </div>
                                    {
                                        members.filter(member => {
                                            if (!searchValue) return true;
                                            const fullName = `${member.firstname} ${member.lastname}`.toLowerCase();
                                            return fullName.startsWith(searchValue.toLowerCase())
                                                || member.firstname.toLowerCase().startsWith(searchValue.toLowerCase())
                                                || member.lastname.toLowerCase().startsWith(searchValue.toLowerCase());
                                        }).map(member => (
                                            <li key={member._id} className={styles.option} onClick={() => handleSelectAssignee(member)}>
                                                <div className={styles.profileImage}>
                                                    <img src={member.profileImage.url} />
                                                </div>
                                                <span>{member.firstname} {member.lastname}</span>
                                                <img src={mood[member.currentMood]} className={styles.mood} />
                                            </li>
                                        ))
                                    }
                                </ul>
                            }
                        </div>
                        {/* set due date */}
                        <div className={styles.dueDate}>
                            <label>Due date</label>
                            <div className={styles.inputField}>
                                <img className={styles.icon} src={calendar_svg} />
                                <SelectDate dueDate={dueDate} onChange={setDueDate} />
                            </div>
                        </div>
                    </div>

                    <div className={styles.taskOutcomes}>
                        {/* set bounty */}
                        <div className={styles.bounty}>
                            <label>Bounty</label>
                            <div className={styles.inputField}>
                                <img src={remove_svg} onClick={() => decreaseBounty()} />
                                <div className={styles.coins}>
                                    <img src={coin_svg} />
                                    <input type="number" value={bounty} onChange={(e) => {
                                        const val = e.target.value;
                                        setBounty(val < 1 ? 1 : val);
                                    }} />
                                </div>
                                <img src={add_svg} onClick={() => increaseBounty()} />
                            </div>
                        </div>
                        {/* set difficulty */}
                        <div className={styles.difficulty}>
                            <label>Difficulty</label>
                            <div className={styles.stars}>
                                {Array.from({ length: 5 }).map((_, index) => (
                                    <img key={index}
                                        src={index < difficulty ? difficultyOn_svg : difficultyOff_svg}
                                        onClick={() => handleStarClick(index)}
                                        className={styles.star} />
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className={styles.description}>
                        <label>Description</label>
                        <textarea onChange={(e) => setDescription(e.target.value)} />
                    </div>
                    <div className={styles.decisionPane}>
                        <button type="button" className={styles.delete} onClick={() => remove(handleClose)}>
                            <img src={delete_svg} />
                        </button>
                        <button type="submit" className={styles.submission}>Restore</button>
                    </div>
                </form>
            </>)}
        </Modal>
    );
}
