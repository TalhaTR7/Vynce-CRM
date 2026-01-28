import show_svg from "../../assets/icons/show.svg";
import hide_svg from "../../assets/icons/hide.svg";
import { Dialogue } from "./Modal";
import { useNavigate } from "react-router-dom";
import styles from "./css/dialogues.module.scss";
import { useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";

export function Logout({ onClose }) {
    const navigate = useNavigate();
    const handleLogout = (handleClose) => {
        handleClose();
        localStorage.removeItem("token");
        navigate("/");
    }
    return (
        <Dialogue onClose={onClose}>
            {({ handleClose }) => (
                <>
                    <div className={styles.title}>
                        <p>Taking some air</p>
                    </div>
                    <p className={styles.message}>You sure you wanna logout?</p>
                    <div className={styles.buttons}>
                        <button className={styles.secondary} onClick={handleClose}>Cancel</button>
                        <button className={styles.primaryGreen} onClick={() => handleLogout(handleClose)}>Logout</button>
                    </div>
                </>
            )}
        </Dialogue>
    )
}

export function UpdatePassword({ onClose }) {

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const submit = async (handleClose) => {
        if (newPassword !== confirmPassword) {
            toast.error("New passwords do not match");
            return;
        }
        else if (newPassword.length < 5) {
            toast.error("Password must be longer than 5 characters");
            return;
        }
        else if (currentPassword === newPassword) {
            toast.error("Cannot update to same password");
            return;
        }
        else try {
            const res = await axios.patch("http://localhost:5000/api/users/user/change-password", {
                currentPassword,
                newPassword
            }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            })

            if (res.data.token) localStorage.setItem("token", res.data.token);

            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            handleClose();

            toast.success("Password updated successfully");
        } catch (err) {
            console.error(err);
            toast.error(err.response.data.msg || "Something went wrong");
        }
    }

    return (
        <Dialogue onClose={onClose}>
            {({ handleClose }) => (
                <>
                    <div className={styles.title}>
                        <p>Updating password</p>
                    </div>
                    <form className={styles.passwordForm}>
                        <div className={styles.passwordField}>
                            <label>Current password</label>
                            <div className={styles.wrapper}>
                                <input
                                    type={showCurrent ? "text" : "password"}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)} />
                                <img src={showCurrent ? show_svg : hide_svg} onClick={() => setShowCurrent((prev) => !prev)} />
                            </div>
                        </div>
                        <div className={styles.passwordField}>
                            <label>New password</label>
                            <div className={styles.wrapper}>
                                <input
                                    type={showNew ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)} />
                                <img src={showNew ? show_svg : hide_svg} onClick={() => setShowNew((prev) => !prev)} />
                            </div>
                        </div>
                        <div className={styles.passwordField}>
                            <label>Confirm password</label>
                            <div className={styles.wrapper}>
                                <input
                                    type={showConfirm ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)} />
                                <img src={showConfirm ? show_svg : hide_svg} onClick={() => setShowConfirm((prev) => !prev)} />
                            </div>
                        </div>
                    </form>
                    <div className={styles.buttons}>
                        <button className={styles.secondary} onClick={handleClose}>Cancel</button>
                        <button className={styles.primaryGreen} onClick={() => submit(handleClose)}>Done</button>
                    </div>
                </>
            )}
        </Dialogue>
    )
}

export function DeleteAccount({ onClose, user }) {

    const [confirmation, setConfirmation] = useState(false);
    const [fieldName, setFieldName] = useState("");
    const navigate = useNavigate();

    const handleDelete = async (handleClose) => {
        if (!confirmation) {
            toast.error("Confirmation required to continue");
            return;
        }

        const fullname = `${user.firstname.trim()}-${user.lastname.trim()}`;
        if (fieldName.trim() !== fullname) {
            toast.error("Confirmation string doesn't match.");
            return;
        }

        try {
            await axios.delete("http://localhost:5000/api/users/user/", {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });

            handleClose();
            toast.success("Account deleted successfully");
            localStorage.removeItem("token");
            navigate("/");
        } catch (err) {
            console.log(err);
            toast.error(err.response.data.msg);
        }
    }


    return (
        <Dialogue onClose={onClose}>
            {({ handleClose }) => (
                <>
                    <div className={styles.title}>
                        <p>Heads up!</p>
                    </div>
                    <div className={styles.checkboxContainer}>
                        <div className={styles.checkboxes}>
                            <input type="checkbox"
                                id="confirmation"
                                className={styles.checkbox}
                                checked={confirmation}
                                onChange={() => setConfirmation(prev => !prev)} />
                            <label htmlFor="confirmation" className={styles.checkmark}>
                                I understand that deleting my account will permanently erase all my progress and achievements.
                            </label>
                        </div>
                    </div>
                    <div className={styles.inputField}>
                        <p>Type "{user.firstname}-{user.lastname}" to confirm</p>
                        <input type="text" onChange={(e) => setFieldName(e.target.value)} />
                    </div>
                    <div className={styles.buttons}>
                        <button className={styles.primaryRed} onClick={() => handleDelete(handleClose)}>Delete</button>
                    </div>
                </>
            )}
        </Dialogue>
    )
}

export function FindMember({ onClose }) {
    const navigate = useNavigate();

    const submit = (handleClose) => {
        handleClose();
        localStorage.removeItem("token");
        navigate("/");
    }
    return (
        <Dialogue onClose={onClose}>
            {({ handleClose }) => (
                <>
                    <div className={styles.title}>
                        <p>Taking some air</p>
                    </div>
                    <p className={styles.message}>You sure you wanna logout?</p>
                    <div className={styles.buttons}>
                        <button className={styles.secondary} onClick={handleClose}>Cancel</button>
                        <button className={styles.primaryGreen} onClick={() => handleLogout(handleClose)}>Logout</button>
                    </div>
                </>
            )}
        </Dialogue>
    )
}