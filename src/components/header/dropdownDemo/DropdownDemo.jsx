import DropdownDemoStyles from "./DropdownDemo.style";
import Data from "../../../assets/data/demoMenuList";
import MenuGridIcon from "../../../assets/images/icons/menu-grid.svg";
import whitepaperPdf from "../../../assets/pdf/whitepaper.pdf";
import { NavLink } from "react-router-dom";

const DropdownDemo = ({ className, variant }) => {
  return (
    <DropdownDemoStyles className={className} variant={variant}>
      <button className="demo-btn">
        <img src={MenuGridIcon} alt="menu" />
      </button>
      <ul className="dropdown-demo-list">
        <li>
          <a href={"https://digifolios.com"} end>
            Digifolio Website
          </a>
        </li>
        <li>
          <a
            style={{ cursor: "pointer" }}
            href="https://digifolios.com/whitepaper.pdf"
            target="_blank"
            // onClick={() => {
            //   const link = document.createElement("a");
            //   link.href = whitepaperPdf; // Path to your PDF file
            //   link.setAttribute("download", "whitepaper.pdf"); // Name of the downloaded file
            //   document.body.appendChild(link);
            //   link.click();
            //   document.body.removeChild(link);
            // }}
            rel="noreferrer"
          >
            {"Whitepaper"}
          </a>
        </li>

        <li>
          {location.pathname !== "/claim" ? (
            <NavLink
              to="/claim"
              className="claim-link-style"
              style={{
                marginRight: "15px",
                color: "#fff",
                textDecoration: "none",
                fontWeight: "bold",
              }}
            >
              Claim
            </NavLink>
          ) : (
            <NavLink
              to="/"
              className="claim-link-style"
              style={{
                marginRight: "15px",
                color: "#fff",
                textDecoration: "none",
                fontWeight: "bold",
              }}
            >
              Home
            </NavLink>
          )}
        </li>
      </ul>
    </DropdownDemoStyles>
  );
};

export default DropdownDemo;
