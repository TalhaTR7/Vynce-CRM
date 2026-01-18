import styles   from "../css/Footer.module.scss"
import sponsor1 from "../assets/sponsor-1.png"
import sponsor2 from "../assets/sponsor-2.png"
import sponsor3 from "../assets/sponsor-3.png"
import sponsor4 from "../assets/sponsor-4.png"
import sponsor5 from "../assets/sponsor-5.png"
import favicon  from "../assets/favicon.svg"
import globe    from "../assets/language.svg"


export function Sponsors() {
    return (
        <div className={styles.sponsors}>
            <img src={sponsor1} />
            <img src={sponsor2} />
            <img src={sponsor3} />
            <img src={sponsor4} />
            <img src={sponsor5} />
        </div>
    )
}

export function Copyrights() {
    return (
        <div className={styles.copyrights}>
            <div className={styles.documents}>
                <p>© 2024 Vynce Productions, Inc.</p>
                <span>·</span>
                <p className={styles.document}>No Privacy</p>
                <span>·</span>
                <p className={styles.document}>No Policy</p>
                <span>·</span>
                <p className={styles.document}>No T&Cs</p>
            </div>
            <div className={styles.language}>
                <img src={globe} />
                <p>English (US)</p>
            </div>
        </div>
    )
}


export function Weblinks() {
    return (
        <div className={styles.weblinks}>
            <h5>Inspiring future gateways</h5>
            <div className={styles.links}>
                <div className={styles.columns}>
                    <h6>Product</h6>
                    <ul>
                        <li><a>Atomations</a></li>
                        <li><a>Integrations</a></li>
                        <li><a>Chat</a></li>
                        <li><a>Projects</a></li>
                        <li><a>API</a></li>
                        <li><a>Calendar</a></li>
                        <li><a>Docs and Wikis</a></li>
                    </ul>
                </div>
                <div className={styles.columns}>
                    <h6>Community</h6>
                    <ul>
                        <li><a>About Us</a></li>
                        <li><a>Careers</a></li>
                        <li><a>Customers</a></li>
                        <li><a>Reviews</a></li>
                        <li><a>Events</a></li>
                    </ul>
                </div>
                <div className={styles.columns}>
                    <h6>Help</h6>
                    <ul>
                        <li><a>Support</a></li>
                        <li><a>Contact Us</a></li>
                        <li><a>Import</a></li>
                        <li><a>Demo</a></li>
                        <li><a>Roadmap</a></li>
                        <li><a>Sitemap</a></li>
                        <li><a>Walkthrough</a></li>
                    </ul>
                </div>
                <div className={styles.columns}>
                    <h6>Resources</h6>
                    <ul>
                        <li><a>Webinars</a></li>
                        <li><a>Blog</a></li>
                        <li><a>Research</a></li>
                        <li><a>Articles</a></li>
                        <li><a>Documents</a></li>
                        <li><a>Manual</a></li>
                    </ul>
                </div>
                <img src={favicon} />
            </div>
        </div>
    )
}



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