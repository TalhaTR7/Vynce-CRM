
import styles from "../css/Signup.module.scss"
import favicon from "../assets/favicon.svg"
import bg_obj_1 from "../assets/auth_bg_1.png"
import bg_obj_2 from "../assets/auth_bg_2.png"
import { Copyrights } from "../components/Footer"
import hide_password from "../assets/hide.svg"
import show_password from "../assets/show.svg"
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useEffect, useState } from 'react'
import axios from 'axios'


function Signup() {

    useEffect(() => {
        let link = document.querySelector("link[rel='icon']");
        link.href = favicon;
        document.title = "Vynce | More Than a CRM";
    });

    const navigate = useNavigate();

    const [firstname, setFirstname] = useState("");
    const [lastname, setLastname] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }
        else if (password.length < 5) {
            toast.error("Passwords must be 8 characters long");
            return;
        }
        else {
            try {
                const { data } = await axios.post("http://localhost:5000/api/auth/signup", {
                    firstname, lastname, email, password
                });
                toast.success("Signup successful:", data);
                localStorage.setItem("token", data.token);
                navigate("/dashboard");
            } catch (err) {
                toast.error(err.response?.data?.msg || "Signup failed");
            }
        }
    }


    return (
        <div className={styles.signup}>
            <div className={styles.content}>
                <h2>Welcome!</h2>
                <p>Already have an account? <Link to={"/login"} className={styles.highlight}>Sign in</Link></p>
                <form className={styles.signupForm} onSubmit={handleSubmit}>
                    <div className={styles.fullName}>
                        <input
                            type="text"
                            placeholder="First name"
                            className={styles.inputField}
                            value={firstname}
                            onChange={(e) => setFirstname(e.target.value)} />
                        <input
                            type="text"
                            placeholder="Last name"
                            className={styles.inputField}
                            value={lastname}
                            onChange={(e) => setLastname(e.target.value)} />
                    </div>
                    <input
                        type="email"
                        placeholder="Email address"
                        className={styles.inputField}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)} />
                    <div className={styles.passwordWrapper}>
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Create password"
                            className={styles.inputField}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)} />
                        <span
                            className={styles.eyeIcon}
                            onClick={() => setShowPassword((prev) => !prev)}
                            role="button"
                            aria-label={showPassword ? "Hide password" : "Show password"} >
                            <img
                                src={showPassword ? hide_password : show_password}
                                alt={showPassword ? "Hide password" : "Show password"} />
                        </span>
                    </div>
                    <div className={styles.passwordWrapper}>
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Confirm password"
                            className={styles.inputField}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)} />
                        <span
                            className={styles.eyeIcon}
                            onClick={() => setShowPassword((prev) => !prev)}
                            role="button"
                            aria-label={showPassword ? "Hide password" : "Show password"} >
                            <img
                                src={showPassword ? hide_password : show_password}
                                alt={showPassword ? "Hide password" : "Show password"} />
                        </span>
                    </div>
                    <p className={styles.message}>By clicking “Create account” you agree to our <span>Terms & Conditions</span> and <span>Privacy Policy</span></p>
                    <button type="submit" className={styles.signupButton}>Create account</button>
                </form>
            </div>
            <img src={bg_obj_1} className={styles.bgImg1} />
            <img src={bg_obj_2} className={styles.bgImg2} />
            <Link to={"/"}><img src={favicon} className={styles.backButton} /></Link>
            <Copyrights />
        </div>
    )
}

export default Signup