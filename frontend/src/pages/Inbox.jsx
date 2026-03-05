// Notifications inbox page
import favicon from "../assets/icons/favicon.svg";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import styles from "../css/Inbox.module.scss";
import delete_svg from "../assets/icons/delete.svg";
import read_svg from "../assets/icons/read.svg";
import search_svg from "../assets/icons/search.svg";
import left_svg from "../assets/icons/left.svg";
import right_svg from "../assets/icons/right.svg";
import emptyBox_svg from "../assets/icons/emptyBox.svg";
import sponsor from "../assets/sponsors/sponsor-0.png";
import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { useModal } from "../context/ModalContext";
import axios from "axios";


function Inbox() {
    const { notifications, refreshNotifications } = useOutletContext();
    const [currentPage, setCurrentPage] = useState(1);
    const [searchValue, setSearchValue] = useState("");
    const [selected, setSelected] = useState([]);
    const itemsPerPage = 10;
    const { openModal } = useModal();

    /* ── Page title ───────────────────────────────────────────── */
    useEffect(() => {
        const link = document.querySelector("link[rel='icon']");
        link.href = favicon;
        document.title = "Vynce | Inbox";
    }, []);

    /* ── Reset to page 1 on search change ─────────────────────── */
    useEffect(() => { setCurrentPage(1); }, [searchValue]);

    /* ── Filtering + pagination ───────────────────────────────── */
    const filteredNotifications = notifications.filter(mail =>
        !searchValue || mail.title.toLowerCase().startsWith(searchValue.toLowerCase())
    );
    const totalCount = filteredNotifications.length;
    const totalPages = Math.ceil(totalCount / itemsPerPage);
    const lowerBound = (currentPage - 1) * itemsPerPage;
    const upperBound = lowerBound + itemsPerPage;
    const currentMails = filteredNotifications.slice(lowerBound, upperBound);

    const lower = totalCount === 0 ? 0 : lowerBound + 1;
    const upper = Math.min(upperBound, totalCount);

    /* ── Selection ────────────────────────────────────────────── */
    const allSelected = notifications.length > 0 && selected.length === notifications.length;
    const toggleSelectAll = () => allSelected
        ? setSelected([])
        : setSelected(notifications.map(m => m._id));
    const toggleSelect = (id) => setSelected(prev =>
        prev.includes(id) ? prev.filter(_id => _id !== id) : [...prev, id]
    );

    /* ── Actions ──────────────────────────────────────────────── */
    const handleRead = async (id) => {
        try {
            await axios.patch(`/api/inbox/read`, { mailId: id }, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
        } catch (err) { console.error(err); }
        finally { refreshNotifications(); }
    };

    const handleMultipleReads = async () => {
        try {
            await axios.patch(`/api/inbox/read-multiple`, { selected }, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
        } catch (err) { console.error(err); }
        finally { refreshNotifications(); }
    };

    /* ── Icon helper ──────────────────────────────────────────── */
    function formatIcon(icon) {
        if (icon.type === "SVG") return icon.refId;
        const build = (type, refId) => `/api/uploads/${type}/${refId}.png`;
        return icon.type === "USER"
            ? build("users", icon.refId)
            : build("projects", icon.refId);
    }


    return (
        <div className={styles.canvas}>
            <Header />
            <div className={styles.container}>
                <Sidebar />

                <main className={styles.inbox}>

                    {/* ── Toolbar ──────────────────────────────── */}
                    <div className={styles.toolbar}>

                        {/* Select all */}
                        <div className={styles.selectAllWrapper}>
                            <input
                                type="checkbox"
                                id="select-all"
                                className={styles.selectAllCheckbox}
                                checked={allSelected}
                                onChange={toggleSelectAll} />
                            <label htmlFor="select-all" className={styles.selectAllLabel}>
                                Select all
                            </label>
                        </div>

                        {/* Delete selected */}
                        <button
                            className={`${styles.toolbarButton} ${styles.toolbarButtonDestructive}`}
                            onClick={() => selected.length > 0 && openModal("DELETE_MAILS", { selected })}>
                            <img src={delete_svg} />
                        </button>

                        {/* Mark selected as read */}
                        <button
                            className={styles.toolbarButton}
                            onClick={handleMultipleReads}>
                            <img src={read_svg} />
                        </button>

                        {/* Search */}
                        <div className={styles.searchField}>
                            <img src={search_svg} />
                            <input
                                type="text"
                                placeholder="Search mails..."
                                onChange={(e) => setSearchValue(e.target.value)} />
                        </div>

                        {/* Range */}
                        <span className={styles.rangeLabel}>{lower}-{upper} of {totalCount}</span>

                        {/* Pagination */}
                        <div className={styles.paginationArrows}>
                            <button
                                className={styles.paginationArrow}
                                onClick={() => setCurrentPage(p => p - 1)}
                                disabled={currentPage <= 1}>
                                <img src={left_svg} />
                            </button>
                            <button
                                className={styles.paginationArrow}
                                onClick={() => setCurrentPage(p => p + 1)}
                                disabled={currentPage >= totalPages}>
                                <img src={right_svg} />
                            </button>
                        </div>

                    </div>

                    {/* ── Mail list / empty state ───────────────── */}
                    {totalCount > 0 ? (
                        <div className={styles.mailList}>
                            {currentMails.map(mail => {
                                const userEntry = mail.users.find(u => u._id === localStorage.getItem("_id"));
                                const isRead = userEntry?.read ?? true;
                                const createdAt = new Date(mail.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

                                const iconClass = [
                                    styles.mailIcon,
                                    mail.icon.type === "USER" ? styles.mailIconUser : "",
                                    mail.icon.type === "PROJECT" ? styles.mailIconProject : "",
                                ].join(" ");

                                return (
                                    <Link
                                        key={mail._id}
                                        to={mail.action.type === "NAVIGATE" ? mail.action.url : ""}
                                        className={`${styles.mailRow} ${!isRead ? styles.mailRowUnread : ""}`}
                                        onClick={async () => {
                                            if (mail.type === "PROJECT_INVITATION")
                                                openModal("INVITE_RESPONSE", { payload: mail.payload });
                                            if (mail.type === "OWNERSHIP_REQUEST")
                                                openModal("OWNERSHIP_RESPONSE", { payload: mail.payload });
                                            await handleRead(mail._id);
                                        }}>
                                        <input
                                            type="checkbox"
                                            className={styles.mailCheckbox}
                                            checked={selected.includes(mail._id)}
                                            onClick={(e) => e.stopPropagation()}
                                            onChange={() => toggleSelect(mail._id)} />
                                        <div className={iconClass}>
                                            <img src={formatIcon(mail.icon)} />
                                        </div>
                                        <div className={styles.mailContent}>
                                            <p className={styles.mailMeta}>
                                                {mail.type?.replace(/_/g, " ").toLowerCase()}
                                            </p>
                                            <p className={`${styles.mailTitle} ${!isRead ? styles.mailTitleUnread : ""}`}>
                                                {mail.title}
                                            </p>
                                        </div>
                                        <span className={styles.mailTime}>{createdAt}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <img src={emptyBox_svg} className={styles.emptyStateIcon} />
                            <p className={styles.emptyStateMessage}>
                                Nothing here yet. Seems like your inbox chose peace.
                            </p>
                        </div>
                    )}

                    {/* ── Sponsor strip ────────────────────────── */}
                    <div className={styles.sponsorStrip}>
                        <p>Powered by</p>
                        <img src={sponsor} />
                    </div>

                </main>
            </div>
        </div>
    );
}

export default Inbox;