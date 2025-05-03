/* eslint-disable react/prop-types */
import { useState, useMemo } from "react";
import DropdownWrapper from "./Dropdown.style";

const Dropdown = ({
  variant,
  options,
  selectedValue,
  onSelect,
  placeholder = "Select an option",
}) => {
  const [isDropdownActive, setIsDropdownActive] = useState(false);

  const dropdownHandle = () => {
    setIsDropdownActive(!isDropdownActive);
  };

  const selectedLabel = useMemo(() => {
    const selectedOption = options.find(
      (option) => option.value === selectedValue
    );
    return selectedOption ? selectedOption.label : placeholder;
  }, [options, selectedValue, placeholder]);

  const handleSelect = (value) => {
    onSelect(value);
    setIsDropdownActive(false);
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
                <span>{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </DropdownWrapper>
  );
};

export default Dropdown;
