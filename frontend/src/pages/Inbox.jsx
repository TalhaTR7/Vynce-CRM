
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import styles from "../css/Inbox.module.scss";
import delete_svg from "../assets/delete.svg";
import selectall_svg from "../assets/selectAll.svg";
import search_svg from "../assets/search.svg";
import left_svg from "../assets/left.svg";
import right_svg from "../assets/right.svg";
import { useState } from "react";


function Inbox() {

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const totalCount = 75;

    const getRange = () => {
        const lower = (currentPage - 1) * itemsPerPage + 1;
        const upper = Math.min(currentPage * itemsPerPage, totalCount);
        return { lower, upper };
    };

    const { lower, upper } = getRange();

    return (
        <div className={styles.canvas}>
            <Header />
            <div className={styles.container}>
                <Sidebar />
                <main className={styles.inbox}>
                    <div className={styles.inboxPane}>
                        <div className={styles.selectAll}>
                            <input type="checkbox" id="select-all" />
                            <label htmlFor="select-all">Select all</label>
                        </div>
                        <button className={styles.buttons}>
                            <img src={delete_svg} style={{height: "15px"}} />
                        </button>
                        <button className={styles.buttons}>
                            <img src={selectall_svg} style={{height: "12px"}} />
                        </button>
                        <div className={styles.search}>
                            <img src={search_svg} />
                            <input type="text" placeholder="Search" />
                        </div>
                        <p>{lower}-{upper} of {totalCount}</p>
                        <div className={styles.arrows}>
                            <img src={left_svg} />
                            <img src={right_svg} />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}

export default Inbox;