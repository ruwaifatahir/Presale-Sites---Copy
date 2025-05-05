import BannerWrapper from "./Banner.style";
import SliderData from "../../../assets/data/boxSlider";
import ClaimWith from "../../../components/payWith/ClaimWith";
import UserDataDisplayClaim from "../../../components/userDataDisplay/UserDataDisplayClaim";
import Slider from "react-slick";
import BannerData from "../../../assets/data/bannerV6";
import { useAccount } from "wagmi";

const Banner = () => {
  const { isConnected } = useAccount();

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
                {"DIGI TOKEN Presale"} <br /> {"New Era of Blockchain"}
              </h1>
              <p className="banner-subtitle">{BannerData.subtitle}</p>

              <img
                src={"partnership.svg"}
                alt="banner"
                className="partnership-img"
                style={{ width: "100%", height: "312px" }}
              />

              <div className="presale-card-wrapper">
                <div className="presale-card">
                  <div className="presale-card-body">
                    {isConnected && <UserDataDisplayClaim />}

                    <ClaimWith variant="v6" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="scroll-slider-wrapper">
        <div className="scroll-slider-content">
          <Slider {...settings} className="gittu-slider">
            {SliderData?.map((item, i) => (
              <div key={i} className="slider-item">
                {item.text && <p>{item.text}</p>}
                {item.socialLinks?.map((socialLinkItem, sid) => (
                  <a key={sid} href={socialLinkItem.url}>
                    <img src={socialLinkItem.icon} alt="icon" />
                  </a>
                ))}
              </div>
            ))}
          </Slider>
        </div>
      </div>
    </BannerWrapper>
  );
};

export default Banner;
