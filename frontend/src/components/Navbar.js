import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./Navbar.css";

function Navbar({ user, setUser }) {

    const [menuOpen, setMenuOpen] = useState(false);
    const [userName, setUserName] = useState("");

    const navigate = useNavigate();


    // ==========================================
    // GET CURRENT LOGGED-IN USER
    // ==========================================

    const loadUser = () => {

        let name = "";

        // ------------------------------------------
        // OPTION 1: USER OBJECT
        // ------------------------------------------

        const storedUser = localStorage.getItem("user");

        if (storedUser) {

            try {

                const userData = JSON.parse(storedUser);

                name =
                    userData?.name ||
                    userData?.full_name ||
                    userData?.username ||
                    userData?.user_name ||
                    "";

            } catch (error) {

                console.log(
                    "Unable to read stored user:",
                    error
                );

            }

        }


        // ------------------------------------------
        // OPTION 2: user_name
        // ------------------------------------------

        if (!name) {

            name =
                localStorage.getItem("user_name") ||
                "";

        }


        // ------------------------------------------
        // OPTION 3: name
        // ------------------------------------------

        if (!name) {

            name =
                localStorage.getItem("name") ||
                "";

        }


        setUserName(name);

    };


    // ==========================================
    // LOAD USER
    // ==========================================

    useEffect(() => {

        loadUser();


        // ------------------------------------------
        // CUSTOM LOGIN / LOGOUT EVENT
        // ------------------------------------------

        const handleAuthChange = () => {

            loadUser();

        };


        // ------------------------------------------
        // STORAGE EVENT
        // ------------------------------------------

        const handleStorageChange = (event) => {

            if (
                event.key === "user" ||
                event.key === "user_name" ||
                event.key === "name" ||
                event.key === "access_token" ||
                event.key === "token"
            ) {

                loadUser();

            }

        };


        window.addEventListener(
            "authChanged",
            handleAuthChange
        );


        window.addEventListener(
            "storage",
            handleStorageChange
        );


        return () => {

            window.removeEventListener(
                "authChanged",
                handleAuthChange
            );

            window.removeEventListener(
                "storage",
                handleStorageChange
            );

        };

    }, []);


    // ==========================================
    // USER INITIAL
    // ==========================================

    const initial = userName
        ? userName.charAt(0).toUpperCase()
        : "U";


    // ==========================================
    // LOGOUT
    // ==========================================

    const handleLogout = () => {

        // ------------------------------------------
        // REMOVE AUTHENTICATION DATA
        // ------------------------------------------

        localStorage.removeItem("token");
        localStorage.removeItem("access_token");


        // ------------------------------------------
        // REMOVE USER INFORMATION
        // ------------------------------------------

        localStorage.removeItem("user");
        localStorage.removeItem("user_name");
        localStorage.removeItem("name");


        // ------------------------------------------
        // REMOVE USER-SPECIFIC APPLICATION DATA
        // ------------------------------------------

        localStorage.removeItem("resumeResult");
        localStorage.removeItem("resume_result");


        // ------------------------------------------
        // CLEAR REACT USER STATE
        // ------------------------------------------

        if (setUser) {

            setUser(null);

        }


        // ------------------------------------------
        // CLEAR NAVBAR USER STATE
        // ------------------------------------------

        setUserName("");
        setMenuOpen(false);


        // ------------------------------------------
        // TELL ENTIRE APPLICATION AUTH CHANGED
        // ------------------------------------------

        window.dispatchEvent(
            new Event("authChanged")
        );


        // ------------------------------------------
        // GO TO LOGIN
        // ------------------------------------------

        navigate(
            "/login",
            {
                replace: true
            }
        );

    };


    // ==========================================
    // CLOSE MOBILE MENU
    // ==========================================

    const closeMenu = () => {

        setMenuOpen(false);

    };


    return (

        <header className="navbar">

            <div className="navbar-inner">


                {/* =================================
                    BRAND
                ================================= */}

                <NavLink
                    to="/"
                    className="navbar-brand"
                    onClick={closeMenu}
                >

                    <div className="brand-icon">

                        <span>
                            🤖
                        </span>

                    </div>


                    <div className="brand-content">

                        <span className="brand-name">
                            CareerForge
                        </span>

                        <span className="brand-ai">
                            AI
                        </span>

                    </div>

                </NavLink>


                {/* =================================
                    DESKTOP NAVIGATION
                ================================= */}

                <nav className="desktop-navigation">

                    <NavLink
                        to="/"
                        className={({ isActive }) =>
                            `nav-link ${
                                isActive
                                    ? "active-nav"
                                    : ""
                            }`
                        }
                    >
                        <span className="nav-icon"></span>
                        <span>Dashboard</span>
                    </NavLink>


                    <NavLink
                        to="/interview"
                        className={({ isActive }) =>
                            `nav-link ${
                                isActive
                                    ? "active-nav"
                                    : ""
                            }`
                        }
                    >
                        <span className="nav-icon"></span>
                        <span>Interview Prep</span>
                    </NavLink>


                    <NavLink
                        to="/jobs"
                        className={({ isActive }) =>
                            `nav-link ${
                                isActive
                                    ? "active-nav"
                                    : ""
                            }`
                        }
                    >
                        <span className="nav-icon"></span>
                        <span>Jobs</span>
                    </NavLink>


                    <NavLink
                        to="/mock"
                        className={({ isActive }) =>
                            `nav-link ${
                                isActive
                                    ? "active-nav"
                                    : ""
                            }`
                        }
                    >
                        <span className="nav-icon"></span>
                        <span>Mock Interview</span>
                    </NavLink>


                    <NavLink
                        to="/coding"
                        className={({ isActive }) =>
                            `nav-link ${
                                isActive
                                    ? "active-nav"
                                    : ""
                            }`
                        }
                    >
                        <span className="nav-icon"></span>
                        <span>Coding</span>
                    </NavLink>


                    <NavLink
                        to="/projects"
                        className={({ isActive }) =>
                            `nav-link ${
                                isActive
                                    ? "active-nav"
                                    : ""
                            }`
                        }
                    >
                        <span className="nav-icon"></span>
                        <span>Projects</span>
                    </NavLink>

                </nav>


                {/* =================================
                    DESKTOP USER
                ================================= */}

                <div className="desktop-user-section">

                    <div className="user-profile">

                        <div className="user-avatar">

                            {initial}

                        </div>


                        <div className="user-details">

                            <span className="user-name">

                                {userName || "User"}

                            </span>


                            <span className="user-role">

                                Career Explorer

                            </span>

                        </div>

                    </div>


                    <div className="user-divider"></div>


                    <button
                        className="logout-button"
                        onClick={handleLogout}
                        title="Logout"
                    >

                        <span className="logout-icon">
                            ↪
                        </span>

                        <span>
                            Logout
                        </span>

                    </button>

                </div>


                {/* =================================
                    MOBILE MENU BUTTON
                ================================= */}

                <button
                    className={`mobile-menu-button ${
                        menuOpen
                            ? "menu-open"
                            : ""
                    }`}
                    onClick={() =>
                        setMenuOpen(!menuOpen)
                    }
                    aria-label="Toggle navigation menu"
                    aria-expanded={menuOpen}
                >

                    <span></span>
                    <span></span>
                    <span></span>

                </button>

            </div>


            {/* =================================
                MOBILE MENU
            ================================= */}

            <div
                className={`mobile-menu ${
                    menuOpen
                        ? "mobile-menu-visible"
                        : ""
                }`}
            >

                {/* MOBILE USER */}

                <div className="mobile-user-section">

                    <div className="mobile-user-avatar">

                        {initial}

                    </div>


                    <div className="mobile-user-info">

                        <span className="mobile-user-name">

                            {userName || "User"}

                        </span>


                        <span className="mobile-user-label">

                            Career Explorer

                        </span>

                    </div>

                </div>


                <div className="mobile-menu-divider"></div>


                {/* MOBILE NAVIGATION */}

                <nav className="mobile-navigation">

                    <NavLink
                        to="/"
                        onClick={closeMenu}
                        className={({ isActive }) =>
                            `mobile-nav-link ${
                                isActive
                                    ? "mobile-active-nav"
                                    : ""
                            }`
                        }
                    >
                        <span className="mobile-nav-icon">
                            ⌂
                        </span>
                        <span>Dashboard</span>
                    </NavLink>


                    <NavLink
                        to="/interview"
                        onClick={closeMenu}
                        className={({ isActive }) =>
                            `mobile-nav-link ${
                                isActive
                                    ? "mobile-active-nav"
                                    : ""
                            }`
                        }
                    >
                        <span className="mobile-nav-icon">
                            ◈
                        </span>
                        <span>Interview Prep</span>
                    </NavLink>


                    <NavLink
                        to="/jobs"
                        onClick={closeMenu}
                        className={({ isActive }) =>
                            `mobile-nav-link ${
                                isActive
                                    ? "mobile-active-nav"
                                    : ""
                            }`
                        }
                    >
                        <span className="mobile-nav-icon">
                            ▣
                        </span>
                        <span>Jobs</span>
                    </NavLink>


                    <NavLink
                        to="/mock"
                        onClick={closeMenu}
                        className={({ isActive }) =>
                            `mobile-nav-link ${
                                isActive
                                    ? "mobile-active-nav"
                                    : ""
                            }`
                        }
                    >
                        <span className="mobile-nav-icon">
                            ◉
                        </span>
                        <span>Mock Interview</span>
                    </NavLink>


                    <NavLink
                        to="/coding"
                        onClick={closeMenu}
                        className={({ isActive }) =>
                            `mobile-nav-link ${
                                isActive
                                    ? "mobile-active-nav"
                                    : ""
                            }`
                        }
                    >
                        <span className="mobile-nav-icon">
                            &lt;/&gt;
                        </span>
                        <span>Coding</span>
                    </NavLink>


                    <NavLink
                        to="/projects"
                        onClick={closeMenu}
                        className={({ isActive }) =>
                            `mobile-nav-link ${
                                isActive
                                    ? "mobile-active-nav"
                                    : ""
                            }`
                        }
                    >
                        <span className="mobile-nav-icon">
                            ✦
                        </span>
                        <span>Projects</span>
                    </NavLink>

                </nav>


                <div className="mobile-menu-divider"></div>


                {/* MOBILE LOGOUT */}

                <button
                    className="mobile-logout-button"
                    onClick={handleLogout}
                >

                    <span>
                        ↪
                    </span>

                    <span>
                        Logout
                    </span>

                </button>

            </div>

        </header>

    );

}

export default Navbar;