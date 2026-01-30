import styles from "../css/Board.module.scss"
import more_svg from "../assets/icons/more.svg"
import add_svg from "../assets/icons/add.svg"
import { Card } from "./Card";
import { useModal } from "../context/ModalContext";
import { useDroppable } from "@dnd-kit/core";

function Board({ board, tasks, role }) {
    const { setNodeRef } = useDroppable({ id: board._id});
    const { openModal } = useModal();

    if (!board) return <p>Loading board...</p>;


    const taskObj = {
        project: {
            _id: board.project._id,
            name: board.project.name,
            image: board.project.projectImage.url
        },
        board: {
            _id: board._id,
            name: board.name,
            color: board.color
        }
    }

    return (
        <section className={styles.board} ref={setNodeRef}>
            <div className={styles.boardInfo}>
                <div className={styles.color} style={{ backgroundColor: board.color }} />
                <h6>{board.name}</h6>
                <p>{tasks.length}</p>
                {
                    (role === "OWNER" || role === "ADMIN") &&
                    <img src={more_svg} />
                }
            </div>
            {
                role === "MEMBER" &&
                <div className={styles.boardColor} style={{ backgroundColor: board.color }} />
            }
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
                        <Card task={task} />
                    </div>
                ))}
            </div>
        </section>
    )
}

export default Board;
