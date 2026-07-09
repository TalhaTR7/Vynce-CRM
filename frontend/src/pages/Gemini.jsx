// Ask AI chat page
import { useEffect, useRef, useState } from "react";
import favicon from "../assets/icons/favicon.svg";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import send_svg from "../assets/icons/send.svg";
import favicon_logo from "../assets/icons/favicon.svg";
import styles from "./css/Gemini.module.scss";
import axios from "axios";

import hat_svg from "../assets/icons/hat.svg";
import project_svg from "../assets/icons/project.svg";
import add_svg from "../assets/icons/add.svg";
import task_svg from "../assets/icons/task.svg";
import comment_svg from "../assets/icons/comment.svg";

const SYSTEM_PROMPT = `You are Vynce AI, an intelligent assistant embedded inside Vynce — a project management platform for teams. You help users with tasks, productivity, planning, writing, coding, and anything they need. Keep your tone sharp, helpful, and concise. You are not Gemini or any other AI — you are Vynce AI.`;

const ACTION_CHIPS = [
    { icon: hat_svg, label: "learn", prompt: "I want to learn about Vynce — how does it work, what can I do here?" },
    { icon: project_svg, label: "create project", prompt: "I want to create a new project." },
    { icon: add_svg, label: "add board", prompt: "I want to add a board to one of my projects." },
    { icon: task_svg, label: "create task", prompt: "I want to create a task. I'll describe what needs to be done." },
    { icon: comment_svg, label: "chat", prompt: "I want to send a message to someone on my team." },
];

export default function Gemini() {
    const scrollRef = useRef(null);
    const inputRef = useRef(null);

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const link = document.querySelector("link[rel='icon']");
        link.href = favicon;
        document.title = "Vynce | Ask AI";
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }, [messages, loading]);

    const buildHistory = () => messages.map(m => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }]
    }));

    const send = async (text = input) => {
        const trimmed = text.trim();
        if (!trimmed || loading) return;

        setMessages(prev => [...prev, { role: "user", content: trimmed }]);
        setInput("");
        if (inputRef.current) inputRef.current.style.height = "auto";
        setLoading(true);

        try {
            const contents = [...buildHistory(), { role: "user", parts: [{ text: trimmed }] }];
            const res = await axios.post("/api/gemini/chat", {
                contents,
                system_instruction: { parts: [{ text: SYSTEM_PROMPT }] }
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });

            const reply = res.data?.candidates?.[0]?.content?.parts?.[0]?.text
                ?? "I couldn't generate a response. Please try again.";
            setMessages(prev => [...prev, { role: "ai", content: reply }]);
        } catch {
            setMessages(prev => [...prev, { role: "ai", content: "Something went wrong. Check your connection and try again." }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKey = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    };

    const isEmpty = messages.length === 0;

    const inputBar = (
        <div className={styles.inputBar}>
            <textarea
                ref={inputRef}
                className={styles.input}
                placeholder="How can I help you today?"
                value={input}
                rows={1}
                onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
                }}
                onKeyDown={handleKey}
            />
            <button
                className={`${styles.sendBtn} ${input.trim() && !loading ? styles.sendBtnActive : ""}`}
                onClick={() => send()}
                disabled={!input.trim() || loading}
                aria-label="Send"
            >
                <img src={send_svg} alt="" />
            </button>
        </div>
    );

    return (
        <div className={styles.canvas}>
            <Header />
            <div className={styles.container}>
                <Sidebar />
                <main className={styles.chat}>

                    {/* Message list */}
                    {!isEmpty && (
                        <div className={styles.messageContainer} ref={scrollRef}>
                            {messages.map((msg, i) => {
                                const isUser = msg.role === "user";
                                const prevRole = i > 0 ? messages[i - 1].role : null;
                                const isGroupStart = prevRole !== msg.role;
                                return (
                                    <div key={i} className={`${styles.messageRow} ${isUser ? styles.messageRowUser : styles.messageRowAi} ${isGroupStart ? styles.messageRowGroupStart : ""}`}                                    >
                                        {!isUser && isGroupStart && (
                                            <div className={styles.aiAvatar}>
                                                <img src={favicon_logo} alt="" />
                                            </div>
                                        )}
                                        {!isUser && !isGroupStart && <div className={styles.aiAvatarPlaceholder} />}
                                        <div className={`${styles.bubble} ${isUser ? styles.bubbleUser : styles.bubbleAi}`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                );
                            })}

                            {loading && (
                                <div className={`${styles.messageRow} ${styles.messageRowAi} ${styles.messageRowGroupStart}`}>
                                    <div className={styles.aiAvatar}>
                                        <img src={favicon_logo} alt="" />
                                    </div>
                                    <div className={`${styles.bubble} ${styles.bubbleAi} ${styles.bubbleTyping}`}>
                                        <span className={styles.dot} />
                                        <span className={styles.dot} />
                                        <span className={styles.dot} />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Empty state — everything centered together */}
                    {isEmpty && (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyHeading}>
                                <img src={favicon_logo} alt="" className={styles.emptyLogo} />
                                <h2 className={styles.emptyTitle}>Ask away</h2>
                            </div>

                            {inputBar}

                            <div className={styles.actionChips}>
                                {ACTION_CHIPS.map(chip => (
                                    <button key={chip.label} className={styles.actionChip} onClick={() => send(chip.prompt)}>
                                        <img src={chip.icon} className={styles.actionChipIcon} />
                                        {chip.label}
                                    </button>
                                ))}
                            </div>

                            <p className={styles.disclaimer}>
                                By going back or closing the window, you end the temporary chat and you can never revisit these messages again
                            </p>
                        </div>
                    )}

                    {/* Input wrap after conversation starts */}
                    {!isEmpty && (
                        <div className={styles.inputWrap}>
                            {inputBar}
                            <p className={styles.disclaimer}>
                                By going back or closing the window, you end the temporary chat and you can never revisit these messages again
                            </p>
                        </div>
                    )}

                </main>
            </div>
        </div>
    );
}