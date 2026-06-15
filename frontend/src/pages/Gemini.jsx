// Ask AI chat page
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import favicon from "../assets/icons/favicon.svg";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import send_svg from "../assets/icons/send.svg";
import favicon_logo from "../assets/icons/favicon.svg";
import styles from "./css/Gemini.module.scss";
import axios from "axios";

const SYSTEM_PROMPT = `You are Vynce AI, an intelligent assistant embedded inside Vynce — a project management platform for teams. You help users with tasks, productivity, planning, writing, coding, and anything they need. Keep your tone sharp, helpful, and concise. You are not ChatGPT or any other AI — you are Vynce AI.`;

export default function Gemini() {
    const navigate = useNavigate();
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

    // Auto-scroll on new messages
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }, [messages, loading]);

    const buildHistory = () => {
        // Gemini expects alternating user/model turns
        return messages.map(m => ({
            role: m.role === "user" ? "user" : "model",
            parts: [{ text: m.content }]
        }));
    };

    const send = async () => {
        const text = input.trim();
        if (!text || loading) return;

        const userMsg = { role: "user", content: text };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const history = buildHistory();
            const contents = [
                ...history,
                { role: "user", parts: [{ text }] }
            ];

            const res = await axios.post("/api/gemini/chat",
                { contents, system_instruction: { parts: [{ text: SYSTEM_PROMPT }] } },
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            );

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

    return (
        <div className={styles.canvas}>
            <Header />
            <div className={styles.container}>
                <Sidebar />

                <main className={styles.chat}>

                    {/* ── Header ── */}
                    <div className={styles.chatHeader}>
                        <button className={styles.backBtn} onClick={() => navigate(-1)} aria-label="Go back">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                        <div className={styles.chatHeaderAi}>
                            <div className={styles.aiAvatarSmall}>
                                <img src={favicon_logo} alt="Vynce AI" />
                            </div>
                            <div className={styles.chatHeaderInfo}>
                                <p className={styles.chatHeaderName}>Vynce AI</p>
                                <span className={styles.chatHeaderSub}>Powered by Gemini</span>
                            </div>
                        </div>
                        <div className={styles.chatHeaderRight} />
                    </div>

                    {/* ── Message list ── */}
                    <div className={styles.messageContainer} ref={scrollRef}>

                        {/* Empty state greeting */}
                        {isEmpty && !loading && (
                            <div className={styles.emptyState}>
                                <div className={styles.emptyAvatar}>
                                    <img src={favicon_logo} alt="" />
                                </div>
                                <h2 className={styles.emptyTitle}>Ask me anything</h2>
                                <p className={styles.emptySub}>Tasks, code, writing, planning — I'm here to help.</p>
                                <div className={styles.suggestions}>
                                    {[
                                        "Help me write a task description",
                                        "Review my project plan",
                                        "Explain a concept simply",
                                        "Write a follow-up email",
                                    ].map(s => (
                                        <button key={s} className={styles.suggestion} onClick={() => { setInput(s); inputRef.current?.focus(); }}>
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Message bubbles */}
                        {messages.map((msg, i) => {
                            const isUser = msg.role === "user";
                            const prevRole = i > 0 ? messages[i - 1].role : null;
                            const isGroupStart = prevRole !== msg.role;

                            return (
                                <div
                                    key={i}
                                    className={`${styles.messageRow} ${isUser ? styles.messageRowUser : styles.messageRowAi} ${isGroupStart ? styles.messageRowGroupStart : ""}`}
                                >
                                    {/* AI avatar — show on first of group */}
                                    {!isUser && isGroupStart && (
                                        <div className={styles.aiAvatar}>
                                            <img src={favicon_logo} alt="" />
                                        </div>
                                    )}
                                    {!isUser && !isGroupStart && (
                                        <div className={styles.aiAvatarPlaceholder} />
                                    )}

                                    <div className={`${styles.bubble} ${isUser ? styles.bubbleUser : styles.bubbleAi}`}>
                                        {msg.content}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Typing indicator */}
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

                    {/* ── Input bar ── */}
                    <div className={styles.inputWrap}>
                        <div className={styles.inputBar}>
                            <textarea
                                ref={inputRef}
                                className={styles.input}
                                placeholder="Ask anything…"
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
                                onClick={send}
                                disabled={!input.trim() || loading}
                                aria-label="Send"
                            >
                                <img src={send_svg} alt="" />
                            </button>
                        </div>
                        <p className={styles.disclaimer}>
                            By going back or closing the window, you end the temporary chat and you can never revisit these messages again
                        </p>
                    </div>

                </main>
            </div>
        </div>
    );
}