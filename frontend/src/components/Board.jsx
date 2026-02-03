import styles from "../css/Board.module.scss"
import more_svg from "../assets/icons/more.svg"
import add_svg from "../assets/icons/add.svg"
import { Card } from "./Card";
import { useModal } from "../context/ModalContext";
import { useDroppable } from "@dnd-kit/core";
import Loading from "./Loading";

function Board({ board, tasks, role }) {
    const { setNodeRef } = useDroppable({ id: board._id });
    const { openModal } = useModal();

    if (!board) return <Loading />

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
                    <img src={more_svg} />
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
