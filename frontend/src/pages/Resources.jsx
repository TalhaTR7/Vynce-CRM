import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Copyrights, Weblinks } from "../components/Footer";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import axios from "axios";
import styles from "./css/Resources.module.scss";
import favicon from "../assets/icons/favicon.svg";

export default function Resources() {
    const { name } = useParams();
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(true);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        axios.get(`/api/resources/${name}`)
            .then(res => setContent(res.data.text))
            .finally(() => setLoading(false));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [name]);

    useEffect(() => {
        const link = document.querySelector("link[rel='icon']");
        link.href = favicon;
        document.title = "Vynce | More Than a CRM";

        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    if (loading) return <div className={styles.loading}>Loading...</div>;

    return (
        <div className={styles.canvas}>
            <header className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}>
                <Link to={"/"} className={styles.logo}>
                    <img className={styles.logoImg} src={favicon} />
                    <span className={styles.logoText}>Vynce</span>
                </Link>
                <div className={styles.headerActions}>
                    <Link to={"/login"} className={styles.btnGhost}>Login</Link>
                    <Link to={"/signup"} className={styles.btnPrimary}>Get started →</Link>
                </div>
            </header>
            <div className={styles.container}>
                <div className={styles.markdown}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {content}
                    </ReactMarkdown>
                </div>
            </div>
            <Weblinks />
            <Copyrights />
        </div>
    );
}
