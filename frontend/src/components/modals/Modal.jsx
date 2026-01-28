import { useEffect, useRef, useState } from "react";
import styles from "./css/Modal.module.scss";

function Base({ children, onClose, className, closeOnOverlay=false }) {
    const [visibility, setVisibility] = useState(false);
    const contentRef = useRef(null);

    useEffect(() => {
        requestAnimationFrame(() => {
            setVisibility(true);
        });
    }, []);

    const handleClose = () => {
        setVisibility(false);
        setTimeout(onClose, 200);
    };

    const handleOverlayClick = (e) => {
        if (!closeOnOverlay) return;
        if (contentRef.current && !contentRef.current.contains(e.target)) {
            handleClose();
        }
    };


    return (
        <div className={`${styles.overlay} ${visibility ? styles.show : ""}`} onMouseDown={handleOverlayClick}>
            <div className={`${className} ${visibility ? styles.show : ""}`} ref={contentRef} onMouseDown={(e) => e.stopPropagation()}>
                {typeof children === "function" ? children({ handleClose }) : children}
            </div>
        </div>
    );
}

export function Popover({ children, onClose }) {
    return <Base children={children} onClose={onClose} className={styles.popover} closeOnOverlay />;
}

export function Popup({ children, onClose }) {
    return <Base children={children} onClose={onClose} className={styles.popup} />;
}

export function Dialogue({ children, onClose }) {
    return <Base children={children} onClose={onClose} className={styles.dialogue} closeOnOverlay />;
}

export default function Modal({ children, onClose }) {
    return <Base children={children} onClose={onClose} className={styles.modal} />;
}
