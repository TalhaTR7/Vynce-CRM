import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import axios from "axios";
import styles from "./css/Resources.module.scss";

export default function Resources() {
    const { name } = useParams();
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get(`/api/resources/${name}`)
            .then(res => setContent(res.data.text))
            .finally(() => setLoading(false));
    }, [name]);

    if (loading) return <div className={styles.loading}>Loading...</div>;

    return (
        <div className={styles.canvas}>
            <div className={styles.container}>
                <div className={styles.markdown}>
                    <ReactMarkdown>{content}</ReactMarkdown>
                </div>
            </div>
        </div>
    );
}
