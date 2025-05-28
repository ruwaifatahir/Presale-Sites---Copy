import { NavLink } from "react-router-dom";
import MobileMenuWrapper from "./MobileMenu.style";
import Logo from "../../../assets/images/logo.png";
import Telegram from "../../../assets/images/icons/telegram.svg";
import Discord from "../../../assets/images/icons/discord.svg";
import Twitter from "../../../assets/images/icons/twitter.svg";
import reddit from "../../../assets/images/icons/reddit.svg";
import insta from "/assets/images/icons/instagram.svg";
import youtube from "/assets/images/icons/youtube.svg";
import facebook from "/assets/images/icons/facebook.svg";

import { AiOutlineClose } from "react-icons/ai";
import ConnectWalletButton from "../../connectWalletButton/ConnectWalletButton";
import Whitepaper from "../../../assets/pdf/whitepaper.pdf";
import Data from "../../../assets/data/demoMenuList";
import Logo4 from "/assets/images/logo-4.png";

const MobileMenu = ({ mobileMenuHandle }) => {
  return (
    <MobileMenuWrapper>
      <div className="gittu-mobile-menu-content">
        <div className="mobile-menu-top">
          <NavLink className="mobile-logo" to="/" end>
            <img src={Logo4} alt="Logo" />
          </NavLink>

          <button className="mobile-menu-close" onClick={mobileMenuHandle}>
            <AiOutlineClose />
          </button>
        </div>

        {/* <ul className="mobile-menu-list mb-40">
          {Data?.map((item, i) => (
            <li key={i}>
              <NavLink to={item.url} end>
                {item.title}
              </NavLink>
            </li>
          ))}
        </ul> */}

        <ul className="mobile-menu-list mb-40">
          <li>
            <a href="https://digifolios.com/" target="_blank" rel="noreferrer">
              DigiToken Website
            </a>
          </li>
        </ul>

        <ul className="mobile-social-links mb-40">
          <li>
            <a
              href="https://discord.com/invite/btUZGySJws"
              target="_blank"
              rel="noreferrer"
            >
              <img src={Discord} alt="icon" />
            </a>
          </li>

          <li>
            <a
              href="https://x.com/DigifoliosX
"
              target="_blank"
              rel="noreferrer"
            >
              <img src={Twitter} alt="icon" />
            </a>
          </li>

          <li>
            <a
              href="https://t.me/digifoliofficial"
              target="_blank"
              rel="noreferrer"
            >
              <img src={Telegram} alt="icon" />
            </a>
          </li>

          <li>
            <a
              href="https://www.instagram.com/digifolios"
              target="_blank"
              rel="noreferrer"
            >
              <img src={insta} alt="icon" />
            </a>
          </li>

          <li>
            <a
              href="https://www.youtube.com/@Digifolios"
              target="_blank"
              rel="noreferrer"
            >
              <img src={youtube} alt="icon" />
            </a>
          </li>

          <li>
            <a
              href="https://www.facebook.com/digifoliotoken/"
              target="_blank"
              rel="noreferrer"
            >
              <img src={facebook} alt="icon" />
            </a>
          </li>
        </ul>

        <ul className="mobile-menu-list mb-40">
          <li>
            <a
              href="https://digifolios.com/whitepaper.pdf"
              target="_blank"
              rel="noreferrer"
            >
              Whitepaper
            </a>
          </li>
        </ul>

        <div className="d-flex justify-content-center">
          <ConnectWalletButton />
        </div>
      </div>
    </MobileMenuWrapper>
  );
};

export default MobileMenu;
