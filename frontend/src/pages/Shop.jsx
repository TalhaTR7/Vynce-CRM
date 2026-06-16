import { useEffect, useState } from "react";
import favicon from "../assets/icons/favicon.svg";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import coin_svg from "../assets/icons/coin.svg";
import shop_svg from "../assets/icons/shop.svg";
import trophy_svg from "../assets/icons/trophy.svg";
import bolt_svg from "../assets/icons/bolt.svg";
import shield_svg from "../assets/icons/shield.svg";
import target_svg from "../assets/icons/target.svg";
import globe_svg from "../assets/icons/globe.svg";
import lock_svg from "../assets/icons/lock.svg";
import styles from "./css/Shop.module.scss";

const ITEMS = [
    {
        id: "streak_shield",
        icon: shield_svg,
        label: "PROTECTION",
        name: "Streak Shield",
        tagline: "Guard your weekly streak from a missed day.",
        price: 120,
        accent: "green",
        ribbon: "POPULAR",
    },
    {
        id: "xp_surge",
        icon: bolt_svg,
        label: "BOOST",
        name: "XP Surge",
        tagline: "Double your Ethereum gains for 24 hours.",
        price: 200,
        accent: "blue",
        ribbon: "LIMITED",
    },
    {
        id: "bounty_boost",
        icon: target_svg,
        label: "MULTIPLIER",
        name: "Bounty Boost",
        tagline: "Add +0.5× to your next completed task reward.",
        price: 80,
        accent: "green",
        ribbon: null,
    },
    {
        id: "podium_token",
        icon: trophy_svg,
        label: "PRESTIGE",
        name: "Podium Token",
        tagline: "Pin yourself to the top of the leaderboard for one cycle.",
        price: 500,
        accent: "gold",
        ribbon: "RARE",
    },
];

const ETH_PACKS = [
    {
        id: "pack_starter",
        eth: 10,
        pkr: 2000,
        label: "STARTER",
        tagline: "Perfect for trying out your first power-up.",
        bonus: null,
        featured: false,
    },
    {
        id: "pack_hustler",
        eth: 25,
        pkr: 4500,
        label: "HUSTLER",
        tagline: "A little extra — save ₨500 vs buying twice.",
        bonus: "+2 bonus ETH",
        featured: false,
    },
    {
        id: "pack_grinder",
        eth: 50,
        pkr: 10000,
        label: "GRINDER",
        tagline: "The serious stack. Fuel your entire season.",
        bonus: "+8 bonus ETH",
        featured: true,
    },
    {
        id: "pack_legend",
        eth: 120,
        pkr: 20000,
        label: "LEGEND",
        tagline: "Max value. Dominate every leaderboard cycle.",
        bonus: "+25 bonus ETH",
        featured: false,
    },
];

function ShopCard({ item, onClick, owned }) {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            className={`${styles.card} ${styles[`card_${item.accent}`]} ${owned ? styles.cardOwned : ""}`}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={() => onClick(item)}
        >
            <div className={styles.cardNoise} />

            {item.ribbon && (
                <span className={`${styles.ribbon} ${styles[`ribbon_${item.accent}`]}`}>
                    {item.ribbon}
                </span>
            )}

            <div className={`${styles.iconWrap} ${styles[`iconWrap_${item.accent}`]}`}>
                <img src={item.icon} alt="" className={styles.itemIcon} />
            </div>

            <div className={styles.cardBody}>
                <span className={`${styles.itemLabel} ${styles[`itemLabel_${item.accent}`]}`}>
                    {item.label}
                </span>
                <p className={styles.itemName}>{item.name}</p>
                <p className={styles.itemTagline}>{item.tagline}</p>
            </div>

            <div className={styles.cardFooter}>
                <div className={styles.priceRow}>
                    <img src={coin_svg} alt="ETH" className={styles.coinIcon} />
                    <span className={`${styles.priceValue} ${styles[`priceValue_${item.accent}`]}`}>
                        {item.price}
                    </span>
                    <span className={styles.priceCurrency}>ETH</span>
                </div>
                <button
                    className={`${styles.buyBtn} ${styles[`buyBtn_${item.accent}`]} ${owned ? styles.buyBtnOwned : ""}`}
                    tabIndex={-1}
                >
                    {owned ? "OWNED" : hovered ? "REDEEM →" : "REDEEM"}
                </button>
            </div>
        </div>
    );
}

function EthPackCard({ pack, onBuy, purchased }) {
    const [hovered, setHovered] = useState(false);
    const perEth = Math.round(pack.pkr / pack.eth);

    return (
        <div
            className={`${styles.ethCard} ${pack.featured ? styles.ethCardFeatured : ""} ${purchased ? styles.ethCardPurchased : ""}`}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={() => onBuy(pack)}
        >
            <div className={styles.cardNoise} />

            {pack.featured && (
                <span className={styles.ethRibbon}>BEST VALUE</span>
            )}

            {/* left: amount */}
            <div className={styles.ethLeft}>
                <div className={styles.ethAmountRow}>
                    <img src={coin_svg} alt="" className={styles.ethCoinBig} />
                    <span className={styles.ethAmount}>{pack.eth}</span>
                    {pack.bonus && (
                        <span className={styles.ethBonus}>{pack.bonus}</span>
                    )}
                </div>
                <span className={styles.ethPackLabel}>{pack.label} PACK</span>
                <p className={styles.ethTagline}>{pack.tagline}</p>
            </div>

            {/* right: price + cta */}
            <div className={styles.ethRight}>
                <div className={styles.ethPriceBlock}>
                    <span className={styles.ethPkr}>₨{pack.pkr.toLocaleString()}</span>
                    <span className={styles.ethPerUnit}>₨{perEth} / ETH</span>
                </div>
                <button
                    className={`${styles.ethBuyBtn} ${pack.featured ? styles.ethBuyBtnFeatured : ""} ${purchased ? styles.ethBuyBtnPurchased : ""}`}
                    tabIndex={-1}
                >
                    {purchased
                        ? "PURCHASED"
                        : hovered
                        ? "BUY NOW →"
                        : "BUY NOW"}
                </button>
            </div>
        </div>
    );
}

function Shop() {
    const [owned, setOwned]         = useState([]);
    const [flash, setFlash]         = useState(null);
    const [purchased, setPurchased] = useState([]);
    const [ethFlash, setEthFlash]   = useState(null);

    useEffect(() => {
        const link = document.querySelector("link[rel='icon']");
        link.href = favicon;
        document.title = "Vynce | Shop";
    }, []);

    function handleRedeem(item) {
        if (owned.includes(item.id)) return;
        setOwned(prev => [...prev, item.id]);
        setFlash(item.id);
        setTimeout(() => setFlash(null), 1200);
    }

    function handleBuyEth(pack) {
        if (purchased.includes(pack.id)) return;
        setPurchased(prev => [...prev, pack.id]);
        setEthFlash(pack.id);
        setTimeout(() => setEthFlash(null), 1200);
    }

    return (
        <div className={styles.canvas}>
            <Header />
            <div className={styles.container}>
                <Sidebar />

                <main className={styles.main}>
                    {/* ── page header ── */}
                    <div className={styles.pageHeader}>
                        <div className={styles.pageHeaderLeft}>
                            <div className={styles.pageTitleRow}>
                                <span className={styles.pageTitleDot} />
                                <h1 className={styles.pageTitle}>Shop</h1>
                            </div>
                            <p className={styles.pageSubtitle}>
                                Spend your Ethereum on power-ups &amp; perks
                            </p>
                        </div>
                        <div className={styles.balanceChip}>
                            <img src={coin_svg} alt="" className={styles.balanceCoin} />
                            <span className={styles.balanceAmount}>—</span>
                            <span className={styles.balanceLabel}>ETH</span>
                        </div>
                    </div>

                    {/* ── section 1: items ── */}
                    <div className={styles.sectionLabel}>
                        <div className={styles.sectionDot} />
                        <span className={styles.sectionText}>AVAILABLE ITEMS</span>
                        <div className={styles.sectionLine} />
                    </div>

                    <div className={styles.grid}>
                        {ITEMS.map(item => (
                            <div
                                key={item.id}
                                className={`${styles.cardWrap} ${flash === item.id ? styles.cardFlash : ""}`}
                            >
                                <ShopCard
                                    item={item}
                                    onClick={handleRedeem}
                                    owned={owned.includes(item.id)}
                                />
                            </div>
                        ))}
                    </div>

                    {/* ── section 2: buy ETH ── */}
                    <div className={styles.sectionLabel}>
                        <div className={styles.sectionDot} />
                        <span className={styles.sectionText}>BUY ETHEREUM</span>
                        <div className={styles.sectionLine} />
                        <div className={styles.sectionBadge}>
                            <img src={globe_svg} alt="" className={styles.sectionBadgeIcon} />
                            <span>PKR</span>
                        </div>
                    </div>

                    {/* secure notice */}
                    <div className={styles.secureNotice}>
                        <img src={lock_svg} alt="" className={styles.secureIcon} />
                        <p className={styles.secureText}>
                            Payments are processed securely. Ethereum is credited to your account instantly after confirmation.
                        </p>
                    </div>

                    <div className={styles.ethGrid}>
                        {ETH_PACKS.map(pack => (
                            <div
                                key={pack.id}
                                className={`${styles.ethCardWrap} ${ethFlash === pack.id ? styles.ethFlash : ""}`}
                            >
                                <EthPackCard
                                    pack={pack}
                                    onBuy={handleBuyEth}
                                    purchased={purchased.includes(pack.id)}
                                />
                            </div>
                        ))}
                    </div>

                    {/* ── coming soon strip ── */}
                    <div className={styles.comingSoon}>
                        <img src={shop_svg} alt="" className={styles.comingSoonIcon} />
                        <p className={styles.comingSoonText}>
                            More items dropping soon — check back after the next leaderboard reset.
                        </p>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default Shop;