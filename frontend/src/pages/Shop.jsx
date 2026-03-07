// Shop page — placeholder
import { useEffect } from "react";
import favicon from "../assets/icons/favicon.svg";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

function Shop() {
    useEffect(() => {
        const link = document.querySelector("link[rel='icon']");
        link.href = favicon;
        document.title = "Vynce | Shop";
    }, []);

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
            <Header />
            <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
                <Sidebar />
                <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", color: "var(--text-muted, #888)" }}>
                    <p>Shop coming soon.</p>
                </main>
            </div>
        </div>
    );
}

export default Shop;
