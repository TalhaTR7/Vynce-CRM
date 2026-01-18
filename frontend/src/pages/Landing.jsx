import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import styles from "../css/Landing.module.scss"
import Footer from "../components/Footer"
import favicon from "../assets/favicon.svg"
import logo from "../assets/logo.png"
import object from "../assets/landing.png"


function Landing() {

    useEffect(() => {
        let link = document.querySelector("link[rel='icon']");
        link.href = favicon;
        document.title = "Vynce | More Than a CRM";
    });


    return (
        <div className={styles.landing}>
            <header>
                <Link to={"/"}><img src={logo} /></Link>
                <div className={styles.buttons}>
                    <Link to={"/login"}><button>Login</button></Link>
                    <Link to={"/signup"}><button>Signup</button></Link>
                </div>
            </header>
            <div className={styles.frontContent}>
                <h1>Productivity that Rewards You</h1>
                <Link to={"/signup"}><button>Get started for free!</button></Link>
                <p>A modern next-gen project management software that understands tasks, teams, and emotions – turning everyday work into a motivating experience</p>
            </div>
            <img src={object} className={styles.object} />
            <Footer />
        </div>
    )
}

export default Landing