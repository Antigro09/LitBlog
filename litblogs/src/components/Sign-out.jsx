import React from 'react';
import styled from 'styled-components';

const Button = ({
    onSignOut
}) => {
  return (
    <StyledWrapper>
      <div className="button-container">
        <button onClick={onSignOut} className="noselect">
          <span className="text">Sign Out</span>
          <span className="icon">
            <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} viewBox="0 0 24 24">
              <path d="M24 20.188l-8.315-8.209 8.2-8.282-3.697-3.697-8.212 8.318-8.31-8.203-3.666 3.666 8.321 8.24-8.206 8.313 3.666 3.666 8.237-8.318 8.285 8.203z" />
            </svg>
          </span>
        </button>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .button-container {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    padding: 8px 16px;
  }

  button {
    position: relative;
    width: 150px;
    height: 50px;
    cursor: pointer;
    display: flex;
    align-items: center;
    border: none;
    border-radius: 5px;
    box-shadow: 1px 1px 3px rgba(0,0,0,0.15);
    background: #e62222;
    overflow: hidden;
  }

  button, button span {
    transition: 200ms;
  }

  button .text {
    position: absolute;
    left: 23px;
    color: white;
    font-weight: bold;
    transition: transform 200ms;
  }

  button .icon {
    position: absolute;
    right: 0;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-left: 1px solid #c41b1b;
    transition: all 200ms;
  }

  button svg {
    width: 15px;
    fill: #eee;
    transition: transform 200ms;
  }

  button:hover {
    background: #ff3636;
  }

  button:hover .text {
    transform: translateX(-100%);
    color: transparent;
  }

  button:hover .icon {
    width: 150px;
    border-left: none;
    transform: translateX(0);
  }

  button:focus {
    outline: none;
  }

  button:active .icon svg {
    transform: scale(0.8);
  }
`;

export default Button;