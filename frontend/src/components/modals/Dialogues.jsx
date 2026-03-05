import show_svg from "../../assets/icons/show.svg";
import hide_svg from "../../assets/icons/hide.svg";
import loading_svg from "../../assets/icons/loading.svg";
import { Dialogue } from "./Modal";
import { useNavigate } from "react-router-dom";
import styles from "./css/dialogues.module.scss";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";

const AUTH = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

function Spinner() {
    return (
        <div className={styles.loadingOverlay}>
            <img src={loading_svg} alt="" />
        </div>
    );
}


/* LOGOUT ═══════════════════════════════════════════════════════════ */
export function Logout({ onClose }) {
    const navigate = useNavigate();
    return (
        <Dialogue onClose={onClose}>
            {({ handleClose }) => (
                <div className={styles.dialogue}>
                    <div className={`${styles.rail} ${styles.railGreen}`} />
                    <div className={styles.head}>
                        <span className={styles.headEyebrow}>session</span>
                        <p className={styles.headTitle}>Log out</p>
                    </div>
                    <div className={styles.body}>
                        <p className={styles.desc}>You'll need to sign back in to access your workspace.</p>
                    </div>
                    <div className={styles.divider} style={{ marginTop: 16 }} />
                    <div className={styles.footer}>
                        <button className={styles.btnCancel} onClick={handleClose}>Cancel</button>
                        <button className={styles.btnGreen} onClick={() => { localStorage.removeItem("token"); handleClose(); navigate("/"); }}>Log out</button>
                    </div>
                </div>
            )}
        </Dialogue>
    );
}


/* UPDATE PASSWORD ══════════════════════════════════════════════════ */
export function UpdatePassword({ onClose }) {
    const [fields, setFields] = useState({ current: "", new: "", confirm: "" });
    const [show, setShow] = useState({ current: false, new: false, confirm: false });
    const [loading, setLoading] = useState(false);

    const set = (key) => (e) => setFields(p => ({ ...p, [key]: e.target.value }));
    const tog = (key) => () => setShow(p => ({ ...p, [key]: !p[key] }));

    const submit = async (handleClose) => {
        if (fields.new !== fields.confirm) { toast.error("Passwords don't match"); return; }
        if (fields.new.length < 5) { toast.error("At least 5 characters"); return; }
        if (fields.current === fields.new) { toast.error("Same as current password"); return; }
        try {
            setLoading(true);
            const res = await axios.patch("/api/users/user/change-password",
                { currentPassword: fields.current, newPassword: fields.new },
                { headers: AUTH() }
            );
            if (res.data.token) localStorage.setItem("token", res.data.token);
            handleClose();
            toast.success("Password updated");
        } catch (err) {
            toast.error(err.response?.data?.msg || "Something went wrong");
        } finally { setLoading(false); }
    };

    const rows = [
        { key: "current", label: "Current password" },
        { key: "new", label: "New password" },
        { key: "confirm", label: "Confirm password" },
    ];

    return (
        <Dialogue onClose={onClose}>
            {({ handleClose }) => (
                <div className={styles.dialogue}>
                    {loading && <Spinner />}
                    <div className={`${styles.rail} ${styles.railGreen}`} />
                    <div className={styles.head}>
                        <span className={styles.headEyebrow}>account</span>
                        <p className={styles.headTitle}>Update password</p>
                    </div>
                    <div className={styles.body}>
                        <div className={styles.passwordList}>
                            {rows.map(({ key, label }) => (
                                <div key={key} className={styles.passwordGroup}>
                                    <label>{label}</label>
                                    <div className={styles.passwordWrapper}>
                                        <input
                                            type={show[key] ? "text" : "password"}
                                            value={fields[key]}
                                            onChange={set(key)}
                                            placeholder="••••••••"
                                        />
                                        <button type="button" className={styles.toggleVisibility} onClick={tog(key)}>
                                            <img src={show[key] ? show_svg : hide_svg} alt="" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className={styles.divider} style={{ marginTop: 16 }} />
                    <div className={styles.footer}>
                        <button className={styles.btnCancel} onClick={handleClose}>Cancel</button>
                        <button className={styles.btnGreen} onClick={() => submit(handleClose)}>Update</button>
                    </div>
                </div>
            )}
        </Dialogue>
    );
}


/* DELETE ACCOUNT ═══════════════════════════════════════════════════ */
export function DeleteAccount({ onClose, user }) {
    const [checked, setChecked] = useState(false);
    const [typed, setTyped] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const phrase = `${user.firstname.trim()}-${user.lastname.trim()}`;

    const handleDelete = async (handleClose) => {
        if (!checked) { toast.error("Check the confirmation box"); return; }
        if (typed.trim() !== phrase) { toast.error("Phrase doesn't match"); return; }
        try {
            setLoading(true);
            await axios.delete("/api/users/user/", { headers: AUTH() });
            localStorage.removeItem("token");
            handleClose();
            navigate("/");
            toast.success("Account deleted");
        } catch (err) {
            toast.error(err.response?.data?.msg || "Something went wrong");
        } finally { setLoading(false); }
    };

    return (
        <Dialogue onClose={onClose}>
            {({ handleClose }) => (
                <div className={styles.dialogue}>
                    {loading && <Spinner />}
                    <div className={`${styles.rail} ${styles.railRed}`} />
                    <div className={styles.head}>
                        <span className={styles.headEyebrow}>danger zone</span>
                        <p className={styles.headTitle}>Delete account</p>
                    </div>
                    <div className={styles.body}>
                        <p className={styles.desc}>All progress, achievements, and project history will be permanently erased. There is no recovery.</p>
                        <div className={styles.checkList}>
                            <div className={styles.checkRow}>
                                <input type="checkbox" className={styles.check} checked={checked} onChange={() => setChecked(p => !p)} />
                                <span className={styles.checkLabel}>I understand this cannot be undone</span>
                            </div>
                        </div>
                        <div className={styles.inputGroup}>
                            <label>Type <span className={styles.confirmPhrase}>{phrase}</span> to confirm</label>
                            <input type="text" placeholder={phrase} onChange={(e) => setTyped(e.target.value)} />
                        </div>
                    </div>
                    <div className={styles.divider} style={{ marginTop: 16 }} />
                    <div className={styles.footer}>
                        <button className={styles.btnCancel} onClick={handleClose}>Cancel</button>
                        <button className={styles.btnRed} onClick={() => handleDelete(handleClose)}>Delete account</button>
                    </div>
                </div>
            )}
        </Dialogue>
    );
}


/* FIND USER ════════════════════════════════════════════════════════ */
export function FindUser({ onClose }) {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const submit = async (handleClose) => {
        try {
            setLoading(true);
            const { data: user } = await axios.get(`/api/users/email/${email}`, { headers: AUTH() });
            const res = await axios.post(`/api/messages/user/${user._id}`, {}, { headers: AUTH() });
            navigate(`/chat/${res.data.chat._id}`);
            handleClose();
        } catch (err) {
            toast.error(err.response?.data?.msg || err.message);
        } finally { setLoading(false); }
    };

    return (
        <Dialogue onClose={onClose}>
            {({ handleClose }) => (
                <div className={styles.dialogue}>
                    {loading && <Spinner />}
                    <div className={`${styles.rail} ${styles.railGreen}`} />
                    <div className={styles.head}>
                        <span className={styles.headEyebrow}>messages</span>
                        <p className={styles.headTitle}>Open a DM</p>
                    </div>
                    <div className={styles.body}>
                        <p className={styles.desc}>Find a Vynce user by email address to start a direct message.</p>
                        <div className={styles.inputGroup}>
                            <label>Email address</label>
                            <input type="email" placeholder="user@vynce.app" onChange={(e) => setEmail(e.target.value)} />
                        </div>
                    </div>
                    <div className={styles.divider} style={{ marginTop: 16 }} />
                    <div className={styles.footer}>
                        <button className={styles.btnCancel} onClick={handleClose}>Cancel</button>
                        <button className={styles.btnGreen} onClick={() => submit(handleClose)}>Open DM</button>
                    </div>
                </div>
            )}
        </Dialogue>
    );
}


/* DELETE BOARD ═════════════════════════════════════════════════════ */
export function DeleteBoard({ onClose, boardId }) {
    const [loading, setLoading] = useState(false);

    const confirm = async (handleClose) => {
        try {
            setLoading(true);
            await axios.delete(`/api/boards/board/${boardId}`, { headers: AUTH() });
            handleClose();
            toast.success("Board deleted");
        } catch (err) {
            toast.error(err.response?.data?.msg || err.message);
        } finally { setLoading(false); }
    };

    return (
        <Dialogue onClose={onClose}>
            {({ handleClose }) => (
                <div className={styles.dialogue}>
                    {loading && <Spinner />}
                    <div className={`${styles.rail} ${styles.railRed}`} />
                    <div className={styles.head}>
                        <span className={styles.headEyebrow}>boards</span>
                        <p className={styles.headTitle}>Delete board</p>
                    </div>
                    <div className={styles.body}>
                        <p className={styles.desc}>All tasks on this board will be moved to the archives. The board itself is gone for good.</p>
                    </div>
                    <div className={styles.divider} style={{ marginTop: 16 }} />
                    <div className={styles.footer}>
                        <button className={styles.btnCancel} onClick={handleClose}>Cancel</button>
                        <button className={styles.btnRed} onClick={() => confirm(handleClose)}>Delete board</button>
                    </div>
                </div>
            )}
        </Dialogue>
    );
}


/* SUBMIT TASK ══════════════════════════════════════════════════════ */
export function SubmitTask({ onClose, task }) {
    const [loading, setLoading] = useState(false);

    const submit = async (handleClose) => {
        try {
            setLoading(true);
            await axios.patch("/api/tasks/task/submit", { taskId: task._id }, { headers: AUTH() });
            handleClose();
            toast.success("Task submitted for review");
        } catch (err) {
            toast.error(err.response?.data?.msg || err.message);
        } finally { setLoading(false); }
    };

    return (
        <Dialogue onClose={onClose}>
            {({ handleClose }) => (
                <div className={styles.dialogue}>
                    {loading && <Spinner />}
                    <div className={`${styles.rail} ${styles.railBlue}`} />
                    <div className={styles.head}>
                        <span className={styles.headEyebrow}>task</span>
                        <p className={styles.headTitle}>Submit for review</p>
                    </div>
                    <div className={styles.body}>
                        <p className={styles.desc}>Send this task up the chain. You'll be rewarded once it's closed by an owner or admin.</p>
                    </div>
                    <div className={styles.divider} style={{ marginTop: 16 }} />
                    <div className={styles.footer}>
                        <button className={styles.btnCancel} onClick={handleClose}>Not yet</button>
                        <button className={styles.btnBlue} onClick={() => submit(handleClose)}>Submit</button>
                    </div>
                </div>
            )}
        </Dialogue>
    );
}


/* RETURN TASK ══════════════════════════════════════════════════════ */
export function ReturnTask({ onClose, task }) {
    const [loading, setLoading] = useState(false);

    const submit = async (handleClose) => {
        try {
            setLoading(true);
            await axios.patch("/api/tasks/task/return", { taskId: task._id }, { headers: AUTH() });
            handleClose();
            toast.success("Task returned");
        } catch (err) {
            toast.error(err.response?.data?.msg || err.message);
        } finally { setLoading(false); }
    };

    return (
        <Dialogue onClose={onClose}>
            {({ handleClose }) => (
                <div className={styles.dialogue}>
                    {loading && <Spinner />}
                    <div className={`${styles.rail} ${styles.railBlue}`} />
                    <div className={styles.head}>
                        <span className={styles.headEyebrow}>task</span>
                        <p className={styles.headTitle}>Return the task</p>
                    </div>
                    <div className={styles.body}>
                        <p className={styles.desc}>The assignee won't be rewarded. The task goes back to its original board status.</p>
                    </div>
                    <div className={styles.divider} style={{ marginTop: 16 }} />
                    <div className={styles.footer}>
                        <button className={styles.btnCancel} onClick={handleClose}>Cancel</button>
                        <button className={styles.btnBlue} onClick={() => submit(handleClose)}>Return</button>
                    </div>
                </div>
            )}
        </Dialogue>
    );
}


/* CLOSE TASK ═══════════════════════════════════════════════════════ */
export function CloseTask({ onClose, task }) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const submit = async (handleClose) => {
        try {
            setLoading(true);
            await axios.patch("/api/archives/task/close", { taskId: task._id }, { headers: AUTH() });
            handleClose();
            navigate(`/project/${task.project._id}`);
            toast.success("Task closed — assignee rewarded");
        } catch (err) {
            toast.error(err.response?.data?.msg || err.message);
        } finally { setLoading(false); }
    };

    return (
        <Dialogue onClose={onClose}>
            {({ handleClose }) => (
                <div className={styles.dialogue}>
                    {loading && <Spinner />}
                    <div className={`${styles.rail} ${styles.railGreen}`} />
                    <div className={styles.head}>
                        <span className={styles.headEyebrow}>task</span>
                        <p className={styles.headTitle}>Close &amp; reward</p>
                    </div>
                    <div className={styles.body}>
                        <p className={styles.desc}>The assignee receives their bounty. The task is archived as complete.</p>
                    </div>
                    <div className={styles.divider} style={{ marginTop: 16 }} />
                    <div className={styles.footer}>
                        <button className={styles.btnCancel} onClick={handleClose}>Cancel</button>
                        <button className={styles.btnGreen} onClick={() => submit(handleClose)}>Close &amp; reward</button>
                    </div>
                </div>
            )}
        </Dialogue>
    );
}


/* DELETE TASK ══════════════════════════════════════════════════════ */
export function DeleteTask({ onClose, task }) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const submit = async (handleClose) => {
        try {
            setLoading(true);
            await axios.patch("/api/archives/task/archive", { taskId: task._id }, { headers: AUTH() });
            handleClose();
            navigate(`/project/${task.project._id}`);
            toast.success("Task archived");
        } catch (err) {
            toast.error(err.response?.data?.msg || err.message);
        } finally { setLoading(false); }
    };

    return (
        <Dialogue onClose={onClose}>
            {({ handleClose }) => (
                <div className={styles.dialogue}>
                    {loading && <Spinner />}
                    <div className={`${styles.rail} ${styles.railRed}`} />
                    <div className={styles.head}>
                        <span className={styles.headEyebrow}>task</span>
                        <p className={styles.headTitle}>Delete task</p>
                    </div>
                    <div className={styles.body}>
                        <p className={styles.desc}>No reward for the assignee. Task gets archived without a close event.</p>
                    </div>
                    <div className={styles.divider} style={{ marginTop: 16 }} />
                    <div className={styles.footer}>
                        <button className={styles.btnCancel} onClick={handleClose}>Cancel</button>
                        <button className={styles.btnRed} onClick={() => submit(handleClose)}>Delete</button>
                    </div>
                </div>
            )}
        </Dialogue>
    );
}


/* DELETE TASKS ═════════════════════════════════════════════════════ */
export function DeleteTasks({ onClose, taskIds, projectId }) {
    const [loading, setLoading] = useState(false);

    const confirm = async (handleClose) => {
        try {
            setLoading(true);
            await axios.delete("/api/archives/tasks", {
                data: { taskIds, projectId },
                headers: AUTH(),
            });
            handleClose();
            toast.success("Tasks permanently deleted");
        } catch (err) {
            toast.error(err.response?.data?.msg || err.message);
        } finally { setLoading(false); }
    };

    return (
        <Dialogue onClose={onClose}>
            {({ handleClose }) => (
                <div className={styles.dialogue}>
                    {loading && <Spinner />}
                    <div className={`${styles.rail} ${styles.railRed}`} />
                    <div className={styles.head}>
                        <span className={styles.headEyebrow}>archives</span>
                        <p className={styles.headTitle}>Clear {taskIds.length} task{taskIds.length !== 1 ? "s" : ""}</p>
                    </div>
                    <div className={styles.body}>
                        <p className={styles.desc}>These will be shredded permanently. No archive, no recovery.</p>
                    </div>
                    <div className={styles.divider} style={{ marginTop: 16 }} />
                    <div className={styles.footer}>
                        <button className={styles.btnCancel} onClick={handleClose}>Cancel</button>
                        <button className={styles.btnRed} onClick={() => confirm(handleClose)}>Shred</button>
                    </div>
                </div>
            )}
        </Dialogue>
    );
}


/* INVITE USER ══════════════════════════════════════════════════════ */
export function InviteUser({ onClose, projectId }) {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const submit = async (handleClose) => {
        try {
            setLoading(true);
            await axios.post("/api/invitations/invite", { email, projectId }, { headers: AUTH() });
            handleClose();
            toast.success("Invitation sent");
        } catch (err) {
            toast.error(err.response?.data?.msg || err.message);
        } finally { setLoading(false); }
    };

    return (
        <Dialogue onClose={onClose}>
            {({ handleClose }) => (
                <div className={styles.dialogue}>
                    {loading && <Spinner />}
                    <div className={`${styles.rail} ${styles.railGreen}`} />
                    <div className={styles.head}>
                        <span className={styles.headEyebrow}>team</span>
                        <p className={styles.headTitle}>Invite to project</p>
                    </div>
                    <div className={styles.body}>
                        <p className={styles.desc}>They'll receive an invite in their inbox. They can accept or decline.</p>
                        <div className={styles.inputGroup}>
                            <label>Email address</label>
                            <input type="email" placeholder="user@vynce.app" onChange={(e) => setEmail(e.target.value)} />
                        </div>
                    </div>
                    <div className={styles.divider} style={{ marginTop: 16 }} />
                    <div className={styles.footer}>
                        <button className={styles.btnCancel} onClick={handleClose}>Cancel</button>
                        <button className={styles.btnGreen} onClick={() => submit(handleClose)}>Send invite</button>
                    </div>
                </div>
            )}
        </Dialogue>
    );
}


/* INVITATION RESPONSE ══════════════════════════════════════════════ */
export function InvitationResponse({ onClose, payload }) {
    const navigate = useNavigate();
    const [status, setStatus] = useState("PENDING");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetch = async () => {
            try {
                setLoading(true);
                const res = await axios.get(`/api/invitations/${payload.invitationId}`, { headers: AUTH() });
                setStatus(res.data.status);
            } catch (err) {
                toast.error(err.response?.data?.msg || err.message);
            } finally { setLoading(false); }
        };
        fetch();
    }, []);

    const respond = async (handleClose, action) => {
        try {
            setLoading(true);
            await axios.patch(`/api/invitations/${action}`, { invitationId: payload.invitationId }, { headers: AUTH() });
            if (action === "accept") { navigate(`/project/${payload.project._id}`); toast.success(`Welcome to ${payload.project.name}`); }
            else { toast.success(`Declined ${payload.project.name}`); }
            handleClose();
        } catch (err) {
            toast.error(err.response?.data?.msg || err.message);
        } finally { setLoading(false); }
    };

    return (
        <Dialogue onClose={onClose}>
            {({ handleClose }) => (
                <div className={styles.dialogue}>
                    {loading && <Spinner />}
                    <div className={`${styles.rail} ${styles.railGreen}`} />
                    <div className={styles.head}>
                        <span className={styles.headEyebrow}>inbox</span>
                        <p className={styles.headTitle}>You're invited</p>
                    </div>
                    <div className={styles.body}>
                        <div className={styles.inviteBanner}>
                            <div className={styles.inviteThumb}>
                                <img src={payload.project.projectImage.url} alt="" />
                            </div>
                            <div className={styles.inviteText}>
                                <span className={styles.inviteFrom}>{payload.inviter.fullname} · invitation</span>
                                <span className={styles.inviteName}>{payload.project.name}</span>
                            </div>
                        </div>
                        <p className={styles.desc}>Join this project to start collaborating with the team.</p>
                    </div>
                    <div className={styles.divider} style={{ marginTop: 16 }} />
                    <div className={styles.footer}>
                        {status === "PENDING"
                            ? <>
                                <button className={styles.btnCancel} onClick={() => respond(handleClose, "decline")}>Decline</button>
                                <button className={styles.btnGreen} onClick={() => respond(handleClose, "accept")}>Accept</button>
                            </>
                            : <button className={`${styles.btnCancel} ${styles.btnFull}`} disabled>Invitation {status.toLowerCase()}</button>
                        }
                    </div>
                </div>
            )}
        </Dialogue>
    );
}


/* LEAVE PROJECT ════════════════════════════════════════════════════ */
export function LeaveProject({ onClose, project }) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const confirm = async (handleClose) => {
        try {
            setLoading(true);
            await axios.delete("/api/memberships/leave", { data: { projectId: project._id }, headers: AUTH() });
            handleClose();
            navigate("/dashboard");
            toast.success(`Left ${project.name}`);
        } catch (err) {
            toast.error(err.response?.data?.msg || err.message);
        } finally { setLoading(false); }
    };

    return (
        <Dialogue onClose={onClose}>
            {({ handleClose }) => (
                <div className={styles.dialogue}>
                    {loading && <Spinner />}
                    <div className={`${styles.rail} ${styles.railRed}`} />
                    <div className={styles.head}>
                        <span className={styles.headEyebrow}>membership</span>
                        <p className={styles.headTitle}>Leave project</p>
                    </div>
                    <div className={styles.body}>
                        <p className={styles.desc}>The owner and admins will be notified. Your assigned tasks remain open.</p>
                    </div>
                    <div className={styles.divider} style={{ marginTop: 16 }} />
                    <div className={styles.footer}>
                        <button className={styles.btnCancel} onClick={handleClose}>Stay</button>
                        <button className={styles.btnRed} onClick={() => confirm(handleClose)}>Leave</button>
                    </div>
                </div>
            )}
        </Dialogue>
    );
}


/* REMOVE MEMBERS ═══════════════════════════════════════════════════ */
export function RemoveMembers({ onClose, memberIds, onSuccess }) {
    const [checks, setChecks] = useState({ first: false, second: false });
    const [loading, setLoading] = useState(false);

    if (!memberIds?.memberships?.length) { toast.error("Invalid arguments"); return null; }
    const { projectId, memberships: membershipIds } = memberIds;
    const single = membershipIds.length === 1;

    const confirm = async (handleClose) => {
        if (!checks.first || !checks.second) { toast.error("Both confirmations required"); return; }
        try {
            setLoading(true);
            await axios.delete("/api/memberships/remove", {
                data: { projectId, memberIds: membershipIds },
                headers: AUTH(),
            });
            onSuccess();
            handleClose();
            toast.success(`Member${single ? "" : "s"} removed`);
        } catch (err) {
            toast.error(err.response?.data?.msg || err.message);
        } finally { setLoading(false); }
    };

    const tog = (key) => () => setChecks(p => ({ ...p, [key]: !p[key] }));

    return (
        <Dialogue onClose={onClose}>
            {({ handleClose }) => (
                <div className={styles.dialogue}>
                    {loading && <Spinner />}
                    <div className={`${styles.rail} ${styles.railRed}`} />
                    <div className={styles.head}>
                        <span className={styles.headEyebrow}>team</span>
                        <p className={styles.headTitle}>Remove {single ? "member" : `${membershipIds.length} members`}</p>
                    </div>
                    <div className={styles.body}>
                        <p className={styles.desc}>They lose access immediately. Review what happens to their work below.</p>
                        <div className={styles.checkList}>
                            <div className={styles.checkRow}>
                                <input type="checkbox" className={styles.check} checked={checks.first} onChange={tog("first")} />
                                <span className={styles.checkLabel}>Their assigned tasks will be archived</span>
                            </div>
                            <div className={styles.checkRow}>
                                <input type="checkbox" className={styles.check} checked={checks.second} onChange={tog("second")} />
                                <span className={styles.checkLabel}>Their created tasks transfer to me</span>
                            </div>
                        </div>
                    </div>
                    <div className={styles.divider} style={{ marginTop: 16 }} />
                    <div className={styles.footer}>
                        <button className={styles.btnCancel} onClick={handleClose}>Cancel</button>
                        <button className={styles.btnRed} onClick={() => confirm(handleClose)}>Remove</button>
                    </div>
                </div>
            )}
        </Dialogue>
    );
}


/* DELETE MAILS ═════════════════════════════════════════════════════ */
export function DeleteMails({ onClose, selected }) {
    const [loading, setLoading] = useState(false);

    const confirm = async (handleClose) => {
        try {
            setLoading(true);
            await axios.patch("/api/inbox/delete", { selected }, { headers: AUTH() });
            handleClose();
            toast.success("Deletion in progress…");
        } catch (err) {
            toast.error(err.response?.data?.msg || err.message);
        } finally { setLoading(false); }
    };

    return (
        <Dialogue onClose={onClose}>
            {({ handleClose }) => (
                <div className={styles.dialogue}>
                    {loading && <Spinner />}
                    <div className={`${styles.rail} ${styles.railRed}`} />
                    <div className={styles.head}>
                        <span className={styles.headEyebrow}>inbox</span>
                        <p className={styles.headTitle}>Delete {selected?.length ?? ""} mail{selected?.length !== 1 ? "s" : ""}</p>
                    </div>
                    <div className={styles.body}>
                        <p className={styles.desc}>Some of these may not have been read yet. They'll be gone permanently.</p>
                    </div>
                    <div className={styles.divider} style={{ marginTop: 16 }} />
                    <div className={styles.footer}>
                        <button className={styles.btnCancel} onClick={handleClose}>Cancel</button>
                        <button className={styles.btnRed} onClick={() => confirm(handleClose)}>Delete</button>
                    </div>
                </div>
            )}
        </Dialogue>
    );
}


/* TRANSFER OWNERSHIP ═══════════════════════════════════════════════ */
export function TransferOwnership({ onClose, payload }) {
    const [checks, setChecks] = useState({ first: false, second: false });
    const [typed, setTyped] = useState("");
    const [loading, setLoading] = useState(false);
    const phrase = `${payload.owner.firstname.trim()}/${payload.project.name.trim()}`;

    const transfer = async (handleClose) => {
        if (!checks.first || !checks.second) { toast.error("Both confirmations required"); return; }
        if (typed.trim() !== phrase) { toast.error("Phrase doesn't match"); return; }
        try {
            setLoading(true);
            await axios.post("/api/memberships/transfer-ownership/offer", {
                projectId: payload.project._id,
                adminId: payload.admin._id,
            }, { headers: AUTH() });
            handleClose();
            toast.success("Transfer offer sent");
        } catch (err) {
            toast.error(err.response?.data?.msg || err.message);
        } finally { setLoading(false); }
    };

    const tog = (key) => () => setChecks(p => ({ ...p, [key]: !p[key] }));

    return (
        <Dialogue onClose={onClose}>
            {({ handleClose }) => (
                <div className={styles.dialogue}>
                    {loading && <Spinner />}
                    <div className={`${styles.rail} ${styles.railYellow}`} />
                    <div className={styles.head}>
                        <span className={styles.headEyebrow}>ownership</span>
                        <p className={styles.headTitle}>Transfer ownership</p>
                    </div>
                    <div className={styles.body}>
                        <div className={styles.transferRow}>
                            <div className={styles.transferAvatar}><img src={payload.owner.profileImage.url} alt="" /></div>
                            <div className={styles.transferProject}><img src={payload.project.projectImage.url} alt="" /></div>
                            <div className={styles.transferAvatar}><img src={payload.admin.profileImage.url} alt="" /></div>
                            <span className={styles.transferLabel}>{payload.owner.firstname} → {payload.admin.firstname}</span>
                        </div>
                        <p className={styles.desc}>You'll become an admin once they accept. The offer can be declined.</p>
                        <div className={styles.checkList}>
                            <div className={styles.checkRow}>
                                <input type="checkbox" className={styles.check} checked={checks.first} onChange={tog("first")} />
                                <span className={styles.checkLabel}>This person is the right candidate for ownership</span>
                            </div>
                            <div className={styles.checkRow}>
                                <input type="checkbox" className={styles.check} checked={checks.second} onChange={tog("second")} />
                                <span className={styles.checkLabel}>I'll lose owner privileges and become an admin</span>
                            </div>
                        </div>
                        <div className={styles.inputGroup}>
                            <label>Type <span className={styles.confirmPhrase}>{phrase}</span> to confirm</label>
                            <input type="text" placeholder={phrase} onChange={(e) => setTyped(e.target.value)} />
                        </div>
                    </div>
                    <div className={styles.divider} style={{ marginTop: 16 }} />
                    <div className={styles.footer}>
                        <button className={styles.btnCancel} onClick={handleClose}>Cancel</button>
                        <button className={styles.btnRed} onClick={() => transfer(handleClose)}>Transfer</button>
                    </div>
                </div>
            )}
        </Dialogue>
    );
}


/* OWNERSHIP RESPONSE ═══════════════════════════════════════════════ */
export function OwnershipResponse({ onClose, payload }) {
    const [status, setStatus] = useState("PENDING");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetch = async () => {
            try {
                setLoading(true);
                const res = await axios.get(`/api/memberships/transfer-ownership/${payload.offerId}`, { headers: AUTH() });
                setStatus(res.data.status);
            } catch (err) {
                toast.error(err.response?.data?.msg || err.message);
            } finally { setLoading(false); }
        };
        fetch();
    }, [payload.offerId]);

    const respond = async (handleClose, action) => {
        try {
            setLoading(true);
            await axios.patch(`/api/memberships/transfer-ownership/${action}`, { offerId: payload.offerId }, { headers: AUTH() });
            handleClose();
            toast.success(action === "accept" ? "Offer accepted" : "Offer declined");
        } catch (err) {
            toast.error(err.response?.data?.msg || err.message);
        } finally { setLoading(false); }
    };

    return (
        <Dialogue onClose={onClose}>
            {({ handleClose }) => (
                <div className={styles.dialogue}>
                    {loading && <Spinner />}
                    <div className={`${styles.rail} ${styles.railYellow}`} />
                    <div className={styles.head}>
                        <span className={styles.headEyebrow}>ownership</span>
                        <p className={styles.headTitle}>Ownership offer</p>
                    </div>
                    <div className={styles.body}>
                        <div className={styles.transferRow}>
                            <div className={styles.transferAvatar}><img src={payload.owner.profileImage.url} alt="" /></div>
                            <div className={styles.transferProject}><img src={payload.project.projectImage.url} alt="" /></div>
                            <div className={styles.transferAvatar}><img src={payload.admin.profileImage.url} alt="" /></div>
                            <span className={styles.transferLabel}>{payload.owner.firstname} is offering you {payload.project.name}</span>
                        </div>
                        <p className={styles.desc}>Accepting makes you the project owner. The current owner becomes an admin.</p>
                    </div>
                    <div className={styles.divider} style={{ marginTop: 16 }} />
                    <div className={styles.footer}>
                        {status === "PENDING"
                            ? <>
                                <button className={styles.btnCancel} onClick={() => respond(handleClose, "decline")}>Decline</button>
                                <button className={styles.btnGreen} onClick={() => respond(handleClose, "accept")}>Accept</button>
                            </>
                            : <button className={`${styles.btnCancel} ${styles.btnFull}`} disabled>Offer {status.toLowerCase()}</button>
                        }
                    </div>
                </div>
            )}
        </Dialogue>
    );
}


/* DELETE PROJECT ═══════════════════════════════════════════════════ */
export function DeleteProject({ onClose, project }) {
    const [checked, setChecked] = useState(false);
    const [typed, setTyped] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const phrase = `${project.name}/goodbye`;

    const confirm = async (handleClose) => {
        if (!checked) { toast.error("Check the confirmation box"); return; }
        if (typed !== phrase) { toast.error("Phrase doesn't match"); return; }
        try {
            setLoading(true);
            await axios.delete(`/api/projects/project/${project._id}`, { headers: AUTH() });
            handleClose();
            navigate("/dashboard");
            toast.success("Project deleted");
        } catch (err) {
            toast.error(err.response?.data?.msg || err.message);
        } finally { setLoading(false); }
    };

    return (
        <Dialogue onClose={onClose}>
            {({ handleClose }) => (
                <div className={styles.dialogue}>
                    {loading && <Spinner />}
                    <div className={`${styles.rail} ${styles.railRed}`} />
                    <div className={styles.head}>
                        <span className={styles.headEyebrow}>danger zone</span>
                        <p className={styles.headTitle}>Delete project</p>
                    </div>
                    <div className={styles.body}>
                        <p className={styles.desc}>Every board, task, and member record will be permanently erased. No recovery.</p>
                        <div className={styles.checkList}>
                            <div className={styles.checkRow}>
                                <input type="checkbox" className={styles.check} checked={checked} onChange={() => setChecked(p => !p)} />
                                <span className={styles.checkLabel}>I understand this is permanent and cannot be undone</span>
                            </div>
                        </div>
                        <div className={styles.inputGroup}>
                            <label>Type <span className={styles.confirmPhrase}>{phrase}</span> to confirm</label>
                            <input type="text" placeholder={phrase} onChange={(e) => setTyped(e.target.value)} />
                        </div>
                    </div>
                    <div className={styles.divider} style={{ marginTop: 16 }} />
                    <div className={styles.footer}>
                        <button className={styles.btnCancel} onClick={handleClose}>Cancel</button>
                        <button className={styles.btnRed} onClick={() => confirm(handleClose)}>Delete project</button>
                    </div>
                </div>
            )}
        </Dialogue>
    );
}


/* PROMOTE MEMBER ═══════════════════════════════════════════════════ */
export function PromoteMember({ onClose, membershipId, onSuccess }) {
    const [loading, setLoading] = useState(false);

    const confirm = async (handleClose) => {
        try {
            setLoading(true);
            await axios.patch("/api/memberships/change-role/promote", { membershipId }, { headers: AUTH() });
            onSuccess();
            handleClose();
            toast.success("Member promoted to Admin");
        } catch (err) {
            toast.error(err.response?.data?.msg || err.message);
        } finally { setLoading(false); }
    };

    return (
        <Dialogue onClose={onClose}>
            {({ handleClose }) => (
                <div className={styles.dialogue}>
                    {loading && <Spinner />}
                    <div className={`${styles.rail} ${styles.railBlue}`} />
                    <div className={styles.head}>
                        <span className={styles.headEyebrow}>roles</span>
                        <p className={styles.headTitle}>Promote to admin</p>
                    </div>
                    <div className={styles.body}>
                        <p className={styles.desc}>Admins can manage tasks, boards, and invite new members to the project.</p>
                    </div>
                    <div className={styles.divider} style={{ marginTop: 16 }} />
                    <div className={styles.footer}>
                        <button className={styles.btnCancel} onClick={handleClose}>Cancel</button>
                        <button className={styles.btnBlue} onClick={() => confirm(handleClose)}>Promote</button>
                    </div>
                </div>
            )}
        </Dialogue>
    );
}


/* DEMOTE ADMIN ═════════════════════════════════════════════════════ */
export function DemoteAdmin({ onClose, membershipId, onSuccess }) {
    const [loading, setLoading] = useState(false);

    const confirm = async (handleClose) => {
        try {
            setLoading(true);
            await axios.patch("/api/memberships/change-role/demote", { membershipId }, { headers: AUTH() });
            onSuccess();
            handleClose();
            toast.success("Admin demoted to Member");
        } catch (err) {
            toast.error(err.response?.data?.msg || err.message);
        } finally { setLoading(false); }
    };

    return (
        <Dialogue onClose={onClose}>
            {({ handleClose }) => (
                <div className={styles.dialogue}>
                    {loading && <Spinner />}
                    <div className={`${styles.rail} ${styles.railRed}`} />
                    <div className={styles.head}>
                        <span className={styles.headEyebrow}>roles</span>
                        <p className={styles.headTitle}>Demote to member</p>
                    </div>
                    <div className={styles.body}>
                        <p className={styles.desc}>They'll lose admin privileges and revert to standard member access.</p>
                    </div>
                    <div className={styles.divider} style={{ marginTop: 16 }} />
                    <div className={styles.footer}>
                        <button className={styles.btnCancel} onClick={handleClose}>Cancel</button>
                        <button className={styles.btnRed} onClick={() => confirm(handleClose)}>Demote</button>
                    </div>
                </div>
            )}
        </Dialogue>
    );
}