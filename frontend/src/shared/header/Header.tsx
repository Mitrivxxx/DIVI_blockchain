
import React from "react";
import bell from "../../assets/icons/bell.svg";
import user from "../../assets/icons/user.svg";
import logo from "../../assets/icons/divi_icon_demo.png";

import "./Header.scss";

type HeaderProps = {
  showBell?: boolean;
  showUser?: boolean;
  onBellClick?: () => void;
  onUserClick?: () => void;
  showNotifyPanel?: boolean;
  notifyContent?: React.ReactNode;
  authMode?: "default" | "connect" | "status";
  userRole?: string | null;
  walletAddress?: string | null;
  shortAddress?: (addr: string) => string;
  connect?: () => void | Promise<void>;
};

const Header: React.FC<HeaderProps> = ({
  showBell = true,
  showUser = true,
  onBellClick,
  onUserClick,
  showNotifyPanel = false,
  notifyContent,
  authMode = "default",
  userRole,
  walletAddress,
  shortAddress,
  connect,
}) => {
  return (
    <div className="header">
      <div className="logo-container">
        <img className="logo" src={logo} alt="Logo" />
        <span className="logo-text">DIVI</span>
      </div>

      <div className="header-icons">
        {showBell && (
          <div className="header-bell-wrapper">
            <img
              src={bell}
              alt="Notifications"
              className="header-bell"
              onClick={onBellClick}
            />
            {showNotifyPanel && notifyContent && (
              <div className="header-notify-panel">{notifyContent}</div>
            )}
          </div>
        )}
        {showUser && (
          <img
            src={user}
            alt="User"
            className="header-user"
            onClick={onUserClick}
          />
        )}
        {showUser && (
          authMode === "connect" ? (
            <button className="header-auth-btn" onClick={connect} type="button">
              Podłącz portfel
            </button>
          ) : authMode === "status" ? (
            <div className="header-auth-status">
              <div className="header-auth-address">
                {walletAddress && shortAddress ? shortAddress(walletAddress) : "Brak połączonego portfela"}
              </div>
              <div className="header-auth-role">{userRole ? `Rola: ${userRole}` : "Rola: -"}</div>
            </div>
          ) : null
        )}
      </div>
    </div>
  );
};

export default Header;