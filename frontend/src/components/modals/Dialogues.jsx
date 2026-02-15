import show_svg from "../../assets/icons/show.svg";
import hide_svg from "../../assets/icons/hide.svg";
import arrowRight_svg from "../../assets/icons/arrowRight.svg";
import loading_svg from "../../assets/icons/loading.svg";
import { Dialogue } from "./Modal";
import { useNavigate } from "react-router-dom";
import styles from "./css/dialogues.module.scss";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";


export function Logout({ onClose }) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleLogout = (handleClose) => {
        handleClose();
        localStorage.removeItem("token");
        navigate("/");
    };

    return (
        <Dialogue onClose={onClose}>
            {({ handleClose }) => (
                <>
                    <div className={styles.loading} style={{ visibility: loading ? "visible" : "hidden" }}  >
                        <img src={loading_svg} />
                    </div>
                    <main style={{ visibility: loading ? "hidden" : "visible" }}>
                        <div className={styles.title}>
                            <p>Taking some air</p>
                        </div>
                        <p className={styles.message}>You sure you wanna logout?</p>
                        <div className={styles.buttons}>
                            <button className={styles.secondary} onClick={handleClose}>Cancel</button>
                            <button className={styles.primaryGreen} onClick={() => handleLogout(handleClose)}>Logout</button>
                        </div>
                    </main>
                </>
            )}
        </Dialogue>
    );
}

export function UpdatePassword({ onClose }) {

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);

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

        try {
            setLoading(true);
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
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialogue onClose={onClose}>
            {({ handleClose }) => (
                <>
                    <div className={styles.loading} style={{ visibility: loading ? "visible" : "hidden" }}  >
                        <img src={loading_svg} />
                    </div>
                    <main style={{ visibility: loading ? "hidden" : "visible" }}>
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
                    </main>
                </>
            )}
        </Dialogue>
    );
}

export function DeleteAccount({ onClose, user }) {

    const [confirmation, setConfirmation] = useState(false);
    const [fieldName, setFieldName] = useState("");
    const [loading, setLoading] = useState(false);
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
            setLoading(true);
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
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialogue onClose={onClose}>
            {({ handleClose }) => (
                <>
                    <div className={styles.loading} style={{ visibility: loading ? "visible" : "hidden" }}  >
                        <img src={loading_svg} />
                    </div>
                    <main style={{ visibility: loading ? "hidden" : "visible" }}>
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
                    </main>
                </>
            )}
        </Dialogue>
    );
}

export function FindUser({ onClose }) {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const submit = async (handleClose) => {
        try {
            setLoading(true);
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
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialogue onClose={onClose}>
            {({ handleClose }) => (
                <>
                    <div className={styles.loading} style={{ visibility: loading ? "visible" : "hidden" }}  >
                        <img src={loading_svg} />
                    </div>
                    <main style={{ visibility: loading ? "hidden" : "visible" }}>
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
                    </main>
                </>
            )}
        </Dialogue>
    );
}

export function DeleteBoard({ onClose, boardId }) {
    const [loading, setLoading] = useState(false);

    const confirm = async (handleClose) => {
        try {
            setLoading(true);
            await axios.delete(`http://localhost:5000/api/boards/board/${boardId}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });
            handleClose();
            toast.success("Board deleted successfully");
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.msg || err.message);
        } finally {
            setLoading(false);
            handleClose();
        }
    };

    return (
        <Dialogue onClose={onClose}>
            {({ handleClose }) => (<>
                <div className={styles.loading} style={{ visibility: loading ? "visible" : "hidden" }}  >
                    <img src={loading_svg} />
                </div>
                <main style={{ visibility: loading ? "hidden" : "visible" }}>
                    <div className={styles.title}>
                        <p>Deleting a board</p>
                    </div>
                    <p className={styles.message}>You sure you wanna delete the board?</p>
                    <div className={styles.buttons}>
                        <button className={styles.secondary} onClick={handleClose}>Cancel</button>
                        <button className={styles.primaryRed} onClick={() => confirm(handleClose)}>Delete</button>
                    </div>
                </main>
            </>)}
        </Dialogue>
    );
}

export function SubmitTask({ onClose, task }) {
    const [loading, setLoading] = useState(false);

    const submit = async (handleClose) => {
        try {
            setLoading(true);
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
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialogue onClose={onClose}>
            {({ handleClose }) => (
                <>
                    <div className={styles.loading} style={{ visibility: loading ? "visible" : "hidden" }}  >
                        <img src={loading_svg} />
                    </div>
                    <main style={{ visibility: loading ? "hidden" : "visible" }}>
                        <div className={styles.title}>
                            <p>Submitting the task</p>
                        </div>
                        <p className={styles.message}>Send the task up for a review and get rewarded after it gets closed</p>
                        <div className={styles.buttons}>
                            <button className={styles.secondary} onClick={handleClose}>Cancel</button>
                            <button className={styles.primaryBlue} onClick={() => submit(handleClose)}>Submit</button>
                        </div>
                    </main>
                </>
            )}
        </Dialogue>
    );
}

export function ReturnTask({ onClose, task }) {
    const [loading, setLoading] = useState(false);

    const submit = async (handleClose) => {
        try {
            setLoading(true);
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
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialogue onClose={onClose}>
            {({ handleClose }) => (
                <>
                    <div className={styles.loading} style={{ visibility: loading ? "visible" : "hidden" }}  >
                        <img src={loading_svg} />
                    </div>
                    <main style={{ visibility: loading ? "hidden" : "visible" }}>
                        <div className={styles.title}>
                            <p>Returning the task</p>
                        </div>
                        <p className={styles.message}>You sure you wanna retrun the task? This will not reward the assignee</p>
                        <div className={styles.buttons}>
                            <button className={styles.secondary} onClick={handleClose}>Cancel</button>
                            <button className={styles.primaryBlue} onClick={() => submit(handleClose)}>Return</button>
                        </div>
                    </main>
                </>
            )}
        </Dialogue>
    );
}

export function CloseTask({ onClose, task }) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const submit = async (handleClose) => {
        try {
            setLoading(true);
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
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialogue onClose={onClose}>
            {({ handleClose }) => (
                <>
                    <div className={styles.loading} style={{ visibility: loading ? "visible" : "hidden" }}  >
                        <img src={loading_svg} />
                    </div>
                    <main style={{ visibility: loading ? "hidden" : "visible" }}>
                        <div className={styles.title}>
                            <p>Closing the task</p>
                        </div>
                        <p className={styles.message}>Reward the assignee and find this task in the archives</p>
                        <div className={styles.buttons}>
                            <button className={styles.secondary} onClick={handleClose}>Cancel</button>
                            <button className={styles.primaryGreen} onClick={() => submit(handleClose)}>Close</button>
                        </div>
                    </main>
                </>
            )}
        </Dialogue>
    );
}

export function DeleteTask({ onClose, task }) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const submit = async (handleClose) => {
        try {
            setLoading(true);
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
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialogue onClose={onClose}>
            {({ handleClose }) => (
                <>
                    <div className={styles.loading} style={{ visibility: loading ? "visible" : "hidden" }}  >
                        <img src={loading_svg} />
                    </div>
                    <main style={{ visibility: loading ? "hidden" : "visible" }}>
                        <div className={styles.title}>
                            <p>Deleting the task</p>
                        </div>
                        <p className={styles.message}>Delete the task without rewarding the assignee and send it to the archives</p>
                        <div className={styles.buttons}>
                            <button className={styles.secondary} onClick={handleClose}>Cancel</button>
                            <button className={styles.primaryRed} onClick={() => submit(handleClose)}>Delete</button>
                        </div>
                    </main>
                </>
            )}
        </Dialogue>
    );
}

export function DeleteTasks({ onClose, taskIds, projectId }) {
    const [loading, setLoading] = useState(false);
    const confirm = async (handleClose) => {
        try {
            setLoading(true);
            await axios.delete(`http://localhost:5000/api/archives/tasks`, {
                data: { taskIds, projectId },
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });
            handleClose();
            toast.success("Tasks permanently deleted");
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.msg || err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialogue onClose={onClose}>
            {({ handleClose }) => (
                <>
                    <div className={styles.loading} style={{ visibility: loading ? "visible" : "hidden" }}  >
                        <img src={loading_svg} />
                    </div>
                    <main style={{ visibility: loading ? "hidden" : "visible" }}>
                        <div className={styles.title}>
                            <p>Clearing out the archives</p>
                        </div>
                        <p className={styles.message}>The selected tasks will be sent for shredding and never be recovered</p>
                        <div className={styles.buttons}>
                            <button className={styles.secondary} onClick={handleClose}>Cancel</button>
                            <button className={styles.primaryRed} onClick={() => confirm(handleClose)}>Confirm</button>
                        </div>
                    </main>
                </>
            )}
        </Dialogue>
    );
}

export function InviteUser({ onClose, projectId }) {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const submit = async (handleClose) => {
        try {
            setLoading(true);
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
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialogue onClose={onClose}>
            {({ handleClose }) => (
                <>
                    <div className={styles.loading} style={{ visibility: loading ? "visible" : "hidden" }}  >
                        <img src={loading_svg} />
                    </div>
                    <main style={{ visibility: loading ? "hidden" : "visible" }}>
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
                    </main>
                </>
            )}
        </Dialogue>
    );
}

export function InvitationResponse({ onClose, payload }) {
    const navigate = useNavigate();
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchInvite = async () => {
            try {
                setLoading(true);
                const res = await axios.get(`http://localhost:5000/api/invitations/${payload.invitationId}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                });
                setStatus(res.data.status);
            } catch (err) {
                console.error(err);
                toast.error(err.response?.data?.msg || err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchInvite();
    }, []);

    const accept = async (handleClose) => {
        try {
            setLoading(true);
            await axios.patch(`http://localhost:5000/api/invitations/accept`, {
                invitationId: payload.invitationId,
            }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });
            handleClose();
            toast.success(`Welcome to ${payload.project.name}`);
            navigate(`/project/${payload.project._id}`)
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.msg || err.message);
        } finally {
            setLoading(false);
        }
    };

    const decline = async (handleClose) => {
        try {
            setLoading(true);
            await axios.patch(`http://localhost:5000/api/invitations/decline`, {
                invitationId: payload.invitationId,
            }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });
            handleClose();
            toast.success(`Declined ${payload.project.name} offer`);
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.msg || err.message);
        } finally {
            setLoading(false);
        }
    };


    return (
        <Dialogue onClose={onClose}>
            {({ handleClose }) => (
                <>
                    <div className={styles.loading} style={{ visibility: loading ? "visible" : "hidden" }}  >
                        <img src={loading_svg} />
                    </div>
                    <main style={{ visibility: loading ? "hidden" : "visible" }}>
                        <div className={styles.title}>
                            <p>An invitation</p>
                        </div>
                        <div className={styles.invitation}>
                            <div className={styles.projectImage}>
                                <img src={payload.project.projectImage.url} />
                            </div>
                            <div className={styles.content}>
                                <span>{payload.inviter.fullname} invited you join</span>
                                <p>{payload.project.name}</p>
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
                    </main>
                </>
            )}
        </Dialogue>
    );
}

export function LeaveProject({ onClose, project }) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const confirm = async (handleClose) => {
        try {
            setLoading(true);
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
        } finally {
            setLoading(false);
        }
    };


    return (
        <Dialogue onClose={onClose}>
            {({ handleClose }) => (
                <>
                    <div className={styles.loading} style={{ visibility: loading ? "visible" : "hidden" }}  >
                        <img src={loading_svg} />
                    </div>
                    <main style={{ visibility: loading ? "hidden" : "visible" }}>
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
                    </main>
                </>
            )}
        </Dialogue>
    );
}

export function RemoveMembers({ onClose, memberIds, onSuccess }) {

    const [confirmation, setConfirmation] = useState({ first: false, second: false });
    const [loading, setLoading] = useState(false);

    console.log(memberIds);
    if (!memberIds.memberships.length) {
        toast.error("Invalid arguments");
        return null;
    }

    const projectId = memberIds.projectId;
    const membershipIds = memberIds.memberships;
    const single = membershipIds.length === 1;

    const confirm = async (handleClose) => {
        if (!confirmation.first || !confirmation.second) {
            toast.error("Confirmation required");
            return;
        }

        try {
            setLoading(true);
            await axios.delete("http://localhost:5000/api/memberships/remove", {
                data: { projectId, memberIds: membershipIds },
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });

            toast.success("Removed from project");
            handleClose();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.msg || err.message);
        } finally {
            onSuccess();
            setLoading(false);
        }
    };

    return (
        <Dialogue onClose={onClose}>
            {({ handleClose }) => (
                <>
                    <div className={styles.loading} style={{ visibility: loading ? "visible" : "hidden" }}  >
                        <img src={loading_svg} />
                    </div>
                    <main style={{ visibility: loading ? "hidden" : "visible" }}>
                        <div className={styles.title}>
                            <p>Removing {single ? "a member" : "members"}</p>
                        </div>
                        <div>
                            <div className={styles.checkboxContainer}>
                                <div className={styles.checkboxes}>
                                    <input type="checkbox"
                                        className={styles.checkbox}
                                        checked={confirmation.first}
                                        onChange={() => setConfirmation(prev => ({ ...prev, first: !prev.first }))} />
                                    <span className={styles.checkmark}>I understand that by removing a member, his assigned tasks will be archived</span>
                                </div>
                                <div className={styles.checkboxes}>
                                    <input type="checkbox"
                                        className={styles.checkbox}
                                        checked={confirmation.second}
                                        onChange={() => setConfirmation(prev => ({ ...prev, second: !prev.second }))} />
                                    <span className={styles.checkmark}>I understand that by removing a member, his created tasks will now be owned by me</span>
                                </div>
                            </div>
                        </div>
                        <div className={styles.message} style={{ maxWidth: "100%", textAlign: "left", margin: "7px 15px" }}>
                            You sure you wanna remove {single ? "this member" : "these members"}?
                        </div>
                        <div className={styles.buttons}>
                            <button className={styles.secondary} onClick={handleClose}>Cancel</button>
                            <button className={styles.primaryRed} onClick={() => confirm(handleClose)}>Remove member{single ? '' : 's'}</button>
                        </div>
                    </main>
                </>
            )}
        </Dialogue>
    );
}

export function DeleteMails({ onClose, selected }) {
    const [loading, setLoading] = useState(false);

    const confirm = async (handleClose) => {
        try {
            setLoading(true);
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
        } finally {
            setLoading(false);
        }
    };


    return (
        <Dialogue onClose={onClose}>
            {({ handleClose }) => (
                <>
                    <div className={styles.loading} style={{ visibility: loading ? "visible" : "hidden" }}  >
                        <img src={loading_svg} />
                    </div>
                    <main style={{ visibility: loading ? "hidden" : "visible" }}>
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
                    </main>
                </>
            )}
        </Dialogue>
    );
}

export function TransferOwnership({ onClose, payload }) {
    const [confirmation, setConfirmation] = useState({ first: false, second: false });
    const [confirmationValue, setConfirmationValue] = useState("");
    const [loading, setLoading] = useState(false);

    const transfer = async (handleClose) => {
        if (!confirmation.first || !confirmation.second) {
            toast.error("Confirmation required");
            return;
        }

        const confirmationText = `${payload.owner.firstname.trim()}/${payload.project.name.trim()}`;
        if (confirmationValue.trim() !== confirmationText) {
            toast.error("Confirmation string doesn't match.");
            return;
        }

        try {
            setLoading(true);
            await axios.post("http://localhost:5000/api/memberships/transfer-ownership/offer", {
                projectId: payload.project._id,
                adminId: payload.admin._id
            }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });
            toast.success("Offer sent");
            handleClose();
        } catch (err) {
            console.log(err);
            toast.error(err.response.data.msg);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialogue onClose={onClose}>
            {({ handleClose }) => (
                <>
                    <div className={styles.loading} style={{ visibility: loading ? "visible" : "hidden" }}  >
                        <img src={loading_svg} />
                    </div>
                    <main style={{ visibility: loading ? "hidden" : "visible" }}>
                        <div className={styles.title}>
                            <p>Transfering ownership</p>
                        </div>
                        <div className={styles.images}>
                            <div className={styles.profileImage}>
                                <img src={payload.owner.profileImage.url} />
                            </div>
                            <img src={arrowRight_svg} className={styles.arrow} />
                            <div className={styles.projectImage}>
                                <img src={payload.project.projectImage.url} />
                            </div>
                            <img src={arrowRight_svg} className={styles.arrow} />
                            <div className={styles.profileImage}>
                                <img src={payload.admin.profileImage.url} />
                            </div>
                        </div>
                        <div className={styles.checkboxContainer}>
                            <div className={styles.checkboxes}>
                                <input type="checkbox"
                                    id="confirmation"
                                    className={styles.checkbox}
                                    checked={confirmation.first}
                                    onChange={() => setConfirmation(prev => ({ ...prev, first: !prev.first }))} />
                                <label htmlFor="confirmation" className={styles.checkmark}>
                                    I believe this person might be the best candidate for ownership
                                </label>
                            </div>
                            <div className={styles.checkboxes}>
                                <input type="checkbox"
                                    id="confirmation"
                                    className={styles.checkbox}
                                    checked={confirmation.second}
                                    onChange={() => setConfirmation(prev => ({ ...prev, second: !prev.second }))} />
                                <label htmlFor="confirmation" className={styles.checkmark}>
                                    After giving away the ownership, I'll lose ultimate access to the project and become an admin
                                </label>
                            </div>
                        </div>
                        <div className={styles.inputField} style={{ margin: 0 }}>
                            <label>Confirm by typing "{payload.owner.firstname}/{payload.project.name}"</label>
                            <input type="text" onChange={(e) => setConfirmationValue(e.target.value)} />
                        </div>
                        <div className={styles.buttons}>
                            <button className={styles.primaryRed} onClick={() => transfer(handleClose)}>Transfer ownership</button>
                        </div>
                    </main>
                </>
            )}
        </Dialogue>
    );
}

export function OwnershipResponse({ onClose, payload }) {
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchOffer = async () => {
            try {
                setLoading(true);
                const res = await axios.get(`http://localhost:5000/api/memberships/transfer-ownership/${payload.offerId}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                });
                setStatus(res.data.status);
            } catch (err) {
                console.log(err);
                toast.error(err.response?.data?.msg || err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchOffer();
    }, [payload.offerId]);

    const accept = async (handleClose) => {
        try {
            setLoading(true);
            await axios.patch("http://localhost:5000/api/memberships/transfer-ownership/accept", { offerId: payload.offerId }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });
            toast.success("Offer accepted");
            handleClose();
        } catch (err) {
            console.log(err);
            toast.error(err.response.data.msg);
        } finally {
            setLoading(false);
        }
    }

    const decline = async (handleClose) => {
        try {
            setLoading(true);
            await axios.patch("http://localhost:5000/api/memberships/transfer-ownership/decline", { offerId: payload.offerId }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });
            toast.success("Offer declined");
            handleClose();
        } catch (err) {
            console.log(err);
            toast.error(err.response.data.msg);
        } finally {
            setLoading(false);
        }
    }


    return (
        <Dialogue onClose={onClose}>
            {({ handleClose }) => (
                <>
                    <div className={styles.loading} style={{ visibility: loading ? "visible" : "hidden" }}  >
                        <img src={loading_svg} />
                    </div>
                    <main style={{ visibility: loading ? "hidden" : "visible" }}>
                        <div className={styles.title}>
                            <p>Transfering ownership</p>
                        </div>
                        <div className={styles.images}>
                            <div className={styles.profileImage}>
                                <img src={payload.owner.profileImage.url} />
                            </div>
                            <img src={arrowRight_svg} className={styles.arrow} />
                            <div className={styles.projectImage}>
                                <img src={payload.project.projectImage.url} />
                            </div>
                            <img src={arrowRight_svg} className={styles.arrow} />
                            <div className={styles.profileImage}>
                                <img src={payload.admin.profileImage.url} />
                            </div>
                        </div>
                        <p className={styles.message}>
                            {payload.owner.name} has offered you the ownership of {payload.project.name}
                        </p>
                        <div className={styles.buttons}>
                            {status === "PENDING" ? <>
                                <button className={styles.primaryRed} onClick={() => decline(handleClose)}>Decline</button>
                                <button className={styles.primaryGreen} onClick={() => accept(handleClose)}>Accept</button>
                            </> :
                                <button className={styles.secondary} style={{ pointerEvents: "none" }} disabled>Invitation {status.toLowerCase()}</button>
                            }
                        </div>
                    </main>
                </>
            )}
        </Dialogue >
    );
}

export function DeleteProject({ onClose, project }) {
    const [confirmation, setConfirmation] = useState(false);
    const [confirmationText, setConfirmationText] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const confirm = async (handleClose) => {
        if (!confirmation) {
            toast.error("Check the confirmation box");
            return;
        }

        const confirmationValue = `${project.name}/goodbye`;
        if (confirmationText !== confirmationValue) {
            toast.error("Confirmation text doesn't match");
            return;
        }

        try {
            setLoading(true);
            await axios.delete(`http://localhost:5000/api/projects/project/${project._id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });
            toast.success("Project deleted successfully");
            handleClose();
            navigate("/dashboard");
        } catch (err) {
            console.log(err);
            toast.error(err.response.data.msg);
        } finally {
            setLoading(false);
        }
    }


    return (
        <Dialogue onClose={onClose}>
            {({ handleClose }) => (<>
                <div className={styles.loading} style={{ visibility: loading ? "visible" : "hidden" }}  >
                    <img src={loading_svg} />
                </div>
                <main style={{ visibility: loading ? "hidden" : "visible" }}>
                    <div className={styles.title}>
                        <p>Deleting project</p>
                    </div>
                    <div className={styles.checkboxContainer}>
                        <div className={styles.checkboxes}>
                            <input type="checkbox"
                                id="confirmation"
                                className={styles.checkbox}
                                checked={confirmation}
                                onChange={() => setConfirmation(prev => !prev)} />
                            <label htmlFor="confirmation" className={styles.checkmark}>
                                I understand that deleting this project is permanent and cannot be undone
                            </label>
                        </div>
                    </div>
                    <div className={styles.inputField} style={{ margin: 0 }}>
                        <label>Confirm by typing "{project.name}/goodbye"</label>
                        <input type="text" onChange={(e) => setConfirmationText(e.target.value)} />
                    </div>
                    <div className={styles.buttons}>
                        <button className={styles.primaryRed} onClick={() => confirm(handleClose)}>Delete this project</button>
                    </div>
                </main>
            </>
            )}
        </Dialogue >
    );
}

export function PromoteMember({ onClose, membershipId, onSuccess }) {
    const [loading, setLoading] = useState(false);

    const confirm = async (handleClose) => {
        try {
            setLoading(true);
            await axios.patch("http://localhost:5000/api/memberships/change-role/promote", { membershipId }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });
            toast.success("Member promoted to Admin");
            handleClose();
        } catch (err) {
            console.log(err);
            toast.error(err.response.data.msg);
        } finally {
            onSuccess();
            setLoading(false);
        }
    }


    return (
        <Dialogue onClose={onClose}>
            {({ handleClose }) => (<>
                <div className={styles.loading} style={{ visibility: loading ? "visible" : "hidden" }}  >
                    <img src={loading_svg} />
                </div>
                <main style={{ visibility: loading ? "hidden" : "visible" }}>
                    <div className={styles.title}>
                        <p>Promoting a member</p>
                    </div>
                    <p className={styles.message} style={{ margin: "30px auto" }}>
                        Promotion gives a member some sort of authoritative access.You sure you wanna promote this member?
                    </p>
                    <div className={styles.buttons}>
                        <button className={styles.secondary} onClick={handleClose}>Cancel</button>
                        <button className={styles.primaryBlue} onClick={() => confirm(handleClose)}>Promote</button>
                    </div>
                </main>
            </>)}
        </Dialogue >
    );
}

export function DemoteAdmin({ onClose, membershipId, onSuccess }) {
    const [loading, setLoading] = useState(false);

    const confirm = async (handleClose) => {
        try {
            setLoading(true);
            await axios.patch("http://localhost:5000/api/memberships/change-role/demote", { membershipId }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });
            toast.success("Admin demoted to Member");
            handleClose();
        } catch (err) {
            console.log(err);
            toast.error(err.response.data.msg);
        } finally {
            onSuccess();
            setLoading(false);
        }
    }


    return (
        <Dialogue onClose={onClose}>
            {({ handleClose }) => (<>
                <div className={styles.loading} style={{ visibility: loading ? "visible" : "hidden" }}  >
                    <img src={loading_svg} />
                </div>
                <main style={{ visibility: loading ? "hidden" : "visible" }}>
                    <div className={styles.title}>
                        <p>Demoting an admin</p>
                    </div>
                    <p className={styles.message}>
                        Demotion takes all sort of authoritative access from an admin. You sure you wanna demote this member?
                    </p>
                    <div className={styles.buttons}>
                        <button className={styles.secondary} onClick={handleClose}>Cancel</button>
                        <button className={styles.primaryRed} onClick={() => confirm(handleClose)}>Demote</button>
                    </div>
                </main>
            </>)}
        </Dialogue >
    );
}

