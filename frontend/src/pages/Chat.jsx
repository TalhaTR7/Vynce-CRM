// Direct message chat page
import favicon from "../assets/icons/favicon.svg";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import more_svg from "../assets/icons/more.svg";
import close_svg from "../assets/icons/close.svg";
import send_svg from "../assets/icons/send.svg";
import styles from "../css/Chat.module.scss";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import Loading from "../components/Loading";


function Chat() {
    const { id } = useParams();
    const navigate = useNavigate();
    const scrollRef = useRef(null);
    const dropdownRef = useRef(null);

    const [messages, setMessages] = useState([]);
    const [otherUser, setOtherUser] = useState(null);
    const [message, setMessage] = useState("");
    const [openDropdown, setOpenDropdown] = useState(false);

    /* ── Fetch messages (polled every 2s) ─────────────────────── */
    useEffect(() => {
        const fetchMessages = async () => {
            const token = localStorage.getItem("token");
            const currentUserId = localStorage.getItem("_id");
            const res = await axios.get(`/api/messages/chat/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const other = res.data.chat.participants.find(u => u._id !== currentUserId);
            setOtherUser(other);
            setMessages(res.data.messages);
        };
        fetchMessages();
        const interval = setInterval(fetchMessages, 2000);
        return () => clearInterval(interval);
    }, [id]);

    /* ── Close dropdown on outside click ─────────────────────── */
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target))
                setOpenDropdown(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    /* ── Page title ───────────────────────────────────────────── */
    useEffect(() => {
        const link = document.querySelector("link[rel='icon']");
        link.href = favicon;
        if (otherUser) document.title = `Vynce | ${otherUser.firstname} ${otherUser.lastname}`;
    }, [otherUser]);

    /* ── Auto-scroll to bottom when near bottom ──────────────── */
    useEffect(() => {
        const container = scrollRef.current;
        if (!container || messages.length === 0) return;
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
        if (isNearBottom)
            container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    }, [messages]);

    /* ── Guard ────────────────────────────────────────────────── */
    if (!messages || !otherUser) return <Loading />;

    /* ── Actions ──────────────────────────────────────────────── */
    const sendMessage = async () => {
        if (!message.trim()) return;
        try {
            const res = await axios.post(`/api/messages/user/${otherUser._id}`, { content: message }, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            setMessages(prev => [...prev, res.data.message]);
            scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
            setMessage("");
        } catch (err) { console.error(err); }
    };

    const closeChat = async () => {
        try {
            await axios.patch(`/api/messages/chat/${id}`, {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            navigate("/dashboard");
        } catch (err) { console.error(err); }
    };


    return (
        <div className={styles.canvas}>
            <Header />
            <div className={styles.container}>
                <Sidebar />

                <main className={styles.chat}>

                    {/* ── Chat header ──────────────────────────── */}
                    <div className={styles.chatHeader}>
                        <div className={styles.chatHeaderUser}>
                            <div className={styles.chatHeaderAvatar}>
                                <img src={otherUser.profileImage.url} />
                            </div>
                            <p className={styles.chatHeaderName}>
                                {otherUser.firstname} {otherUser.lastname}
                            </p>
                        </div>

                        <div className={styles.chatOptionsWrapper} ref={dropdownRef}>
                            <div
                                className={styles.chatOptionsButton}
                                onClick={() => setOpenDropdown(prev => !prev)}
                                role="button"
                                aria-label="Chat options">
                                <img src={more_svg} />
                            </div>
                            <ul className={`${styles.chatDropdown} ${openDropdown ? styles.chatDropdownOpen : styles.chatDropdownClosed}`}>
                                <li className={`${styles.chatDropdownOption} ${styles.chatDropdownOptionDestructive}`} onClick={closeChat}>
                                    <img src={close_svg} />
                                    <span>Close chat</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* ── Message list ─────────────────────────── */}
                    <div className={styles.messageContainer} ref={scrollRef}>
                        {messages.map((msg, index) => {
                            const createdAt = new Date(msg.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
                            const prevSender = index > 0 ? messages[index - 1].sender._id : null;
                            const nextSender = index < messages.length - 1 ? messages[index + 1].sender._id : null;
                            const isGroupStart = prevSender !== msg.sender._id;
                            const isGroupEnd = nextSender !== msg.sender._id;

                            const rowClass = [
                                styles.messageRow,
                                msg.isMine ? styles.messageRowMine : styles.messageRowTheirs,
                                isGroupStart ? styles.messageRowGroupStart : styles.messageRowGrouped,
                            ].join(" ");

                            const bubbleClass = [
                                styles.messageBubble,
                                msg.isMine ? styles.messageBubbleMine : styles.messageBubbleTheirs,
                            ].join(" ");

                            if (!msg.isMine) return (
                                <div key={msg._id} className={rowClass}>
                                    {/* Avatar on last message of group, placeholder otherwise */}
                                    {isGroupEnd ?
                                        <div className={styles.messageAvatar}>
                                            <img src={msg.sender.profileImage.url} />
                                        </div>
                                        : <div className={styles.messageAvatarPlaceholder} />
                                    }
                                    <p className={bubbleClass}>{msg.content}</p>
                                    <span className={styles.messageTime}>{createdAt}</span>
                                </div>
                            );

                            return (
                                <div key={msg._id} className={rowClass}>
                                    <span className={styles.messageTime}>{createdAt}</span>
                                    <p className={bubbleClass}>{msg.content}</p>
                                    {isGroupEnd ?
                                        <div className={styles.messageAvatar}>
                                            <img src={msg.sender.profileImage.url} />
                                        </div>
                                        : <div className={styles.messageAvatarPlaceholder} />
                                    }
                                </div>
                            );
                        })}
                    </div>

                    {/* ── Input bar ────────────────────────────── */}
                    <div className={styles.chatInputBar}>
                        <input
                            type="text"
                            placeholder="Type a message…"
                            className={styles.chatInput}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    sendMessage();
                                }
                            }} />
                        <button className={styles.chatSendButton} onClick={sendMessage}>
                            <img src={send_svg} />
                        </button>
                    </div>

                </main>
            </div>
        </div>
    );
}

export default Chat;