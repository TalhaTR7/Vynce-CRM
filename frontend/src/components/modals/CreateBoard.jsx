import Modal from "./Modal";
import { useState, useRef, useEffect } from "react";
import styles from "./css/CreateBoard.module.scss";
import close_svg from "../../assets/icons/close.svg";
import toast from "react-hot-toast";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { HexColorPicker } from "react-colorful";


const DEFAULT_COLORS = ["#cccccc", "#00FFFF", "#00ff00",
    "#FF0000", "#9900FF", "#006633",
    "#99cc66", "#FF6600", "#FFC000",
    "#FF0066", "#0077FF", "#00ffaa",
    "#444444", "#ffffff"];

function CreateBoard({ onClose, project }) {
    const [name, setName] = useState("");
    const [colors, setColors] = useState(DEFAULT_COLORS);
    const [selectedColor, setSelectedColor] = useState(DEFAULT_COLORS[0]);
    const navigate = useNavigate();

    useEffect(() => setColors(DEFAULT_COLORS), []);

    const handleColorClick = (hex) => { setSelectedColor(hex) };

    const handleCustomColorChange = (hex) => {
        setSelectedColor(hex);
    };

    const submit = async (handleClose) => {
        const token = localStorage.getItem("token");
        try {
            if (!name) {
                toast.error("Board name required");
                SVGAnimateTransformElement
                return;
            }

            await axios.post("http://localhost:5000/api/boards/create", {
                projectId: project._id,
                name,
                color: selectedColor || "#cccccc"
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
        }
    };

    return (
        <Modal onClose={onClose}>
            {({ handleClose }) => (
                <>
                    <div className={styles.titlePane}>
                        <label>Board creation</label>
                        <img src={close_svg} onClick={handleClose} />
                    </div>
                    <div className={styles.boardName}>
                        <label>Name</label>
                        <input onChange={e => setName(e.target.value)} required />
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
                                <img src={project.image} />
                            </div>
                            <div className={styles.content}>
                                <span>Board for</span>
                                <p>{project.name}</p>
                            </div>
                        </div>
                        <button onClick={() => submit(handleClose)}>Create board</button>
                    </div>
                </>
            )}
        </Modal>
    );
}

export default CreateBoard;
