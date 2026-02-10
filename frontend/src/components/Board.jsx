import styles from "../css/Board.module.scss";
import more_svg from "../assets/icons/more.svg";
import add_svg from "../assets/icons/add.svg";
import edit_svg from "../assets/icons/edit.svg";
import arrowLeft_svg from "../assets/icons/arrowLeft.svg";
import arrowRight_svg from "../assets/icons/arrowRight.svg";
import delete_svg from "../assets/icons/delete.svg";
import { Card } from "./Card";
import { useModal } from "../context/ModalContext";
import { useDroppable } from "@dnd-kit/core";
import Loading from "./Loading";
import { useEffect, useRef, useState } from "react";
import axios from "axios";

function Board({ board, tasks, role, totalBoards }) {
    const { openModal } = useModal();
    const [openDropdown, setOpenDropdown] = useState(false);
    const dropdownRef = useRef(null);
    const { setNodeRef } = useDroppable({ id: board._id });

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target))
                setOpenDropdown(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [openDropdown]);

    if (!board) return <Loading />

    const taskObj = {
        project: {
            _id: board.project._id,
            name: board.project.name,
            projectImage: board.project.projectImage
        },
        board: {
            _id: board._id,
            name: board.name,
            color: board.color
        }
    }

    const handleMoveLeft = async () => {
        const newPosition = board.position - 1;
        if (newPosition < 0) return;

        try {
            await axios.patch(`http://localhost:5000/api/boards/move/${board._id}`, {
                projectId: board.project._id,
                newPosition
            }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });
            setOpenDropdown(false);
        } catch (err) {
            console.error(err);
        }
    };

    const handleMoveRight = async () => {
        const newPosition = board.position + 1;
        if (newPosition >= totalBoards) return;

        try {
            await axios.patch(`http://localhost:5000/api/boards/move/${board._id}`, {
                projectId: board.project._id,
                newPosition
            }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });
            setOpenDropdown(false);
        } catch (err) {
            console.error(err);
        }
    };


    return (
        <section className={styles.board} ref={setNodeRef}>
            <div className={styles.boardInfo}
                style={role === "MEMBER" ? {
                    backgroundColor: "#121212",
                    border: "1px solid #181818",
                    marginBottom: "10px",
                } : undefined}>
                <div className={styles.color} style={{ backgroundColor: board.color }} />
                <h6>{board.name}</h6>
                <span>{tasks.length}</span>
                {
                    role !== "MEMBER" &&
                    <div className={`${styles.more} ${openDropdown ? styles.moreOpen : ""}`} ref={dropdownRef}>
                        <img src={more_svg} className={styles.moreIcon} onClick={() => setOpenDropdown(openDropdown ? false : true)} />
                        <ul className={`${styles.dropdown} ${openDropdown ? styles.dropdownOpen : styles.dropdownClosed}`}>
                            <li className={styles.option} onClick={() => { openModal("EDIT_BOARD", { project: taskObj.project, board }); setOpenDropdown(false) }}>
                                <img src={edit_svg} />
                                <span>Edit board</span>
                            </li>
                            <li className={styles.option} onClick={() => handleMoveLeft()}>
                                <img src={arrowLeft_svg} />
                                <span>Move left</span>
                            </li>
                            <li className={styles.option} onClick={() => handleMoveRight()}>
                                <img src={arrowRight_svg} />
                                <span>Move right</span>
                            </li>
                            <li className={`${styles.option} ${styles.delete}`} onClick={() => { openModal("DELETE_BOARD", { boardId: board._id }); setOpenDropdown(false) }}>
                                <img src={delete_svg} />
                                <span>Delete board</span>
                            </li>
                        </ul>
                    </div>
                }
            </div>
            <div className={styles.taskContainer}>
                {
                    (role === "OWNER" || role === "ADMIN") &&
                    <div className={styles.create} onClick={() => openModal("CREATE_TASK", {
                        project: taskObj.project,
                        board: taskObj.board
                    })}>
                        <img src={add_svg} />
                    </div>
                }
                {tasks.map(task => (
                    !task.closed &&
                    <div key={task._id} to={`/task/${task._id}`} className={styles.task}>
                        <Card task={task} status={board.name} />
                    </div>
                ))}
            </div>
        </section>
    )
}

export default Board;
