import { useEffect, useState } from "react";
import styles from "./css/Modal.module.scss";

function Modal({ children, onClose }) {
    const [visibility, setVisibility] = useState(false);

    useEffect(() => {
        setVisibility(true);
    }, []);

    const handleClose = () => {
        setVisibility(false);
        setTimeout(onClose, 200);
    };

    return (
        <div className={`${styles.overlay} ${visibility ? styles.show : ""}`}>
            <div className={`${styles.modal} ${visibility ? styles.show : ""}`}>
                {typeof children === "function" ? children({ handleClose }) : children}
            </div>
        </div>
    );
}

export default Modal;
