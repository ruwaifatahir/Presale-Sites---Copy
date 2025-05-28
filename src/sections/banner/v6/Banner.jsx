import BannerWrapper from "./Banner.style";
import Progressbar from "../../../components/progressbar/Progressbar";
import Countdown from "../../../components/countdown/Countdown";
import SliderData from "../../../assets/data/boxSlider";
import PayWith from "../../../components/payWith/PayWith";
import UserDataDisplay from "../../../components/userDataDisplay/UserDataDisplay";
import Slider from "react-slick";
import BannerData from "../../../assets/data/bannerV6";
import { usePresaleData } from "../../../utils/PresaleContext";
import { useAccount } from "wagmi";
import Marquee from "react-fast-marquee";
import IconImg from "../../../assets/images/icons/star-square.svg";
const Banner = () => {
  const { tokenPercent } = usePresaleData();
  const { isConnected } = useAccount();

  // Calculate the end date for the countdown (30 days from now)
  // Get current time in seconds, add 30 days worth of seconds
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const thirtyDaysInSeconds = 30 * 24 * 60 * 60;
  const calculatedEndDate = nowInSeconds + thirtyDaysInSeconds;



  

  var settings = {
    dots: false,
    infinite: true,
    slidesToShow: 3,
    slidesToScroll: 1,
    speed: 3000,
    autoplay: true,
    autoplaySpeed: 3000,
    cssEase: "linear",
    variableWidth: true,
    pauseOnHover: true,
  };

  return (
    <BannerWrapper>
      <div className="mb-20 container">
        <div className="row">
          <div className="col-md-12">
            <div className="mb-20 text-center">
              <h1 className="banner-title">
                {"DGFL TOKEN Presale"} <br /> {"New Era of Blockchain"}
              </h1>
              <p className="banner-subtitle">{BannerData.subtitle}</p>

              <div style={{ display: "flex", flexDirection: "column" }}>
                <a
                  href={"https://www.cyberscope.io/audits/dgfl"}
                  target="_blank"
                  className="kyc"
                >
                  <img
                    src="partnership.svg " // alt="Audit & KYC"
                    style={{ marginTop: "-2rem" }}
                    className="kycImage"
                  />
                </a>
              </div>

              <Marquee
                autoFill
                pauseOnHover
                pauseOnClick
                className="smoothSlider"
              >
                <div className="smoothSliderDiv">
                  <p>Presale Live</p>
                  <img src={IconImg} className="smoothSliderImg" />
                  <p>Price = {0.025}$</p>
                  <img src={IconImg} className="smoothSliderImg" />
                  <p>Stage {Number(0) + 1}</p>
                  <img src={IconImg} className="smoothSliderImg" />

                  <p>Presale Live</p>
                  <img src={IconImg} className="smoothSliderImg" />
                  <p>Price = {0.025}$</p>
                  <img src={IconImg} className="smoothSliderImg" />
                  <p>Stage {Number(0) + 1}</p>
                  <img src={IconImg} className="smoothSliderImg" />

                  <p>Presale Live</p>
                  <img src={IconImg} className="smoothSliderImg" />
                  <p>Price = {0.025}$</p>
                  <img src={IconImg} className="smoothSliderImg" />
                  <p>Stage {Number(0) + 1}</p>
                  <img src={IconImg} className="smoothSliderImg" />

                  <p>Presale Live</p>
                  <img src={IconImg} className="smoothSliderImg" />
                  <p>Price = {0.025}$</p>
                  <img src={IconImg} className="smoothSliderImg" />
                  <p>Stage {Number(0) + 1}</p>
                  <img src={IconImg} className="smoothSliderImg" />
                </div>
              </Marquee>

              <div className="presale-card-wrapper">
                <div className="presale-card">
                  <div className="presale-card-header">
                    <h5 className="ff-outfit fw-600 text-white text-uppercase">
                      ⚡ Buy early to get the best rate!
                    </h5>
                  </div>

                  <div className="presale-card-counter">
                    <Countdown endDate={calculatedEndDate} font="title2" />
                  </div>

                  <div className="presale-card-body">
                    {isConnected && <UserDataDisplay />}

                    <div className="mb-35">
                      <Progressbar done={tokenPercent} variant="green2" />
                    </div>

                    <PayWith variant="v6" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="scroll-slider-wrapper d-none d-md-block">
        <div className="scroll-slider-content">
          <Slider {...settings} className="gittu-slider">
            {SliderData?.map((item, i) => (
              <div key={i} className="slider-item">
                {item.text && <p>{item.text}</p>}
                {/* {item.socialLinks?.map((socialLinkItem, sid) => (
                  <a key={sid} href={socialLinkItem.url}>
                    <img src={socialLinkItem.icon} alt="icon" />
                  </a>
                ))} */}
              </div>
            ))}
          </Slider>
        </div>
      </div>
    </BannerWrapper>
  );
};

export default Banner;
