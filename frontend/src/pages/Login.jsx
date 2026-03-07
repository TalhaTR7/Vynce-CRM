// Login page — split-panel layout
import { Copyrights } from "../components/Footer";
import styles from "./css/Login.module.scss";
import favicon from "../assets/icons/favicon.svg";
import heroArt from "../assets/backgrounds/landing.png";
import logo from "../assets/backgrounds/logo.png";
import hide_svg from "../assets/icons/hide.svg";
import show_svg from "../assets/icons/show.svg";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";


function Login() {

    useEffect(() => {
        const link = document.querySelector("link[rel='icon']");
        link.href = favicon;
        document.title = "Vynce | Sign In";
    }, []);

    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { data } = await axios.post("/api/auth/login", {
                email,
                password,
            });
            localStorage.setItem("token", data.token);
            localStorage.setItem("_id", data.user._id);
            toast.success("Logged in successfully");
            navigate("/dashboard");
        } catch (err) {
            toast.error(err.response?.data?.msg || "Invalid credentials");
        }
    };


    return (
        <div className={styles.loginPage}>

            {/* ══ LEFT — Branded panel ══════════════════════════════ */}
            <aside className={styles.brandPanel}>

                <Link to={"/"} className={styles.brandPanelHeader}>
                    <img src={logo} className={styles.brandLogo} />
                </Link>

                <div className={styles.brandArtArea}>
                    <img src={heroArt} className={styles.brandArtImage} />
                </div>

                <div className={styles.brandPanelFooter}>
                    <p className={styles.brandTagline}>
                        Work that actually<br />
                        <span className={styles.brandTaglineAccent}>feels good.</span>
                    </p>
                    <p className={styles.brandTaglineSubtext}>
                        Vynce turns your team's effort into momentum.
                    </p>
                </div>

            </aside>

            {/* ══ RIGHT — Form panel ═══════════════════════════════ */}
            <main className={styles.formPanel}>

                {/* Top-right "no account?" link */}
                <div className={styles.formPanelTopBar}>
                    <span className={styles.formPanelTopBarText}>No account?</span>
                    <Link to="/signup" className={styles.formPanelTopBarLink}>Sign up free</Link>
                </div>

                <div className={styles.formWrapper}>

                    <span className={styles.formEyebrow}>✦ &nbsp; Sign in to Vynce</span>
                    <h1 className={styles.formHeading}>Welcome back</h1>
                    <p className={styles.formSubheading}>Enter your credentials to continue.</p>

                    <form className={styles.loginForm} onSubmit={handleSubmit}>

                        {/* Email */}
                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel} htmlFor="email">Email</label>
                            <input
                                id="email"
                                type="email"
                                placeholder="you@email.com"
                                className={styles.inputField}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        {/* Password */}
                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel} htmlFor="password">Password</label>
                            <div className={styles.passwordWrapper}>
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className={styles.inputField}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <span
                                    className={styles.passwordVisibilityToggle}
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    role="button"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    <img src={showPassword ? show_svg : hide_svg} />
                                </span>
                            </div>
                        </div>

                        {/* Remember me + Forgot password */}
                        <div className={styles.formMiscRow}>
                            <label className={styles.rememberMeLabel}>
                                <input
                                    type="checkbox"
                                    id="remember-me"
                                    className={styles.rememberMeCheckbox}
                                />
                                <span className={styles.rememberMeText}>Remember me</span>
                            </label>
                            <a className={styles.forgotPasswordLink}>Forgot password?</a>
                        </div>

                        {/* Submit */}
                        <button type="submit" className={styles.submitButton}>
                            Sign in
                        </button>

                    </form>

                    {/* OR divider */}
                    <div className={styles.formDivider}>
                        <span className={styles.formDividerText}>OR CONTINUE WITH</span>
                    </div>

                    {/* OAuth row */}
                    <div className={styles.oauthRow}>
                        <button type="button" className={styles.oauthButton}>
                            {/* Google icon */}
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Google
                        </button>
                        <button type="button" className={styles.oauthButton}>
                            {/* GitHub icon */}
                            <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                            </svg>
                            GitHub
                        </button>
                    </div>

                </div>

                {/* Copyrights at the very bottom */}
                <div className={styles.formPanelBottom}>
                    <Copyrights />
                </div>

            </main>

        </div>
    );
}

export default Login;