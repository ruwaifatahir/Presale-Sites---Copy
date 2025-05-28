import React from "react";
import Marquee from "react-fast-marquee";
import styled from "styled-components";

const FooterWrapper = styled.footer`
  background: #08291d;
  padding: 20px 0;
  margin: 0;

  .marquee-content {
    display: flex;
    align-items: center;
    gap: 4rem;
  }

  .marquee-item {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .footer-image {
    height: 40px;
    width: auto;
    object-fit: contain;
  }

  @media screen and (max-width: 768px) {
    .marquee-content {
      gap: 3rem;
    }

    .footer-image {
      height: 50px;
    }
  }
`;

const Footer = () => {
  return (
    <FooterWrapper>
      <Marquee speed={150} gradient={false}>
        <div className="marquee-content">
          <div className="marquee-item">
            <img
              src="./assets/footer/Blockliz.png"
              alt="Blockliz"
              className="footer-image"
            />
          </div>
          <div className="marquee-item">
            <img
              src="./assets/footer/Digitoken.png"
              alt="Digitoken"
              className="footer-image"
            />
          </div>
          <div className="marquee-item">
            <img
              src="./assets/footer/Digifolio.png"
              alt="Digifolio"
              className="footer-image"
            />
          </div>
          <div className="marquee-item">
            <img
              src="./assets/footer/Blockliz.png"
              alt="Blockliz"
              className="footer-image"
            />
          </div>
          <div className="marquee-item">
            <img
              src="./assets/footer/Digitoken.png"
              alt="Digitoken"
              className="footer-image"
            />
          </div>
          <div className="marquee-item">
            <img
              src="./assets/footer/Digifolio.png"
              alt="Digifolio"
              className="footer-image"
            />
          </div>

          <div className="marquee-item">
            <img
              src="./assets/footer/Blockliz.png"
              alt="Blockliz"
              className="footer-image"
            />
          </div>
          <div className="marquee-item">
            <img
              src="./assets/footer/Digitoken.png"
              alt="Digitoken"
              className="footer-image"
            />
          </div>
        </div>
      </Marquee>
    </FooterWrapper>
  );
};

export default Footer;
