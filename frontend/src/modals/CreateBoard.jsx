// CreateBoard + EditBoard modals
import Modal from "./Modal";
import { useState, useEffect } from "react";
import styles from "./css/CreateBoard.module.scss";
import close_svg from "../assets/icons/close.svg";
import loading_svg from "../assets/icons/loading.svg";
import toast from "react-hot-toast";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { HexColorPicker } from "react-colorful";


const DEFAULT_COLORS = [
    "#cccccc", "#00FFFF", "#00ff00", "#FF0000", "#9900FF", "#006633", "#99cc66",
    "#FF6600", "#FFC000", "#FF0066", "#0077FF", "#00ffaa", "#444444", "#ffffff",
];


/* ── Shared form used by both CreateBoard and EditBoard ────────────── */
function BoardForm({ project, modalTitle, boardName = "", color = "#cccccc", submit, buttonText, handleClose }) {
    const [name, setName] = useState(boardName);
    const [selectedColor, setSelectedColor] = useState(color);

    useEffect(() => {
        setName(boardName);
        setSelectedColor(color);
    }, [boardName, color]);

    return (
        <form
            style={{ position: "relative" }}
            onSubmit={(e) => {
                e.preventDefault();
                submit(handleClose, {
                    name,
                    color: selectedColor
                });
            }}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerTitle}>
                    <h2>{modalTitle === "Board creation" ? "New board" : "Edit board"}</h2>
                    <span>{modalTitle}</span>
                </div>
                <button type="button" className={styles.closeButton} onClick={handleClose} aria-label="Close">
                    <img src={close_svg} alt="" />
                </button>
            </div>

            {/* Body */}
            <div className={styles.body}>

                {/* Board name */}
                <div className={styles.fieldGroup}>
                    <label htmlFor="boardName">Board name</label>
                    <input
                        id="boardName"
                        type="text"
                        value={name}
                        placeholder="e.g. In Progress"
                        onChange={(e) => setName(e.target.value)}
                        required />
                </div>

                {/* Color */}
                <div className={styles.colorSection}>
                    <span className={styles.colorSectionLabel}>Color</span>

                    {/* Preset swatches */}
                    <div className={styles.colorGrid}>
                        {DEFAULT_COLORS.map((c) => (
                            <div
                                key={c}
                                className={`${styles.colorSwatch} ${selectedColor === c ? styles.colorSwatchActive : ""}`}
                                onClick={() => setSelectedColor(c)}
                                style={{
                                    backgroundColor: c,
                                    transform: selectedColor === c ? "scale(1.18)" : ''
                                }} />
                        ))}
                    </div>

                    {/* Custom picker */}
                    <div className={styles.pickerContainer}>
                        <HexColorPicker color={selectedColor} onChange={setSelectedColor} />
                    </div>

                    {/* Selected color preview */}
                    <div className={styles.colorPreview}>
                        <span className={styles.colorPreviewHex}>{selectedColor}</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className={styles.footer}>
                <div className={styles.footerProject}>
                    <div className={styles.footerProjectThumb}>
                        <img src={project.projectImage.url} alt={project.name} />
                    </div>
                    <div className={styles.footerProjectMeta}>
                        <span>Board for</span>
                        <p>{project.name}</p>
                    </div>
                </div>
                <button type="submit" className={styles.submitButton}>{buttonText}</button>
            </div>
        </form>
    );
}


/* ── CreateBoard ───────────────────────────────────────────────────── */
export function CreateBoard({ onClose, project }) {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const submit = async (handleClose, { name, color }) => {
        try {
            if (!name) { toast.error("Board name required"); return; }
            setLoading(true);
            await axios.post("/api/boards/board", { projectId: project._id, name, color }, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            handleClose();
            navigate(`/project/${project._id}`);
            toast.success("Board created!");
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal onClose={onClose}>
            {({ handleClose }) => (
                <>
                    {loading && (
                        <div className={styles.loadingOverlay}>
                            <img src={loading_svg} alt="" />
                        </div>
                    )}
                    <BoardForm
                        handleClose={handleClose}
                        project={project}
                        modalTitle="Board creation"
                        submit={submit}
                        buttonText="Create board" />
                </>
            )}
        </Modal>
    );
}


/* ── EditBoard ─────────────────────────────────────────────────────── */
export function EditBoard({ onClose, project, board }) {
    const [loading, setLoading] = useState(false);

    const submit = async (handleClose, { name, color }) => {
        try {
            if (!name) { toast.error("Board name required"); return; }
            setLoading(true);
            await axios.patch(`/api/boards/board/${board._id}`, { projectId: project._id, name, color }, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            handleClose();
            toast.success("Board updated!");
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal onClose={onClose}>
            {({ handleClose }) => (
                <>
                    {loading && (
                        <div className={styles.loadingOverlay}>
                            <img src={loading_svg} alt="" />
                        </div>
                    )}
                    <BoardForm
                        handleClose={handleClose}
                        project={project}
                        modalTitle="Board editing"
                        boardName={board.name}
                        color={board.color}
                        submit={submit}
                        buttonText="Save changes" />
                </>
            )}
        </Modal>
    );
}