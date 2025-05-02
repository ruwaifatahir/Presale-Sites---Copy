/* eslint-disable react/prop-types */
import { useState } from "react";
import DropdownWrapper from "./Dropdown.style";

const Dropdown = ({ variant }) => {
  const [isDropdownActive, setIsDropdownActive] = useState(false);

  const dropdownHandle = () => {
    setIsDropdownActive(!isDropdownActive);
  };

  return (
    <DropdownWrapper variant={variant}>
      <button
        className={`dropdown-toggle ${isDropdownActive ? "active" : ""}`}
        onClick={dropdownHandle}
      >
        <img src={"/bnb.png"} alt="icon" />
        <span>Buy on BNB</span>
      </button>
    </DropdownWrapper>
  );
};

export default Dropdown;
