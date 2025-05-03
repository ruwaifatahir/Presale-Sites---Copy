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
`;

export default UserDataDisplayStyleWrapper;
