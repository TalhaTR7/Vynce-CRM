import show_svg from "../../assets/icons/show.svg";
import hide_svg from "../../assets/icons/hide.svg";
import { Dialogue } from "./Modal";
import { useNavigate } from "react-router-dom";
import styles from "./css/dialogues.module.scss";
import { useEffect, useState } from "react";
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
                    <div className={styles.inputField} style={{ margin: 0 }}>
                        <label>Type "{user.firstname}-{user.lastname}" to confirm</label>
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

export function FindUser({ onClose }) {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");

    const submit = async (handleClose) => {
        try {
            const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };

            const { data: user } = await axios.get(`http://localhost:5000/api/users/email/${email}`,
                { headers: headers }
            );

            const res = await axios.post(`http://localhost:5000/api/messages/user/${user._id}`,
                { content: "" },
                { headers: headers }
            );
            const chat = res.data.chat;

            navigate(`/chat/${chat._id}`);
            handleClose();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.msg || err.message);
        }
    };

    return (
        <Dialogue onClose={onClose}>
            {({ handleClose }) => (
                <>
                    <div className={styles.title}>
                        <p>Find someone</p>
                    </div>
                    <div className={styles.inputField}>
                        <label className={styles.message}>Find a Vynce user by email</label>
                        <input type="text" onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className={styles.buttons}>
                        <button className={styles.secondary} onClick={handleClose}>Cancel</button>
                        <button className={styles.primaryGreen} onClick={() => submit(handleClose)}>Open DM</button>
                    </div>
                </>
            )}
        </Dialogue>
    )
}

export function SubmitTask({ onClose, task }) {

    const submit = async (handleClose) => {
        try {
            await axios.patch(`http://localhost:5000/api/tasks/task/submit`, { taskId: task._id }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });
            handleClose();
            toast.success("Task submitted");
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.msg || err.message);
        }
    };

    return (
        <Dialogue onClose={onClose}>
            {({ handleClose }) => (
                <>
                    <div className={styles.title}>
                        <p>Submitting the task</p>
                    </div>
                    <p className={styles.message}>Send the task up for a review and get rewarded after it gets closed</p>
                    <div className={styles.buttons}>
                        <button className={styles.secondary} onClick={handleClose}>Cancel</button>
                        <button className={styles.primaryBlue} onClick={() => submit(handleClose)}>Submit</button>
                    </div>
                </>
            )}
        </Dialogue>
    )
}

export function ReturnTask({ onClose, task }) {

    const submit = async (handleClose) => {
        try {
            await axios.patch(`http://localhost:5000/api/tasks/task/return`, { taskId: task._id }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });
            handleClose();
            toast.success("Task returned");
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.msg || err.message);
        }
    };

    return (
        <Dialogue onClose={onClose}>
            {({ handleClose }) => (
                <>
                    <div className={styles.title}>
                        <p>Returning the task</p>
                    </div>
                    <p className={styles.message}>You sure you wanna retrun the task? This will not reward the assignee</p>
                    <div className={styles.buttons}>
                        <button className={styles.secondary} onClick={handleClose}>Cancel</button>
                        <button className={styles.primaryBlue} onClick={() => submit(handleClose)}>Return</button>
                    </div>
                </>
            )}
        </Dialogue>
    )
}

export function CloseTask({ onClose, task }) {
    const navigate = useNavigate();

    const submit = async (handleClose) => {
        try {
            await axios.patch(`http://localhost:5000/api/archives/task/close`, { taskId: task._id }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });
            handleClose();
            toast.success("Task closed successfully");
            navigate(`/project/${task.project._id}`);
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.msg || err.message);
        }
    };

    return (
        <Dialogue onClose={onClose}>
            {({ handleClose }) => (
                <>
                    <div className={styles.title}>
                        <p>Closing the task</p>
                    </div>
                    <p className={styles.message}>Reward the assignee and find this task in the archives</p>
                    <div className={styles.buttons}>
                        <button className={styles.secondary} onClick={handleClose}>Cancel</button>
                        <button className={styles.primaryGreen} onClick={() => submit(handleClose)}>Close</button>
                    </div>
                </>
            )}
        </Dialogue>
    )
}

export function DeleteTask({ onClose, task }) {
    const navigate = useNavigate();

    const submit = async (handleClose) => {
        try {
            await axios.patch(`http://localhost:5000/api/archives/task/archive`, { taskId: task._id }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });
            handleClose();
            toast.success("Task archived");
            navigate(`/project/${task.project._id}`);
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.msg || err.message);
        }
    };

    return (
        <Dialogue onClose={onClose}>
            {({ handleClose }) => (
                <>
                    <div className={styles.title}>
                        <p>Deleting the task</p>
                    </div>
                    <p className={styles.message}>Delete the task without rewarding the assignee and send it to the archives</p>
                    <div className={styles.buttons}>
                        <button className={styles.secondary} onClick={handleClose}>Cancel</button>
                        <button className={styles.primaryRed} onClick={() => submit(handleClose)}>Delete</button>
                    </div>
                </>
            )}
        </Dialogue>
    )
}

export function InviteUser({ onClose, projectId }) {
    const [email, setEmail] = useState("");

    const submit = async (handleClose) => {
        try {
            await axios.post(`http://localhost:5000/api/invitations/invite`, { email, projectId }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });
            handleClose();
            toast.success("Invitation sent");
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.msg || err.message);
        }
    };

    return (
        <Dialogue onClose={onClose}>
            {({ handleClose }) => (
                <>
                    <div className={styles.title}>
                        <p>Invite a user</p>
                    </div>
                    <div className={styles.inputField}>
                        <label className={styles.message}>Find and invite a user by email</label>
                        <input type="text" onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className={styles.buttons}>
                        <button className={styles.secondary} onClick={handleClose}>Cancel</button>
                        <button className={styles.primaryGreen} onClick={() => submit(handleClose)}>Send invitation</button>
                    </div>
                </>
            )}
        </Dialogue>
    )
}

export function InvitationResponse({ onClose, payload }) {
    const navigate = useNavigate();
    const [status, setStatus] = useState("");

    useEffect(() => {
        const fetchInvite = async () => {
            const res = await axios.get(`http://localhost:5000/api/invitations/${payload.invitationId}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });
            setStatus(res.data.status);
        }
        fetchInvite();
    }, []);

    const accept = async (handleClose) => {
        try {
            await axios.patch(`http://localhost:5000/api/invitations/accept`, {
                invitationId: payload.invitationId,
            }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });
            handleClose();
            toast.success(`Welcome to ${payload.projectName}`);
            navigate(`/project/${payload.projectId}`)
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.msg || err.message);
        }
    };

    const decline = async (handleClose) => {
        try {
            await axios.patch(`http://localhost:5000/api/invitations/decline`, {
                invitationId: payload.invitationId,
            }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });
            handleClose();
            toast.success(`Declined ${payload.projectName} offer`);
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.msg || err.message);
        }
    };


    return (
        <Dialogue onClose={onClose}>
            {({ handleClose }) => (
                <>
                    <div className={styles.title}>
                        <p>An invitation</p>
                    </div>
                    <div className={styles.invitation}>
                        <div className={styles.projectImage}>
                            <img src={payload.projectImage} />
                        </div>
                        <div className={styles.content}>
                            <span>{payload.inviter} invited you join</span>
                            <p>{payload.projectName}</p>
                        </div>
                    </div>
                    <div className={styles.buttons}>
                        {status === "PENDING" ? <>
                            <button className={styles.primaryRed} onClick={() => decline(handleClose)}>Decline</button>
                            <button className={styles.primaryGreen} onClick={() => accept(handleClose)}>Accept</button>
                        </> :
                            <button className={styles.secondary} onClick={() => accept(handleClose)} style={{ pointerEvents: "none" }}>Invitation {status.toLowerCase()}</button>
                        }
                    </div>
                </>
            )}
        </Dialogue>
    )
}

export function LeaveProject({ onClose, project }) {
    const navigate = useNavigate();

    const confirm = async (handleClose) => {
        try {
            await axios.delete(`http://localhost:5000/api/memberships/leave`, {
                data: { projectId: project._id },
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });
            handleClose();
            toast.success(`Left ${project.name}`);
            navigate("/dashboard");
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.msg || err.message);
        }
    };


    return (
        <Dialogue onClose={onClose}>
            {({ handleClose }) => (
                <>
                    <div className={styles.title}>
                        <p>Leaving the project</p>
                    </div>
                    <div className={styles.message} style={{ maxWidth: "300px" }}>
                        You sure wanna leave? This will notify the owner and other admins.
                    </div>
                    <div className={styles.buttons}>
                        <button className={styles.secondary} onClick={handleClose}>Cancel</button>
                        <button className={styles.primaryRed} onClick={() => confirm(handleClose)}>Leave</button>
                    </div>
                </>
            )}
        </Dialogue>
    )
}

export function DeleteMails({ onClose, selected }) {

    const confirm = async (handleClose) => {
        try {
            await axios.patch(`http://localhost:5000/api/inbox/delete`, { selected }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });
            handleClose();
            toast.success(`Deletion in progress...`);
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.msg || err.message);
        }
    };


    return (
        <Dialogue onClose={onClose}>
            {({ handleClose }) => (
                <>
                    <div className={styles.title}>
                        <p>Heads up!</p>
                    </div>
                    <div className={styles.message} style={{ maxWidth: "300px" }}>
                        Some mails might not have been opened. Click the red one if you don't care.
                    </div>
                    <div className={styles.buttons}>
                        <button className={styles.secondary} onClick={handleClose}>Cancel</button>
                        <button className={styles.primaryRed} onClick={() => confirm(handleClose)}>Delete</button>
                    </div>
                </>
            )}
        </Dialogue>
    )
}