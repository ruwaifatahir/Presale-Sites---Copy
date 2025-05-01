import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import HeaderWrapper from "./Header.style";
import ConnectWalletButton from "../../connectWalletButton/ConnectWalletButton";
import DropdownDemo from "../dropdownDemo/DropdownDemo";
import MobileMenu from "../mobileMenu/MobileMenu";
import HeaderSocialLinks from "../../../assets/data/headerSocialLinks";
import Whitepaper from "../../../assets/pdf/whitepaper.pdf";
import Logo from "../../../assets/images/logo-3.png";
import Logo4 from "../../../assets/images/logo-4.png";
import Logo5 from "../../../assets/images/logo-5.png";
import { HiMenuAlt3 } from "react-icons/hi";

const Header = ({ variant }) => {
  const [logoImg, setLogoImg] = useState(Logo);
  const [isMobileMenu, setIsMobileMenu] = useState(false);

  const handleMobileMenu = () => {
    setIsMobileMenu(!isMobileMenu);
  };

  useEffect(() => {
    if (variant === "v4" || variant === "v5") {
      setLogoImg(Logo4);
    }
    if (variant === "v6") {
      setLogoImg(Logo5);
    }
  }, [variant]);

  return (
    <>
      <HeaderWrapper className="header-section">
        <div className="container">
          <div className="gittu-header-content">
            <div className="gittu-header-left">
              <NavLink className="gittu-header-logo" to="/" end>
                <img src={logoImg} alt="Logo" />
              </NavLink>
            </div>
            <div className="gittu-header-right">
              <div className="gittu-header-menu-toggle">
                <button className="menu-toggler" onClick={handleMobileMenu}>
                  <HiMenuAlt3 />
                </button>
              </div>
              <div className="gittu-header-right-menu">
                {variant === "v1" && (
                  <ul className="gittu-header-menu">
                    <li>
                      <a href={Whitepaper} target="_blank" rel="noreferrer">
                        Whitepaper
                      </a>
                    </li>
                  </ul>
                )}

                {(variant === "v2" ||
                  variant === "v3" ||
                  variant === "v5" ||
                  variant === "v6" ||
                  variant === "v7") && (
                  <ul className="social-links">
                    {HeaderSocialLinks?.map((socialLinkItem, i) => (
                      <li key={i}>
                        <a
                          href={socialLinkItem.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <img
                            src={socialLinkItem.icon}
                            alt={socialLinkItem.title}
                          />
                        </a>
                      </li>
                    ))}
                  </ul>
                )}

                {variant === "v1" && <ConnectWalletButton />}
                {variant === "v2" && <ConnectWalletButton variant="v2" />}
                {variant === "v3" && <ConnectWalletButton variant="yellow" />}
                {variant === "v4" && <ConnectWalletButton variant="gradient" />}
                {variant === "v5" && <ConnectWalletButton variant="v5" />}
                {variant === "v6" && <ConnectWalletButton variant="v6" />}
                {variant === "v7" && <ConnectWalletButton />}

                <DropdownDemo className="dropdown-demo" />
              </div>
            </div>
          </div>
        </div>
      </HeaderWrapper>

      {isMobileMenu && <MobileMenu mobileMenuHandle={handleMobileMenu} />}
    </>
  );
};

export default Header;
