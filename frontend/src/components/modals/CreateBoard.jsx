import Modal from "./Modal";
import { useState, useEffect } from "react";
import styles from "./css/CreateBoard.module.scss";
import close_svg from "../../assets/icons/close.svg";
import loading_svg from "../../assets/icons/loading.svg";
import toast from "react-hot-toast";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { HexColorPicker } from "react-colorful";


const DEFAULT_COLORS = ["#cccccc", "#00FFFF", "#00ff00",
    "#FF0000", "#9900FF", "#006633",
    "#99cc66", "#FF6600", "#FFC000",
    "#FF0066", "#0077FF", "#00ffaa",
    "#444444", "#ffffff"];


function Base({ project, modalTitle, boardName = "", color = "#ccc", submit, buttonText, handleClose, visibility }) {
    const [name, setName] = useState("");
    const [colors, setColors] = useState(DEFAULT_COLORS);
    const [selectedColor, setSelectedColor] = useState(DEFAULT_COLORS[0]);

    useEffect(() => {
        setColors(DEFAULT_COLORS);
        setName(boardName);
        setSelectedColor(color);
    }, [boardName, color]);

    const handleColorClick = (hex) => { setSelectedColor(hex) };

    const handleCustomColorChange = (hex) => {
        setSelectedColor(hex);
    };

    return (
        <form onSubmit={(e) => {
            e.preventDefault();
            submit(handleClose, { name, color: selectedColor });
        }} style={{ visibility: visibility }}>
            <div className={styles.titlePane}>
                <label>{modalTitle}</label>
                <img src={close_svg} onClick={handleClose} />
            </div>
            <div className={styles.boardName}>
                <label>Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className={styles.bottomPane}>
                <label>Color</label>
                <div className={styles.colorGrid}>
                    {colors.map((color) => (
                        <div
                            key={color}
                            className={`${styles.colorCircle} ${selectedColor === color ? styles.active : ""}`}
                            style={{ backgroundColor: color }}
                            onClick={() => handleColorClick(color)}
                        />
                    ))}
                </div>
                <div className={styles.pickerContainer}>
                    <HexColorPicker color={selectedColor} onChange={handleCustomColorChange} />
                </div>
            </div>
            <div className={styles.submission}>
                <div className={styles.project}>
                    <div className={styles.projectImage}>
                        <img src={project.projectImage.url} />
                    </div>
                    <div className={styles.content}>
                        <span>Board for</span>
                        <p>{project.name}</p>
                    </div>
                </div>
                <button type="submit">{buttonText}</button>
            </div>
        </form>
    );
}


export function CreateBoard({ onClose, project }) {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const submit = async (handleClose, { name, color }) => {
        const token = localStorage.getItem("token");
        try {
            if (!name) {
                toast.error("Board name required");
                return;
            }

            setLoading(true);
            await axios.post("http://localhost:5000/api/boards/board", {
                projectId: project._id,
                name,
                color
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            handleClose();
            navigate(`/project/${project._id}`);
            toast.success(`Board successfully created`);
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.msg);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Modal onClose={onClose}>
            {({ handleClose }) => (<>
                <div className={styles.loading} style={{ visibility: loading ? "visible" : "hidden" }}  >
                    <img src={loading_svg} />
                </div>
                <Base
                    handleClose={handleClose}
                    project={project}
                    modalTitle={"Board creation"}
                    submit={submit}
                    buttonText={"Create board"}
                    visibility={loading ? "hidden" : "visible"}
                />
            </>)}
        </Modal>
    );
}


export function EditBoard({ onClose, project, board }) {
    const [loading, setLoading] = useState(false);

    const submit = async (handleClose, { name, color }) => {
        const token = localStorage.getItem("token");
        try {
            if (!name) {
                toast.error("Board name required");
                return;
            }
            setLoading(true);
            await axios.patch(`http://localhost:5000/api/boards/board/${board._id}`, {
                projectId: project._id,
                name,
                color
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            handleClose();
            toast.success(`Board successfully created`);
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.msg);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Modal onClose={onClose}>
            {({ handleClose }) => (<>
                <div className={styles.loading} style={{ visibility: loading ? "visible" : "hidden" }}  >
                    <img src={loading_svg} />
                </div>
                <Base
                    handleClose={handleClose}
                    project={project}
                    modalTitle={"Board editing"}
                    boardName={board.name}
                    color={board.color}
                    submit={submit}
                    buttonText={"Save"}
                    visibility={loading ? "hidden" : "visible"}
                />
            </>)}
        </Modal>
    );
}

