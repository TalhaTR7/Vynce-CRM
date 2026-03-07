import favicon from "../assets/icons/favicon.svg"
import styles from "./css/Footer.module.scss"
import sponsor1 from "../assets/sponsors/sponsor-1.png"
import sponsor2 from "../assets/sponsors/sponsor-2.png"
import sponsor3 from "../assets/sponsors/sponsor-3.png"
import sponsor4 from "../assets/sponsors/sponsor-4.png"
import sponsor5 from "../assets/sponsors/sponsor-5.png"
import globe_svg from "../assets/icons/globe.svg"


/* ── Sponsors Strip ──────────────────────────────────────────────── */
export function Sponsors() {
    return (
        <div className={styles.sponsorsStrip}>
            <img src={sponsor1} className={styles.sponsorLogo} />
            <img src={sponsor2} className={styles.sponsorLogo} />
            <img src={sponsor3} className={styles.sponsorLogo} />
            <img src={sponsor4} className={styles.sponsorLogo} />
            <img src={sponsor5} className={styles.sponsorLogo} />
        </div>
    )
}


/* ── Copyrights Bar ──────────────────────────────────────────────── */
export function Copyrights() {
    return (
        <div className={styles.copyrightsBar}>
            <div className={styles.copyrightsDocuments}>
                <p className={styles.copyrightsText}>© 2024 Vynce Productions, Inc.</p>
                <span className={styles.copyrightsDivider}>·</span>
                <p className={styles.copyrightsLink}>No Privacy</p>
                <span className={styles.copyrightsDivider}>·</span>
                <p className={styles.copyrightsLink}>No Policy</p>
                <span className={styles.copyrightsDivider}>·</span>
                <p className={styles.copyrightsLink}>No T&Cs</p>
            </div>
            <div className={styles.languageSelector}>
                <img src={globe_svg} className={styles.languageIcon} />
                <p className={styles.languageLabel}>English (US)</p>
            </div>
        </div>
    )
}


/* ── Weblinks Section ────────────────────────────────────────────── */
export function Weblinks() {
    return (
        <div className={styles.weblinksSection}>
            <h5 className={styles.weblinksTagline}>Inspiring future gateways</h5>
            <div className={styles.weblinksColumns}>

                <div className={styles.linkColumn}>
                    <h6 className={styles.linkColumnHeading}>Product</h6>
                    <ul className={styles.linkColumnList}>
                        <li><a className={styles.linkColumnItem}>Atomations</a></li>
                        <li><a className={styles.linkColumnItem}>Integrations</a></li>
                        <li><a className={styles.linkColumnItem}>Chat</a></li>
                        <li><a className={styles.linkColumnItem}>Projects</a></li>
                        <li><a className={styles.linkColumnItem}>API</a></li>
                        <li><a className={styles.linkColumnItem}>Calendar</a></li>
                        <li><a className={styles.linkColumnItem}>Docs and Wikis</a></li>
                    </ul>
                </div>

                <div className={styles.linkColumn}>
                    <h6 className={styles.linkColumnHeading}>Community</h6>
                    <ul className={styles.linkColumnList}>
                        <li><a className={styles.linkColumnItem}>About Us</a></li>
                        <li><a className={styles.linkColumnItem}>Careers</a></li>
                        <li><a className={styles.linkColumnItem}>Customers</a></li>
                        <li><a className={styles.linkColumnItem}>Reviews</a></li>
                        <li><a className={styles.linkColumnItem}>Events</a></li>
                    </ul>
                </div>

                <div className={styles.linkColumn}>
                    <h6 className={styles.linkColumnHeading}>Help</h6>
                    <ul className={styles.linkColumnList}>
                        <li><a className={styles.linkColumnItem}>Support</a></li>
                        <li><a className={styles.linkColumnItem}>Contact Us</a></li>
                        <li><a className={styles.linkColumnItem}>Import</a></li>
                        <li><a className={styles.linkColumnItem}>Demo</a></li>
                        <li><a className={styles.linkColumnItem}>Roadmap</a></li>
                        <li><a className={styles.linkColumnItem}>Sitemap</a></li>
                        <li><a className={styles.linkColumnItem}>Walkthrough</a></li>
                    </ul>
                </div>

                <div className={styles.linkColumn}>
                    <h6 className={styles.linkColumnHeading}>Resources</h6>
                    <ul className={styles.linkColumnList}>
                        <li><a className={styles.linkColumnItem}>Webinars</a></li>
                        <li><a className={styles.linkColumnItem}>Blog</a></li>
                        <li><a className={styles.linkColumnItem}>Research</a></li>
                        <li><a className={styles.linkColumnItem}>Articles</a></li>
                        <li><a className={styles.linkColumnItem}>Documents</a></li>
                        <li><a className={styles.linkColumnItem}>Manual</a></li>
                    </ul>
                </div>

                <img src={favicon} className={styles.weblinksCornerIcon} />

            </div>
        </div>
    )
}


/* ── Footer Root ─────────────────────────────────────────────────── */
function Footer() {
    return (
        <footer>
            <Sponsors />
            <Weblinks />
            <Copyrights />
        </footer>
    )
}


export default Footer