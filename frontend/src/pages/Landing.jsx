import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import styles from "../css/Landing.module.scss"
import Footer from "../components/Footer"
import favicon from "../assets/icons/favicon.svg"
import logo from "../assets/backgrounds/logo.png"
import heroObject from "../assets/backgrounds/landing.png"

function Landing() {

    useEffect(() => {
        const link = document.querySelector("link[rel='icon']");
        link.href = favicon;
        document.title = "Vynce | More Than a CRM";
    }, []);

    return (
        <div className={styles.landing}>

            {/* ── Header ───────────────────────────────────────── */}
            <header className={styles.header}>
                <Link to="/">
                    <img src={logo} className={styles.headerLogo} />
                </Link>
                <div className={styles.headerButtons}>
                    <Link to="/login">
                        <button className={styles.loginButton}>Login</button>
                    </Link>
                    <Link to="/signup">
                        <button className={styles.signupButton}>Sign up</button>
                    </Link>
                </div>
            </header>

            {/* ── Hero Content ─────────────────────────────────── */}
            <section className={styles.heroSection}>
                <h1 className={styles.heroHeading}>
                    Productivity that<br />
                    Rewards <em className={styles.heroHeadingAccent}>You</em>
                </h1>
                <p className={styles.heroDescription}>
                    A next-gen project management platform that understands tasks, teams,
                    and emotions — turning everyday work into a motivating experience.
                </p>
                <div className={styles.callToActionRow}>
                    <Link to="/signup">
                        <button className={styles.callToActionButton}>
                            Get started for free
                        </button>
                    </Link>
                    <span className={styles.callToActionNote}>No credit card required</span>
                </div>
            </section>

            {/* ── Decorative 3D Object ─────────────────────────── */}
            {/*
             * Wrapped in a div so we can attach the glow ::after pseudo-element
             * without interfering with the img's mix-blend-mode: screen.
             * The black background of the PNG becomes transparent via screen blending.
             */}
            <div className={styles.heroObjectWrapper}>
                <img
                    src={heroObject}
                    className={styles.heroObjectImage}
                />
            </div>

            {/* ── Social Proof Stats Bar ────────────────────────── */}
            <div className={styles.statsBar}>
                <div className={styles.statItem}>
                    <div className={styles.statItemValue}>
                        12k<span className={styles.statItemSuffix}>+</span>
                    </div>
                    <div className={styles.statItemLabel}>Teams onboarded</div>
                </div>
                <div className={styles.statItem}>
                    <div className={styles.statItemValue}>
                        98<span className={styles.statItemSuffix}>%</span>
                    </div>
                    <div className={styles.statItemLabel}>Customer satisfaction</div>
                </div>
                <div className={styles.statItem}>
                    <div className={styles.statItemValue}>
                        3<span className={styles.statItemSuffix}>x</span>
                    </div>
                    <div className={styles.statItemLabel}>Productivity boost reported</div>
                </div>
                <div className={styles.statItem}>
                    <div className={styles.statItemValue}>
                        4.9<span className={styles.statItemSuffix}>★</span>
                    </div>
                    <div className={styles.statItemLabel}>Average rating</div>
                </div>
            </div>

            <Footer />

        </div>
    )
}

export default Landing