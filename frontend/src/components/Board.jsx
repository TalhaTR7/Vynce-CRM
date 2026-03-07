// Kanban board column
import styles from "./css/Board.module.scss";
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

    /* Close dropdown on outside click */
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target))
                setOpenDropdown(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!board) return <Loading />;

    const isAuthorized = role === "OWNER" || role === "ADMIN";

    const taskObj = {
        project: {
            _id: board.project._id,
            name: board.project.name,
            projectImage: board.project.projectImage,
        },
        board: {
            _id: board._id,
            name: board.name,
            color: board.color,
        },
    };

    const handleMoveLeft = async () => {
        const newPosition = board.position - 1;
        if (newPosition < 0) return;
        try {
            await axios.patch(`/api/boards/move/${board._id}`, {
                projectId: board.project._id, newPosition,
            }, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
            setOpenDropdown(false);
        } catch (err) { console.error(err); }
    };

    const handleMoveRight = async () => {
        const newPosition = board.position + 1;
        if (newPosition >= totalBoards) return;
        try {
            await axios.patch(`/api/boards/move/${board._id}`, {
                projectId: board.project._id, newPosition,
            }, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
            setOpenDropdown(false);
        } catch (err) { console.error(err); }
    };


    return (
        <section className={styles.board} ref={setNodeRef}>

            {/* ── Board header ───────────────────────────────── */}
            <div className={styles.boardHeader} style={{ background: !isAuthorized && "#ffffff05" }}>
                <div className={styles.boardColorDot}
                    style={{ backgroundColor: board.color }} />
                <h6 className={styles.boardName}>{board.name}</h6>
                {tasks.length > 0 && <span className={styles.boardTaskCount}>{tasks.length}</span>}

                {isAuthorized && (
                    <div
                        className={`${styles.boardMoreButton} ${openDropdown ? styles.boardMoreButtonActive : ""}`}
                        ref={dropdownRef}
                        onClick={() => setOpenDropdown(prev => !prev)}
                        role="button"
                        aria-label="Board options">
                        <img src={more_svg} className={styles.boardMoreIcon} />

                        {/* Dropdown */}
                        <ul className={`${styles.dropdown} ${openDropdown ? styles.dropdownOpen : styles.dropdownClosed}`}>
                            <li className={styles.dropdownOption}
                                onClick={() => {
                                    setOpenDropdown(false);
                                    openModal("EDIT_BOARD", {
                                        project: taskObj.project,
                                        board
                                    });
                                }}>
                                <img src={edit_svg} className={styles.dropdownOptionIcon} />
                                <span className={styles.dropdownOptionLabel}>Edit board</span>
                            </li>
                            <li className={styles.dropdownOption} onClick={handleMoveLeft}>
                                <img src={arrowLeft_svg} className={styles.dropdownOptionIcon} />
                                <span className={styles.dropdownOptionLabel}>Move left</span>
                            </li>
                            <li className={styles.dropdownOption} onClick={handleMoveRight}>
                                <img src={arrowRight_svg} className={styles.dropdownOptionIcon} />
                                <span className={styles.dropdownOptionLabel}>Move right</span>
                            </li>
                            <div className={styles.dropdownDivider} />
                            <li className={`${styles.dropdownOption} ${styles.dropdownOptionDestructive}`}
                                onClick={() => {
                                    openModal("DELETE_BOARD", { boardId: board._id });
                                    setOpenDropdown(false);
                                }}>
                                <img src={delete_svg} className={styles.dropdownOptionIcon} />
                                <span className={styles.dropdownOptionLabel}>Delete board</span>
                            </li>
                        </ul>
                    </div>
                )}
            </div>

            {/* ── Task list ──────────────────────────────────── */}
            <div className={styles.taskContainer}>

                {/* Add task button — elevated roles only */}
                {isAuthorized && (
                    <button
                        className={styles.createTaskButton}
                        onClick={() => openModal("CREATE_TASK", {
                            project: taskObj.project,
                            board: taskObj.board
                        })}>
                        <img src={add_svg} />
                        <span>Add task</span>
                    </button>
                )}

                {tasks.map(task => !task.closed && (
                    <div key={task._id} className={styles.taskWrapper}>
                        <Card task={task} status={board.name} />
                    </div>
                ))}
            </div>

        </section >
    );
}

export default Board;