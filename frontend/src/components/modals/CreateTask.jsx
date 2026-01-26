import Modal from "./Modal";
import { useState, useRef, useEffect } from "react";
import close_svg from "../../assets/icons/close.svg";
import calendar_svg from "../../assets/icons/calendar.svg";
import assignee_svg from "../../assets/icons/assignee.svg";
import search_svg from "../../assets/icons/search.svg";
import coin_svg from "../../assets/icons/coin.svg";
import add_svg from "../../assets/icons/add.svg";
import remove_svg from "../../assets/icons/remove.svg";
import difficultyOn_svg from "../../assets/icons/difficultyOn.svg";
import difficultyOff_svg from "../../assets/icons/difficultyOff.svg";
import toast from "react-hot-toast";
import axios from "axios";
import styles from "./css/CreateTask.module.scss";
import SelectDate from "../SelectDate";
import { useNavigate } from "react-router-dom";

import angry_emoji from "../../assets/moods/angry.svg";
import exhausted_emoji from "../../assets/moods/exhausted.svg";
import sick_emoji from "../../assets/moods/sick.svg";
import sad_emoji from "../../assets/moods/sad.svg";
import normal_emoji from "../../assets/moods/normal.svg";
import okay_emoji from "../../assets/moods/okay.svg";
import vibing_emoji from "../../assets/moods/vibing.svg";
import happy_emoji from "../../assets/moods/happy.svg";
import chilling_emoji from "../../assets/moods/chilling.svg";


function CreateTask({ onClose, project, board }) {
    const [title, setTitle] = useState("");
    const [dueDate, setDueDate] = useState(null);
    const [bounty, setBounty] = useState(1);
    const [difficulty, setDifficulty] = useState(1);
    const [description, setDescription] = useState("");
    const [members, setMembers] = useState([]);
    const [searchValue, setSearchValue] = useState("");

    const dropdownRef = useRef(null);
    const [isOpen, setIsOpen] = useState(false);
    const [assignee, setAssignee] = useState(null);
    const navigate = useNavigate();

    const toggleDropdown = () => setIsOpen(!isOpen);

    const handleSelect = (member) => {
        setAssignee(member);
        setIsOpen(false);
    };

    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/memberships/project/${project._id}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                });

                setMembers(res.data);
            } catch (err) {
                console.error("Failed to fetch members", err);
            }
        };
        fetchMembers();
        setAssignee(null);
    }, [project._id]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target))
                setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);


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
        console.log(project._id, board._id, title, dueDate, bounty, difficulty, description);
        if (!title) {
            toast.error("Task title is required");
            return;
        }
        if (!assignee) {
            toast.error("Task Assignee is required");
            return;
        }

        try {
            const res = await axios.post("http://localhost:5000/api/tasks/create", {
                projectId: project._id,
                boardId: board._id,
                title: title,
                description: description,
                assigneeId: assignee._id,
                dueDate: dueDate,
                ethereum: bounty
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
        }
    };

    return (
        <Modal onClose={onClose}>
            {({ handleClose }) => (
                <form onSubmit={(e) => { e.preventDefault(); submit(handleClose); }}>
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
                                    <img src={project.image} />
                                </div>
                                <input disabled value={project.name} />
                            </div>
                        </div>
                        <div className={styles.board}>
                            <label>Status</label>
                            <div className={styles.inputField}>
                                <div className={styles.boardColor} style={{ backgroundColor: board.color }} />
                                <input disabled value={board.name} />
                            </div>
                        </div>
                    </div>

                    <div className={styles.taskInfo}>
                        {/* set assignee */}
                        <div className={styles.assignee} ref={dropdownRef}>
                            <label>Assignee</label>
                            <div className={styles.inputField} onClick={toggleDropdown}>
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
                                isOpen &&
                                <ul className={styles.dropdown}>
                                    <div className={styles.searchField}>
                                        <img src={search_svg} />
                                        <input type="text"
                                            placeholder="Search member"
                                            onChange={(e) => setSearchValue(e.target.value)} />
                                    </div>
                                    {
                                        members.filter(member => {
                                            if (!searchValue) return true;
                                            const fullName = `${member.firstname} ${member.lastname}`.toLowerCase();
                                            return fullName.startsWith(searchValue.toLowerCase())
                                                || member.firstname.toLowerCase().startsWith(searchValue.toLowerCase())
                                                || member.lastname.toLowerCase().startsWith(searchValue.toLowerCase());
                                        }).map(member => (
                                            <li key={member._id} className={styles.option} onClick={() => handleSelect(member)}>
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
            )}
        </Modal>
    );
}

export default CreateTask;
