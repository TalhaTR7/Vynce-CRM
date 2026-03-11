import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./css/Landing.module.scss";
import Footer from "../components/Footer";
import projectScreenshot from "../assets/backgrounds/preview.png";
import favicon from "../assets/icons/favicon.svg";

import bolt_svg from "../assets/icons/bolt.svg";
import mood_svg from "../assets/icons/mood.svg";
import analytics_svg from "../assets/icons/analytics.svg";
import trophy_svg from "../assets/icons/trophy.svg";
import link_svg from "../assets/icons/link.svg";
import shield_svg from "../assets/icons/shield.svg";

// ── Constants ────────────────────────────────────────────────────────
const TICKER_ITEMS = [
    "Project Management", "Team Collaboration", "Team Interaction",
    "Smart Workflows", "Emotion Tracking", "Real-time Analytics",
    "Goal Setting", "Streak Rewards", "AI Insights", "Team Morale",
];

const FEATURES = [
    { icon: bolt_svg, title: "Smart Task Engine", desc: "AI surfaces priority tasks before your team even asks, adapting to your workflow patterns in real time." },
    { icon: mood_svg, title: "Emotion-Aware Goals", desc: "Track team sentiment alongside deadlines. Know when to push and when to pause — data-backed empathy." },
    { icon: analytics_svg, title: "Live Analytics", desc: "Dashboards that breathe. Every metric updates instantly, giving you a pulse on productivity." },
    { icon: trophy_svg, title: "Reward Engine", desc: "Turn mundane tasks into milestones. Streaks, XP, and leaderboards keep energy high." },
    { icon: link_svg, title: "Deep Integrations", desc: "Connect Slack, Notion, Linear, GitHub, and 80+ tools. Vynce becomes the intelligent layer on top of your stack." },
    { icon: shield_svg, title: "Enterprise Security", desc: "SOC 2 Type II certified. End-to-end encryption, audit logs, and granular permissions." },
];

const STATS = [
    { val: "12k", suf: "+", label: "Teams onboarded", trend: "↑ 34% this quarter" },
    { val: "98", suf: "%", label: "Customer satisfaction", trend: "Industry avg: 71%" },
    { val: "3", suf: "×", label: "Productivity boost", trend: "Self-reported avg" },
    { val: "4.9", suf: "★", label: "Average rating", trend: "Across 2,400+ reviews" },
];

// ── Landing ──────────────────────────────────────────────────────────
export default function Landing() {
    const [scrolled, setScrolled] = useState(false);
    const tickerFull = [...TICKER_ITEMS, ...TICKER_ITEMS];

    useEffect(() => {
        const link = document.querySelector("link[rel='icon']");
        link.href = favicon;
        document.title = "Vynce | More Than a CRM";

        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <>
            <div className={styles.page}>

                {/* ── Header ── */}
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

                {/* ── Hero ── */}
                <section className={styles.hero}>
                    <div className={styles.heroSideLines} />

                    {/* Centered copy */}
                    <div className={styles.heroCenter}>
                        <div className={styles.eyebrow}>
                            <span className={styles.eyebrowDot} />
                            <span className={styles.eyebrowText}>Next-gen productivity platform</span>
                        </div>
                        <h1 className={styles.heroHeading}>
                            Productivity that<br />rewards <em>you</em>
                        </h1>
                        <p className={styles.heroBody}>
                            A project management platform that understands tasks, teams, and people —
                            turning everyday work into a genuinely motivating experience.
                        </p>
                        <div className={styles.heroCta}>
                            <Link to={"/signup"} className={styles.btnCta}>
                                Get started for free
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                    <polyline points="12 5 19 12 12 19" />
                                </svg>
                            </Link>
                            <span className={styles.ctaFootnote}>No credit card required</span>
                        </div>
                    </div>

                    {/* Real project screenshot */}
                    <div className={styles.heroScreenshot}>
                        <div className={styles.screenshotGlow} />
                        <img
                            src={projectScreenshot}
                            alt="Vynce project view"
                            className={styles.screenshotImg}
                        />
                    </div>

                </section>

                {/* ── Ticker ── */}
                <div className={styles.tickerWrap}>
                    <div className={styles.tickerTrack}>
                        {tickerFull.map((item, i) => (
                            <span key={i} className={styles.tickerItem}>
                                {item}<span className={styles.tickerSep}>✦</span>
                            </span>
                        ))}
                    </div>
                </div>

                {/* ── Stats ── */}
                <div className={styles.statsSection}>
                    {STATS.map((s, i) => (
                        <div key={i} className={styles.statCell}>
                            <div className={styles.statNumber}>
                                {s.val}<span className={styles.statSuffix}>{s.suf}</span>
                            </div>
                            <div className={styles.statLabel}>{s.label}</div>
                            <div className={styles.statTrend}>{s.trend}</div>
                        </div>
                    ))}
                </div>

                {/* ── Features ── */}
                <div className={styles.featuresStrip}>
                    <div className={styles.featuresHeader}>
                        <div className={styles.featuresHeaderLeft}>
                            <div className={styles.sectionLabel}>Why Vynce</div>
                            <h2 className={styles.sectionHeading}>Everything your team needs. Nothing it doesn't.</h2>
                        </div>
                        <div className={styles.featuresHeaderRight}>
                            <p className={styles.featuresSubtext}>
                                Built for teams that care about momentum. Vynce combines smart task management, team wellbeing, and real rewards into one focused workspace.
                            </p>
                            <div className={styles.featuresMiniStats}>
                                {[
                                    { val: "80", suf: "+", label: "Integrations" },
                                    { val: "12k", suf: "+", label: "Active teams" },
                                    { val: "4.9", suf: "★", label: "App rating" },
                                ].map((s, i) => (
                                    <div key={i} className={styles.featuresMiniStat}>
                                        <div className={styles.featuresMiniVal}>{s.val}<span>{s.suf}</span></div>
                                        <div className={styles.featuresMiniLabel}>{s.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className={styles.featuresGrid}>
                        {FEATURES.map((f, i) => (
                            <div key={i} className={styles.featureCard}>
                                <div className={styles.featureIcon}>
                                    <img src={f.icon} alt={f.title} />
                                </div>
                                <div className={styles.featureTitle}>{f.title}</div>
                                <div className={styles.featureDesc}>{f.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── CTA Banner ── */}
                <div className={styles.ctaBanner}>
                    <div className={styles.ctaBannerLabel}>Get started today</div>
                    <h2 className={styles.ctaBannerHeading}>
                        Ready to build a team that <span>loves</span> what it does?
                    </h2>
                    <div className={styles.ctaBannerActions}>
                        <Link to={"/signup"} className={styles.btnCtaLarge}>Start free forever →</Link>
                        <span className={styles.ctaNote}>Free forever · No card needed</span>
                    </div>
                </div>

                {/* ── Footer ── */}
                <Footer />

            </div>
        </>
    );
}