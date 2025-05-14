import styled from "styled-components";

const UserDataDisplayStyleWrapper = styled.div`
  color: #ffffff; /* Default white text */
  padding: 15px 20px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.4); /* Semi-transparent background */
  border: 1px solid rgba(110, 86, 248, 0.3); /* Subtle border */
  backdrop-filter: blur(5px);
  margin-bottom: 20px;

  .loading-text {
    text-align: center;
    padding: 10px 0;
    color: rgba(255, 255, 255, 0.7);
  }

  .data-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);

    &:last-child {
      border-bottom: none;
    }
  }

  .data-label {
    font-weight: 500;
    color: rgba(255, 255, 255, 0.7);
  }

  .data-value {
    font-weight: 600;
    color: #6e56f8; /* Theme color */
  }

  /* Stakes section styling */
  .stakes-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    margin: 15px 0 5px;
    font-size: 16px;
    font-weight: 600;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    cursor: pointer;
    position: relative;

    &::after {
      content: ${(props) => (props.isStakesVisible ? "'▼'" : "'▶'")};
      position: absolute;
      right: 10px;
      transition: transform 0.3s ease;
    }
  }

  .stakes-list {
    margin-top: 10px;
  }

  .stake-item {
    background: rgba(110, 86, 248, 0.1);
    border: 1px solid rgba(110, 86, 248, 0.2);
    border-radius: 8px;
    padding: 10px;
    margin-bottom: 10px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .stake-details {
    display: flex;
    flex-direction: column;
    gap: 5px;

    span {
      font-size: 14px;
    }
  }

  .stake-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .claim-button,
  .withdraw-button {
    padding: 8px 15px;
    border-radius: 5px;
    border: none;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  .claim-button {
    background-color: #6e56f8;
    color: white;

    &:hover:not(:disabled) {
      background-color: #5a45e0;
    }
  }

  .withdraw-button {
    background-color: #28a745;
    color: white;

    &:hover:not(:disabled) {
      background-color: #218838;
    }
  }

  .no-stakes-text {
    text-align: center;
    padding: 15px 0;
    color: rgba(255, 255, 255, 0.7);
    font-style: italic;
  }
`;

export default UserDataDisplayStyleWrapper;
