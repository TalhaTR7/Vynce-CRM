import Modal from "./Modal";
import { useState, useRef } from "react";
import styles from "./css/CreateProject.module.scss";
import close_svg from "../../assets/icons/close.svg";
import toast from "react-hot-toast";
import axios from "axios";
import { useNavigate } from "react-router-dom";


function CreateProject({ onClose }) {
    const [name, setName] = useState("");
    const [file, setFile] = useState(null);
    const [projectImage, setProjectImage] = useState("/assets/project.png");
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
        const token = localStorage.getItem("token");
        try {
            if (!name) {
                toast.error("Project name required");
                return;
            }

            if (file) {
                const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
                if (file.size > MAX_FILE_SIZE) {
                    toast.error("File is larger than 5 MB");
                    return;
                }
                if (file.type !== "image/png") {
                    toast.error("Only PNG is allowed");
                    return;
                }
            }

            const formData = new FormData();
            formData.append("name", name);
            if (file) formData.append("image", file);

            const res = await axios.post("http://localhost:5000/api/projects", formData, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            handleClose();
            navigate(`/project/${res.data._id}`);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <Modal onClose={onClose}>
            {({ handleClose }) => (
                <>
                    <div className={styles.titlePane}>
                        <label>Project creation</label>
                        <img src={close_svg} onClick={handleClose} />
                    </div>

                    <div className={styles.meta}>
                        <div className={styles.projectImage} onClick={handleDivClick}>
                            <img src={projectImage} />
                        </div>
                        <input
                            type="file"
                            accept="image/png"
                            ref={fileInputRef}
                            style={{ display: "none" }}
                            onChange={handleFileChange} />
                        <div className={styles.projectName}>
                            <label>Project name</label>
                            <input onChange={e => setName(e.target.value)} required />
                        </div>
                    </div>
                    <div className={styles.submission}>
                        <span>Just one click away!</span>
                        <div className={styles.content}>
                            <p>Don't worry. You can create your boards after the creation of your project.</p>
                            <button onClick={() => submit(handleClose)}>Create project</button>
                        </div>
                    </div>
                </>
            )}
        </Modal>
    );
}

export default CreateProject;
