/* eslint-disable react/prop-types */
import { useState, useMemo, useEffect } from "react";
import DropdownWrapper from "./Dropdown.style";

const Dropdown = ({
  variant,
  options,
  selectedValue,
  onSelect,
  placeholder = "Select an option",
}) => {
  const [isDropdownActive, setIsDropdownActive] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if screen is mobile size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const dropdownHandle = () => {
    setIsDropdownActive(!isDropdownActive);
  };

  const selectedLabel = useMemo(() => {
    const selectedOption = options.find(
      (option) => option.value === selectedValue
    );
    if (!selectedOption) return placeholder;
    
    // Use shortLabel on mobile if available, otherwise use regular label
    return isMobile && selectedOption.shortLabel 
      ? selectedOption.shortLabel 
      : selectedOption.label;
  }, [options, selectedValue, placeholder, isMobile]);

  const handleSelect = (value) => {
    onSelect(value);
    setIsDropdownActive(false);
  };

  const getOptionLabel = (option) => {
    // Use shortLabel on mobile if available, otherwise use regular label
    return isMobile && option.shortLabel ? option.shortLabel : option.label;
  };

  return (
    <DropdownWrapper variant={variant}>
      <button
        className={`dropdown-toggle ${isDropdownActive ? "active" : ""}`}
        onClick={dropdownHandle}
      >
        <span>{selectedLabel}</span>
      </button>
      {isDropdownActive && (
        <ul className="dropdown-list">
          {options?.map((item) => (
            <li key={item.value}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleSelect(item.value);
                }}
              >
                <span>{getOptionLabel(item)}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </DropdownWrapper>
  );
};

export default Dropdown;
