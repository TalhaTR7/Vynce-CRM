import styles from "../css/Card.module.scss"
import coin_svg from "../assets/icons/coin.svg";
import clock_svg from "../assets/icons/clock.svg";
import comment_svg from "../assets/icons/comment.svg";
import { useDraggable } from "@dnd-kit/core";
import { Link } from "react-router-dom";


export function Card({ task, isOverlay }) {
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

    const comment_count = task?.activity?.filter(action => action.type === "COMMENT").length || 0;

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
            <div className={styles.projectInfo}>
                <div className={styles.projectImage}>
                    <img src={task.project.projectImage.url} />
                </div>
                <p>{task.project.name}</p>
            </div>
            <Link to={`/task/${task._id}`} className={styles.title}>{task.title}</Link>
            <div className={styles.taskDetails}>
                <div className={styles.left}>
                    <div className={styles.assignee}>
                        <img src={task.assignee.profileImage.url} />
                    </div>
                    <div className={styles.ethereum}>
                        <img src={coin_svg} />
                        <p>{task.ethereum.calculated}</p>
                    </div>
                </div>
                <div className={styles.right}>
                    {dueIn && (
                        <div className={styles.daysleft}>
                            <img src={clock_svg} />
                            <p>{dueIn}</p>
                        </div>
                    )}
                    <div className={styles.comments}>
                        <img src={comment_svg} />
                        <p>{comment_count}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Card;