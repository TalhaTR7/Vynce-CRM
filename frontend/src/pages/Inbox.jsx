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

    useEffect(() => {
        let link = document.querySelector("link[rel='icon']");
        link.href = favicon;
        document.title = "Vynce | More Than a CRM";
    }, []);

    const filteredNotifications = notifications.filter(mail => {
        if (!searchValue) return true;
        return mail.title.toLowerCase().startsWith(searchValue.toLowerCase());
    });

    const totalCount = filteredNotifications.length;
    const totalPages = Math.ceil(totalCount / itemsPerPage);

    const lowerBound = (currentPage - 1) * itemsPerPage;
    const upperBound = lowerBound + itemsPerPage;
    const currentMails = filteredNotifications.slice(lowerBound, upperBound);

    const nextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(p => p + 1);
        }
    };

    const prevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(p => p - 1);
        }
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [searchValue]);

    const lower = totalCount === 0 ? 0 : lowerBound + 1;
    const upper = Math.min(upperBound, totalCount);

    const handleClick = async (id) => {
        try {
            await axios.patch(`http://localhost:5000/api/inbox/read`, { mailId: id }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });
        } catch (err) {
            console.error(err);
        } finally {
            refreshNotifications();
        }
    };

    const handleMultpleReads = async () => {
        try {
            await axios.patch(`http://localhost:5000/api/inbox/read-multiple`, { selected }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });
        } catch (err) {
            console.error(err);
        } finally {
            refreshNotifications();
        }
    }

    const allSelected = notifications.length > 0 && selected.length === notifications.length;

    const toggleSelectAll = () => {
        if (allSelected) setSelected([]);
        else setSelected(notifications.map(mail => mail._id));
    };

    const toggleSelect = (id) => {
        setSelected(prev => prev.includes(id)
            ? prev.filter(_id => _id !== id)
            : [...prev, id]
        );
    };


    return (
        <div className={styles.canvas}>
            <Header />
            <div className={styles.container}>
                <Sidebar />
                <main className={styles.inbox}>
                    <div className={styles.inboxPane}>
                        <div className={styles.selectAll}>
                            <input type="checkbox" id="select-all" checked={allSelected} onChange={toggleSelectAll} />
                            <label htmlFor="select-all">Select all</label>
                        </div>
                        <button className={styles.buttons} onClick={() => selected.length > 0 ? openModal("DELETE_MAILS", { selected }) : null}>
                            <img src={delete_svg} style={{ opacity: "0.7" }} />
                        </button>
                        <button className={styles.buttons} onClick={() => handleMultpleReads()}>
                            <img src={read_svg} />
                        </button>
                        <div className={styles.search}>
                            <img src={search_svg} />
                            <input type="text" placeholder="Search" onChange={(e) => setSearchValue(e.target.value)} />
                        </div>
                        <p className={styles.range}>{lower}-{upper} of {totalCount}</p>
                        <div className={styles.arrows}>
                            <img src={left_svg} onClick={prevPage} />
                            <img src={right_svg} onClick={nextPage} />
                        </div>
                    </div>
                    {totalCount ?
                        <div className={styles.list}>
                            {
                                currentMails.filter(mail => {
                                    if (!searchValue) return true;
                                    const title = `${mail.title}`.toLowerCase();
                                    return title.startsWith(searchValue.toLowerCase());
                                }).map(mail => {
                                    const classname =
                                        mail.icon.type === "PROJECT"
                                            ? styles._project
                                            : mail.icon.type === "USER"
                                                ? styles._user
                                                : "";
                                    const createdAt = new Date(mail.createdAt).toLocaleDateString("en-GB", {
                                        day: "numeric",
                                        month: "short",
                                    });
                                    const userEntry = mail.users.find(user => user._id === localStorage.getItem("_id"));
                                    const isRead = userEntry.read;

                                    const formatIcon = (icon) => {
                                        switch (icon.type) {
                                            case "USER": return `http://localhost:5000/api/uploads/users/${icon.refId}.png`;
                                            case "PROJECT": return `http://localhost:5000/api/uploads/projects/${icon.refId}.png`;
                                            case "SVG": return icon.url;
                                            default: return null;
                                        }
                                    };

                                    return (
                                        <Link key={mail._id} to={mail.action.type === "NAVIGATE" && mail.action.url} className={styles.mail} onClick={async () => {
                                            mail.type === "PROJECT_INVITATION" &&
                                                openModal("INVITE_RESPONSE", { payload: mail.action.payload });
                                            mail.type === "OWNERSHIP_REQUEST" &&
                                                openModal("OWNERSHIP_RESPONSE", { payload: mail.action.payload });                                                
                                            await handleClick(mail._id);
                                        }}>
                                            <input type="checkbox" className={styles.checkbox} checked={selected.includes(mail._id)} onClick={(e) => e.stopPropagation()} onChange={() => toggleSelect(mail._id)} />
                                            <div className={`${styles.icon} ${classname}`}>
                                                <img src={formatIcon(mail.icon)} />
                                            </div>
                                            <div className={styles.info}>
                                                <p className={styles.meta}>Payload</p>
                                                <p className={styles.title} style={{ fontWeight: isRead ? 400 : 600 }}>{mail.title}</p>
                                            </div>
                                            <div style={{ flex: "1" }} />
                                            <span className={styles.time}>{createdAt}</span>
                                        </Link>
                                    );
                                })
                            }
                        </div>
                        :
                        <div className={styles.emptyInbox}>
                            <img src={emptyBox_svg} />
                            <p>Nothing here yet. Seems to be your inbox chose peace</p>
                        </div>
                    }
                </main>
            </div>
        </div>
    )
}

export default Inbox;