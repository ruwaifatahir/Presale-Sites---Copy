import styled from "styled-components";

const UserDataDisplayStyleWrapper = styled.div`
  margin-top: 30px;
  /* padding: 20px; */
  /* background: ${({ theme }) => theme.colors.white}0F; */
  /* border: 1px solid ${({ theme }) => theme.colors.white}1A; */
  /* border-radius: 10px; */

  /* h4 {
    color: ${({ theme }) => theme.colors.primary};
    margin-bottom: 20px;
    text-align: center;
    text-transform: uppercase;
  } */

  border-top: 1px solid ${({ theme }) => theme.colors.white}1A;
  padding-top: 20px;

  border-bottom: 1px solid ${({ theme }) => theme.colors.white}1A;
  padding-bottom: 20px;
  margin-bottom: 30px;

  .data-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    /* padding-bottom: 12px; */
    /* border-bottom: 1px solid ${({ theme }) => theme.colors.white}1A; */

    &:last-child {
      margin-bottom: 0;
      /* padding-bottom: 0; */
      /* border-bottom: none; */
    }
  }

  .data-label {
    font-weight: 500;
    color: ${({ theme }) => theme.colors.textSecondary};
  }

  .data-value {
    font-weight: 600;
    color: ${({ theme }) => theme.colors.white};
  }

  .loading-text,
  .no-stakes-text {
    text-align: center;
    color: ${({ theme }) => theme.colors.textSecondary};
    padding: 20px 0;
  }

  // --- Styles for Individual Stakes ---
  .stakes-title {
    color: ${({ theme }) =>
      theme.colors.textPrimary}; // Or another appropriate color
    text-align: center;
    margin-top: 30px; // Space above title
    margin-bottom: 15px;
    text-transform: uppercase;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer; // Indicate it's clickable
    display: flex; // Use flex for icon alignment
    justify-content: space-between; // Align text left, icon right
    align-items: center;
    position: relative; // For icon positioning

    .collapse-icon {
      width: 10px;
      height: 10px;
      border: solid ${({ theme }) => theme.colors.textSecondary}; // Chevron color
      border-width: 0 2px 2px 0; // Creates the chevron shape (bottom and right borders)
      display: inline-block;
      padding: 3px;
      transform: translateY(-25%) rotate(45deg); // Point DOWN when collapsed
      transition: transform 0.3s ease;
    }
  }

  // Rotate chevron icon when expanded
  ${({ isStakesVisible }) =>
    isStakesVisible &&
    `
    .stakes-title .collapse-icon {
        transform: translateY(-50%) rotate(-135deg); // Point UP when expanded
    }
  `}

  .stakes-list {
    display: flex;
    flex-direction: column;
    gap: 15px; // Space between stake items
    overflow: hidden; // Needed for smooth transition
    transition: max-height 0.5s ease-out, opacity 0.5s ease-out; // Add transition
    max-height: ${({ isStakesVisible }) =>
      isStakesVisible ? "1000px" : "0"}; // Control height
    opacity: ${({ isStakesVisible }) =>
      isStakesVisible ? 1 : 0}; // Control opacity
    margin-top: 15px; // Add space below title when expanded
  }

  .stake-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 15px; // Adjust padding
    background: none; // Remove item background for cleaner look
    border: none; // Remove item border
    border-bottom: 1px solid ${({ theme }) => theme.colors.white}1A; // Use bottom border as separator
    border-radius: 0; // Remove item radius
    gap: 15px; // Adjust gap

    &:last-child {
      border-bottom: none; // No border on last item
    }
  }

  .stake-details {
    display: flex;
    flex-direction: row; // Display details side-by-side
    justify-content: space-between; // Space out details
    align-items: center;
    gap: 15px; // Adjust gap
    font-size: 14px;

    span {
      color: ${({ theme }) => theme.colors.textSecondary};
      white-space: nowrap; // Prevent wrapping
      &:first-child {
        // Keep amount prominent
        color: ${({ theme }) => theme.colors.white};
        font-weight: 500;
      }
      // Add specific style for claimable amount maybe?
      // &:nth-child(3) { font-weight: 500; }
    }
  }

  .claim-button {
    padding: 5px 10px; // Slightly smaller button
    font-size: 13px;
    font-weight: 500;
    background-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.white};
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.2s ease;
    white-space: nowrap; // Prevent text wrapping

    &:hover:not(:disabled) {
      background-color: ${({ theme }) =>
        theme.colors.primaryHover}; // Adjust hover color
    }

    &:disabled {
      background-color: ${({ theme }) =>
        theme.colors.bgDisabled}; // Use disabled bg color
      color: ${({ theme }) =>
        theme.colors.textDisabled}; // Use disabled text color
      cursor: not-allowed;
    }
  }
`;

export default UserDataDisplayStyleWrapper;
