import BannerWrapper from "./Banner.style";
import SliderData from "../../../assets/data/boxSlider";
import WithdrawWith from "../../../components/payWith/ClaimWith";
import UserDataDisplay from "../../../components/userDataDisplay/UserDataDisplay";
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
      <div className="mb-20  ">
        <div className="row">
          <div className="col-md-12">
            <div className="mb-20 text-center " style={{ margin: "14px" }}>
              <h1 className="banner-title">
                {"DGFL TOKEN Withdrawal"} <br /> {"Withdraw Your Staked Tokens"}
              </h1>
              <p className="banner-subtitle">
                Withdraw 10% of your staked tokens weekly after the lock period
                ends
              </p>

              <div className="presale-card-wrapper">
                <div className="presale-card">
                  <h5
                    className="  fw-600 text-white text-uppercase text-center"
                    style={{ position: "relative", top: "26px" }}
                  >
                    💰 Withdraw your staked tokens safely!
                  </h5>
                  <div className="presale-card-body">
                    <UserDataDisplay />
                    <WithdrawWith variant="v6" />
                  </div>
                </div>
              </div>
            </div>

            <div className="hello">
              <div className="scroll-slider-wrapper1">
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
            </div>
          </div>
        </div>
      </div>
    </BannerWrapper>
  );
};

export default Banner;
