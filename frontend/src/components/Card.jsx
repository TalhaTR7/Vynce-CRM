import styles from "../css/Card.module.scss"
import coin_svg from "../assets/icons/coin.svg";
import points_svg from "../assets/icons/points.svg";
import clock_svg from "../assets/icons/clock.svg";
import difficultyOn_svg from "../assets/icons/difficultyOn.svg";
import difficultyOff_svg from "../assets/icons/difficultyOff.svg";
import comment_svg from "../assets/icons/comment.svg";
import archive_svg from "../assets/icons/archive.svg";
import { useDraggable } from "@dnd-kit/core";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useModal } from "../context/ModalContext";


export function Card({ task, status="...", isOverlay }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task._id });

    const style = {
        transform: transform
            ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
            : undefined,
        pointerEvents: isDragging ? "none" : "auto",
        opacity: isDragging ? 0.7 : 1,
        position: isDragging ? 'absolute' : 'relative',
        cursor: isOverlay ? "grabbing" : "grab"
    };

    let dueIn = null;
    if (task?.dueDate) {
        const due = new Date(task.dueDate);
        const now = new Date();
        const difference = Math.ceil((due - now) / (1000 * 60 * 60 * 24));

        if (difference === 0) dueIn = "today";
        else if (difference < 0) dueIn = "overdue";
        else dueIn = `${difference} day${difference > 1 ? "s" : ""}`;
    }

    const motivation = task.worktime * 2;

    return (
        <div className={styles.card} ref={setNodeRef} style={style} {...attributes}
            onPointerDown={(e) => {
                if (e.target.closest(`.${styles.title}`)) return;
                listeners.onPointerDown(e);
            }}
            onTouchStart={(e) => {
                if (e.target.closest(`.${styles.title}`)) return;
                listeners.onTouchStart(e);
            }} >
            <div className={styles.infoPane}>
                <p className={styles.status}>{status}</p>
                {dueIn && (
                    <div className={styles.daysleft}>
                        <img src={clock_svg} />
                        <p>{dueIn}</p>
                    </div>
                )}
            </div>
            <Link to={`/task/${task._id}`} className={styles.title} onDoubleClick={() => toast.success(1)}>{task.title}</Link>
            <div className={styles.difficulty}>
                {
                    [...Array(5)].map((_, index) => (
                        <img key={index} src={index < task.difficulty ? difficultyOn_svg : difficultyOff_svg} />
                    ))
                }
            </div>
            <div className={styles.taskDetails}>
                <div className={styles.assigneeInfo}>
                    <div className={styles.assignee}>
                        <img src={task.assignee.profileImage.url} />
                    </div>
                    <div className={styles.ethereum}>
                        <img src={coin_svg} />
                        <p>{task.ethereum.calculated}</p>
                    </div>
                    <div className={styles.motivation}>
                        <img src={points_svg} />
                        <p>{motivation}</p>
                    </div>
                </div>
                <div className={styles.comments}>
                    <img src={comment_svg} />
                    <p>{task.comments}</p>
                </div>
            </div>
        </div>
    )
}


export function ArchivedCard({ task, onClick, isSelected }) {
    const { openModal } = useModal();
    const motivation = task.worktime * 2;

    let dueIn = null;
    if (task?.dueDate) {
        const due = new Date(task.dueDate);
        const now = new Date();
        const difference = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
        if (difference === 0) dueIn = "today";
        else if (difference < 0) dueIn = "overdue";
        else dueIn = `${difference} day${difference > 1 ? "s" : ""}`;
    }

    return (
        <div className={`${styles.archive} ${isSelected ? styles.selected : ""}`} onClick={onClick} onContextMenu={(e) => { openModal("RESTORE_TASK", { task: task }); e.preventDefault() }}>
            <div className={styles.infoPane}>
                <div className={styles.project}>
                    <div className={styles.projectImage}>
                        <img src={task.project.projectImage.url} />
                    </div>
                    <p>{task.project.name}</p>
                </div>
                <div className={styles.comments}>
                    <img src={comment_svg} />
                    <p>{task.comments}</p>
                </div>
            </div>
            <h5 className={styles.title}>{task.title}</h5>
            <div className={styles.taskInfo}>
                <div className={styles.difficulty}>
                    {
                        [...Array(5)].map((_, index) => (
                            <img key={index} src={index < task.difficulty ? difficultyOn_svg : difficultyOff_svg} />
                        ))
                    }
                </div>
                <div className={styles.misc}>
                    <div className={styles.ethereum}>
                        <img src={coin_svg} />
                        <p>{task.ethereum.assigned}</p>
                    </div>
                    <div className={styles.motivation}>
                        <img src={points_svg} />
                        <p>{motivation}</p>
                    </div>
                    <img src={archive_svg} className={styles.archive} />
                </div>
            </div>
        </div>
    );
}

export default Card;