import { Link } from "react-router-dom";
import "../styles/NavBar.css";
import CompassIcon from "./CompassIcon";

export default function Navbar() {
    return (
        <div className="navigation-card">

            <Link to="/" className="tab">
                <svg
                    className="nav-icon"
                    viewBox="0 0 104 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M100.5 40.75V96.5H66V68.5V65H62.5H43H39.5V68.5V96.5H3.5V40.75L52 4.375L100.5 40.75Z"
                        stroke="black"
                        strokeWidth="7"
                    ></path>
                </svg>
            </Link>

            <Link to="/navigator" className="tab">
                <CompassIcon className="nav-icon" />
            </Link>

            <Link to="/search" className="tab">
                <svg
                    className="nav-icon"
                    viewBox="0 0 101 114"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <circle
                        cx="46.1726"
                        cy="46.1727"
                        r="29.5497"
                        transform="rotate(36.0692 46.1726 46.1727)"
                        stroke="black"
                        strokeWidth="7"
                    ></circle>
                    <line
                        x1="61.7089"
                        y1="67.7837"
                        x2="97.7088"
                        y2="111.784"
                        stroke="black"
                        strokeWidth="7"
                    ></line>
                </svg>
            </Link>

        </div>
    );
}
