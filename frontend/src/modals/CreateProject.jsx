// CreateProject modal — first application of the Modal system
import Modal from "./Modal";
import { useState, useRef } from "react";
import styles from "./css/CreateProject.module.scss";
import close_svg from "../assets/icons/close.svg";
import loading_svg from "../assets/icons/loading.svg";
import toast from "react-hot-toast";
import axios from "axios";
import { useNavigate } from "react-router-dom";


export function CreateProject({ onClose }) {
    const [name, setName] = useState("");
    const [file, setFile] = useState(null);
    const [projectImage, setProjectImage] = useState("/assets/project.png");
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef();
    const navigate = useNavigate();

    const handleDivClick = () => fileInputRef.current.click();

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;
        setProjectImage(URL.createObjectURL(selectedFile));
        setFile(selectedFile);
    };

    const submit = async (handleClose) => {
        if (!name) { toast.error("Project name required"); return; }

        if (file) {
            if (file.size > 5 * 1024 * 1024) { toast.error("File is larger than 5 MB"); return; }
            if (file.type !== "image/png") { toast.error("Only PNG is allowed"); return; }
        }

        try {
            const formData = new FormData();
            formData.append("name", name);
            if (file) formData.append("image", file);

            setLoading(true);
            const res = await axios.post("/api/projects", formData, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });

            handleClose();
            navigate(`/project/${res.data._id}`);
            toast.success("Project created!");
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal onClose={onClose}>
            {({ handleClose }) => (
                <>
                    {/* Loading overlay — sits on top of form during API call */}
                    {loading && (
                        <div className={styles.loadingOverlay}>
                            <img src={loading_svg} alt="" />
                        </div>
                    )}

                    <form onSubmit={(e) => { e.preventDefault(); submit(handleClose); }}>

                        {/* Header */}
                        <div className={styles.header}>
                            <div className={styles.headerTitle}>
                                <h2>New project</h2>
                                <span>Project creation</span>
                            </div>
                            <button
                                type="button"
                                className={styles.closeButton}
                                onClick={handleClose}
                                aria-label="Close"
                            >
                                <img src={close_svg} alt="" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className={styles.body}>
                            <div className={styles.metaRow}>

                                {/* Image picker */}
                                <div className={styles.imagePicker} onClick={handleDivClick}>
                                    <img src={projectImage} alt="Project" />
                                </div>
                                <input
                                    type="file"
                                    accept="image/png"
                                    ref={fileInputRef}
                                    style={{ display: "none" }}
                                    onChange={handleFileChange}
                                />

                                {/* Name input */}
                                <div className={styles.nameGroup}>
                                    <label htmlFor="projectName">Project name</label>
                                    <input
                                        id="projectName"
                                        type="text"
                                        placeholder="e.g. BlackRock Q4"
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className={styles.footer}>
                            <p className={styles.footerHint}>
                                Boards and members can be added after creation.
                            </p>
                            <button
                                type="submit"
                                className={styles.submitButton}
                                disabled={loading}
                            >
                                Create project
                            </button>
                        </div>

                    </form>
                </>
            )}
        </Modal>
    );
}