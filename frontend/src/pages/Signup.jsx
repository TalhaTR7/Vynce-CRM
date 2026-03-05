// Signup page — split-panel layout (mirrors Login)
import styles from "../css/Signup.module.scss"
import favicon from "../assets/icons/favicon.svg"
import logo from "../assets/backgrounds/logo.png"
import heroArt from "../assets/backgrounds/landing.png"
import hide_svg from "../assets/icons/hide.svg"
import show_svg from "../assets/icons/show.svg"
import { Copyrights } from "../components/Footer"
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useEffect, useState } from 'react'
import axios from 'axios'


function Signup() {

    useEffect(() => {
        const link = document.querySelector("link[rel='icon']");
        link.href = favicon;
        document.title = "Vynce | Create Account";
    }, []);

    const navigate = useNavigate();

    const [firstname, setFirstname] = useState("");
    const [lastname, setLastname] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }
        if (password.length < 5) {
            toast.error("Password must be at least 5 characters");
            return;
        }
        try {
            const { data } = await axios.post("/api/auth/signup", {
                firstname, lastname, email, password,
            });
            toast.success("Account created!");
            localStorage.setItem("token", data.token);
            navigate("/dashboard");
        } catch (err) {
            toast.error(err.response?.data?.msg || "Signup failed");
        }
    };


    return (
        <div className={styles.signupPage}>

            {/* ══ LEFT — Branded panel (same as Login) ══════════════ */}
            <aside className={styles.brandPanel}>

                <Link to={"/"} className={styles.brandPanelHeader}>
                    <img src={logo} className={styles.brandLogo} />
                </Link>

                <div className={styles.brandArtArea}>
                    <img src={heroArt} className={styles.brandArtImage} />
                </div>

                <div className={styles.brandPanelFooter}>
                    <p className={styles.brandTagline}>
                        Your best work<br />
                        starts <span className={styles.brandTaglineAccent}>here.</span>
                    </p>
                    <p className={styles.brandTaglineSubtext}>
                        Join thousands of teams already using Vynce.
                    </p>
                </div>

            </aside>

            {/* ══ RIGHT — Signup form panel ════════════════════════ */}
            <main className={styles.formPanel}>

                {/* Top-right "already have account?" */}
                <div className={styles.formPanelTopBar}>
                    <span className={styles.formPanelTopBarText}>Already have an account?</span>
                    <Link to="/login" className={styles.formPanelTopBarLink}>Sign in</Link>
                </div>

                <div className={styles.formWrapper}>

                    <span className={styles.formEyebrow}>✦ &nbsp; Create your account</span>
                    <h1 className={styles.formHeading}>Get started</h1>
                    <p className={styles.formSubheading}>Free forever. No credit card required.</p>

                    <form className={styles.signupForm} onSubmit={handleSubmit}>

                        {/* First + Last name side-by-side */}
                        <div className={styles.nameRow}>
                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel} htmlFor="firstname">First name</label>
                                <input
                                    id="firstname"
                                    type="text"
                                    placeholder="Shahid"
                                    className={styles.inputField}
                                    value={firstname}
                                    onChange={(e) => setFirstname(e.target.value)}
                                    required
                                />
                            </div>
                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel} htmlFor="lastname">Last name</label>
                                <input
                                    id="lastname"
                                    type="text"
                                    placeholder="Afridi"
                                    className={styles.inputField}
                                    value={lastname}
                                    onChange={(e) => setLastname(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel} htmlFor="email">Work email</label>
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
                                    placeholder="Min. 5 characters"
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

                        {/* Confirm password */}
                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel} htmlFor="confirm-password">Confirm password</label>
                            <div className={styles.passwordWrapper}>
                                <input
                                    id="confirm-password"
                                    type={showConfirm ? "text" : "password"}
                                    placeholder="Re-enter password"
                                    className={styles.inputField}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                                <span
                                    className={styles.passwordVisibilityToggle}
                                    onClick={() => setShowConfirm((prev) => !prev)}
                                    role="button"
                                    aria-label={showConfirm ? "Hide password" : "Show password"}
                                >
                                    <img src={showConfirm ? show_svg : hide_svg} />
                                </span>
                            </div>
                        </div>

                        {/* Legal */}
                        <p className={styles.legalMessage}>
                            By creating an account you agree to our{" "}
                            <span className={styles.legalLink}>Terms & Conditions</span>
                            {" "}and{" "}
                            <span className={styles.legalLink}>Privacy Policy</span>.
                        </p>

                        {/* Submit */}
                        <button type="submit" className={styles.submitButton}>
                            Create account
                        </button>

                    </form>

                    {/* OR divider + OAuth */}
                    <div className={styles.formDivider}>
                        <span className={styles.formDividerText}>OR CONTINUE WITH</span>
                    </div>

                    <div className={styles.oauthRow}>
                        <button type="button" className={styles.oauthButton}>
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Google
                        </button>
                        <button type="button" className={styles.oauthButton}>
                            <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                            </svg>
                            GitHub
                        </button>
                    </div>

                </div>

                {/* Copyrights strip */}
                <div className={styles.formPanelBottom}>
                    <Copyrights />
                </div>

            </main>

        </div>
    );
}

export default Signup;