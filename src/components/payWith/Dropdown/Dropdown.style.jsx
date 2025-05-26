import styled, { css } from "styled-components";

const DropdownWrapper = styled.div`
  position: relative;
  width: 100%;

  .dropdown-toggle {
    border: 0;
    width: 100%;
    padding: 15px 20px;
    background: linear-gradient(135deg, ${({ theme }) => theme.colors.white}08, ${({ theme }) => theme.colors.white}12);
    border: 2px solid ${({ theme }) => theme.colors.white}20;
    border-radius: 12px;
    text-transform: uppercase;
    font-weight: 600;
    font-size: 16px;
    line-height: 26px;
    color: ${({ theme }) => theme.colors.white};
    display: flex;
    align-items: center;
    gap: 14px;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    
    /* Add text truncation */
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    
    /* Hover effects */
    &:hover {
      background: linear-gradient(135deg, ${({ theme }) => theme.colors.white}12, ${({ theme }) => theme.colors.white}18);
      border-color: ${({ theme }) => theme.colors.white}30;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    
    /* Ensure the span inside also truncates */
    span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1;
      text-align: left;
    }

    &.active {
      background: linear-gradient(135deg, ${({ theme }) => theme.colors.white}15, ${({ theme }) => theme.colors.white}20);
      border-color: ${({ theme }) => theme.colors.white}40;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      
      &::after {
        top: 27px;
        transform: rotate(225deg);
      }
    }

    &::after {
      content: '';
      position: absolute;
      top: 22px;
      right: 20px;
      border: 0;
      transition: all 0.3s ease;
      width: 12px;
      height: 12px;
      border: solid ${({ theme }) => theme.colors.white};
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
    }

    img {
      width: 30px;
      height: 30px;
      border-radius: 50%;
    }
  }

  .dropdown-list {
    position: absolute;
    z-index: 1000;
    top: calc(100% + 8px);
    left: 0;
    width: 100%;
    padding: 8px;
    background: linear-gradient(135deg, ${({ theme }) => theme.colors.bgHeader}f0, ${({ theme }) => theme.colors.bgHeader}ff);
    border: 2px solid ${({ theme }) => theme.colors.white}25;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(10px);
    animation: dropdownFadeIn 0.2s ease-out;

    @keyframes dropdownFadeIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    li {
      list-style: none;
      position: relative;
      
      a {
        display: flex;
        align-items: center;
        gap: 12px;
        font-weight: 500;
        font-size: 15px;
        line-height: 20px;
        color: ${({ theme }) => theme.colors.white};
        padding: 12px 16px;
        border-radius: 8px;
        text-decoration: none;
        transition: all 0.2s ease;
        cursor: pointer;
        
        /* Add text truncation for dropdown items */
        overflow: hidden;
        
        &:hover {
          background: linear-gradient(135deg, ${({ theme }) => theme.colors.white}15, ${({ theme }) => theme.colors.white}20);
          transform: translateX(4px);
          color: ${({ theme }) => theme.colors.white};
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        &:active {
          transform: translateX(2px);
          background: linear-gradient(135deg, ${({ theme }) => theme.colors.white}20, ${({ theme }) => theme.colors.white}25);
        }
        
        span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
        }

        img {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          flex-shrink: 0;
        }
      }
      
      /* Add subtle separator between options */
      &:not(:last-child)::after {
        content: '';
        position: absolute;
        bottom: 2px;
        left: 16px;
        right: 16px;
        height: 1px;
        background: linear-gradient(90deg, transparent, ${({ theme }) => theme.colors.white}10, transparent);
      }
    }
  }

  ${({ variant }) =>
    variant === "v2" &&
    css`
      .dropdown-toggle {
        min-width: 220px;
        border-radius: 30px;
      }
    `}

  ${({ variant }) =>
    variant === "v3" &&
    css`
      .dropdown-toggle {
        min-width: 220px;
        border-radius: 0;
        border-width: 1px;
      }

      .dropdown-list {
        border-radius: 0;
        border-width: 1px;
      }
    `}

  ${({ variant }) =>
    variant === "v4" &&
    css`
      .dropdown-toggle {
        min-width: 220px;
        border-radius: 10px;
      }
    `}

  /* Responsive adjustments for small screens */
  @media (max-width: 768px) {
    .dropdown-toggle {
      font-size: 14px;
      padding: 12px 16px;
      
      span {
        font-size: 14px;
      }
      
      &::after {
        right: 16px;
        top: 18px;
      }
    }
    
    .dropdown-list {
      padding: 6px;
      top: calc(100% + 6px);
      
      li a {
        font-size: 14px;
        gap: 10px;
        padding: 10px 14px;
        
        span {
          font-size: 14px;
        }
        
        img {
          width: 22px;
          height: 22px;
        }
      }
    }
  }
  
  @media (max-width: 480px) {
    .dropdown-toggle {
      font-size: 12px;
      padding: 10px 14px;
      
      span {
        font-size: 12px;
      }
      
      &::after {
        right: 14px;
        top: 16px;
        width: 10px;
        height: 10px;
      }
    }
    
    .dropdown-list {
      padding: 4px;
      top: calc(100% + 4px);
      
      li a {
        font-size: 12px;
        gap: 8px;
        padding: 8px 12px;
        
        span {
          font-size: 12px;
        }
        
        img {
          width: 20px;
          height: 20px;
        }
      }
    }
  }
`;

export default DropdownWrapper;
