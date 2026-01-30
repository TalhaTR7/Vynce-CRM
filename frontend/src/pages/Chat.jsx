
import favicon from "../assets/icons/favicon.svg";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import coin_svg from "../assets/icons/coin.svg";
import send_svg from "../assets/icons/send.svg";
import styles from "../css/Chat.module.scss";
import { useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

function Chat() {
    const { id } = useParams();
    const [messages, setMessages] = useState([]);
    const [otherUser, setOtherUser] = useState(null);
    const [message, setMessage] = useState("");
    const scrollRef = useRef(null);

    useEffect(() => {
        const fetchMessages = async () => {
            const token = localStorage.getItem("token");
            const currentUserId = jwtDecode(token).id;
            const res = await axios.get(`http://localhost:5000/api/messages/chat/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const chatUsers = [res.data.chat.userId1, res.data.chat.userId2];
            const other = chatUsers.find(user => user._id !== currentUserId);
            setOtherUser(other);
            setMessages(res.data.messages);
        }
        fetchMessages();
        const interval = setInterval(fetchMessages, 2000);
        return () => clearInterval(interval);
    }, [id]);


    const deleteEmptyChat = async () => {
        try {
            await axios.delete(`http://localhost:5000/api/messages/chat/${id}/empty-chat`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        deleteEmptyChat();
    }, []);

    useEffect(() => {
        let link = document.querySelector("link[rel='icon']");
        link.href = favicon;
        document.title = `Vynce | ${otherUser?.firstname}  ${otherUser?.lastname}`;
    })

    useEffect(() => {
        const container = scrollRef.current;
        if (!container || messages.length === 0) return;

        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;

        if (isNearBottom) {
            container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
        }
    }, [messages]);

    if (!messages) return <p>Loading messages...</p>;
    if (!otherUser) return <p>Loading other user...</p>;

    const sendMessage = async () => {
        if (!message.trim()) return;
        try {
            const res = await axios.post(`http://localhost:5000/api/messages/user/${otherUser._id}`, {
                content: message
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            const pushMessage = res.data.message;
            setMessages(prev => [...prev, pushMessage]);
            scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
            setMessage("");
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className={styles.canvas}>
            <Header />
            <div className={styles.container}>
                <Sidebar />
                <main className={styles.chat}>
                    <div className={styles.userPane}>
                        <div className={styles.otherUser}>
                            <div className={styles.profileImage}>
                                <img src={otherUser.profileImage.url} />
                            </div>
                            <p>{otherUser.firstname} {otherUser.lastname}</p>
                        </div>
                        <button>
                            <img src={coin_svg} />
                            <p>Send ETH</p>
                        </button>
                    </div>
                    <div className={styles.messageContainer} ref={scrollRef}>
                        {messages.map((message, index) => {
                            const createdAt = new Date(message.createdAt).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                            });

                            const showProfileImage = index === 0 || messages[index - 1].sender._id !== message.sender._id;
                            const messageClass = `${styles.message} ${showProfileImage ? '' : ''}`;

                            if (!message.isMine) return (
                                <div key={message._id} className={messageClass} style={{ justifyContent: "flex-start" }}>
                                    <div className={styles.profileImage}>
                                        {showProfileImage && <img src={message.sender.profileImage.url} alt="" />}
                                    </div>
                                    <p className={styles.content}>{message.content}</p>
                                    <p className={styles.time}>{createdAt}</p>
                                </div>
                            )
                            else return (
                                <div key={message._id} className={messageClass} style={{ justifyContent: "flex-end" }}>
                                    <p className={styles.time}>{createdAt}</p>
                                    <p className={styles.content}>{message.content}</p>
                                    <div className={styles.profileImage}>
                                        {showProfileImage && <img src={message.sender.profileImage.url} alt="" />}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    <div className={styles.inputField}>
                        <input
                            type="text"
                            placeholder="Type a message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    sendMessage();
                                }
                            }} />
                        <button onClick={sendMessage}>
                            <img src={send_svg} />
                        </button>
                    </div>
                </main>
            </div>
        </div>
    )
}

export default Chat;
