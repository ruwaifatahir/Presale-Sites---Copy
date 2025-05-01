import PayWithStyleWrapper from "./PayWith.style";
import StatusIcon from "../../assets/images/icons/status.png";
import Dropdown from "./Dropdown/Dropdown";
import { usePresaleData } from "../../utils/PresaleContext";
import { useReadContract, useWriteContract } from "wagmi";
import { PRESALE_ADDRESS, REFERRAL_ADDRESS } from "../../config/constants";
import { PRESALE_ABI } from "../../config/presaleAbi";
import { useState } from "react";
import PropTypes from "prop-types";

const PayWith = ({ variant }) => {
  const {
    setIsActiveBuyOnEth,
    setIsActiveBuyOnBnb,
    switchChain,
    selectedImg,
    payWithText,
    titleText,
    bnbChainId,
    tokenSymbol,
    paymentAmount,
    totalAmount,
    presaleStatus,
    makeEmptyInputs,
    handlePaymentInput,
    userChainId,
  } = usePresaleData();

  const { writeContract } = useWriteContract({});

  const handleBuyTokens = async () => {
    await writeContract({
      address: PRESALE_ADDRESS,
      abi: PRESALE_ABI,
      functionName: "buyTokens",
      args: [paymentAmount, 0, REFERRAL_ADDRESS],
      chainId: userChainId,
    });
  };

  const result = useReadContract({
    address: PRESALE_ADDRESS,
    abi: PRESALE_ABI,
    functionName: "baseTokenPrice",
    chainId: 97,
    query: {
      enabled: !!userChainId,
    },
  });

  console.log("result", result);
  console.log("Contract read error:", result.error);

  return (
    <PayWithStyleWrapper variant={variant}>
      <div className="pay-with-content">
        <div className="pay-with-content-left">
          <Dropdown
            variant="v4"
            selectedImg={selectedImg}
            titleText={titleText}
            setIsActiveBuyOnEth={setIsActiveBuyOnEth}
            setIsActiveBuyOnBnb={setIsActiveBuyOnBnb}
            switchChain={switchChain}
            makeEmptyInputs={makeEmptyInputs}
            bnbChainId={bnbChainId}
          />
        </div>

        <div className="pay-with-content-right">
          <ul className="pay-with-list">
            <li>
              <button className="active">
                <img src={selectedImg} alt="icon" />
              </button>
            </li>
          </ul>
        </div>
      </div>

      <form action="/" method="post">
        <div className="presale-item mb-30">
          <div className="presale-item-inner">
            <label>Pay token ({payWithText})</label>
            <input
              type="number"
              placeholder="0"
              value={paymentAmount}
              onChange={handlePaymentInput}
            />
          </div>
          <div className="presale-item-inner">
            <label>Get Token ({tokenSymbol})</label>
            <input type="number" placeholder="0" value={totalAmount} disabled />
          </div>
        </div>
      </form>

      <div className="presale-item-msg">
        {presaleStatus && (
          <div className="presale-item-msg__content">
            <img src={StatusIcon} alt="icon" />
            <p>{presaleStatus}</p>
          </div>
        )}
      </div>

      <button className="presale-item-btn" onClick={handleBuyTokens}>
        Buy now
      </button>
    </PayWithStyleWrapper>
  );
};

PayWith.propTypes = {
  variant: PropTypes.string,
};

export default PayWith;
