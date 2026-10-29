import React, { useEffect } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import AppHeader from "./AppHeader";
import { Container } from "@/shared/ui";
import { fetchUserRole } from "../features/sidebar/api/api";
import { useUserRole } from "../features/sidebar/hooks/useUserRole";
import { useWeb3Auth } from "../../service/web3/useWeb3Auth";
import { EMAIL_LOGIN_STORAGE_KEY } from "../../service/auth/constants";
import { isKnownAppPath } from "../features/navigation/routes";

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { address, jwt, logout } = useWeb3Auth();
  const isEmailSessionActive = localStorage.getItem(EMAIL_LOGIN_STORAGE_KEY) === "1";
  const [userRole] = useUserRole(!!jwt || isEmailSessionActive, fetchUserRole);

  const shortAddress = (addr: string) => addr.slice(0, 6) + "..." + addr.slice(-4);

  const handleLogout = () => {
    localStorage.removeItem(EMAIL_LOGIN_STORAGE_KEY);
    logout();
    navigate("/public");
  };

  useEffect(() => {
    if (!jwt && !isEmailSessionActive) {
      navigate("/public", { replace: true });
    }
  }, [jwt, isEmailSessionActive, navigate]);

  if (!isKnownAppPath(location.pathname)) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="app-shell min-h-screen bg-canvas font-sans text-neutral-900 antialiased">
      <AppHeader
        userRole={userRole}
        walletAddress={address}
        shortAddress={shortAddress}
        onLogout={handleLogout}
      />
      <main className="py-8 lg:py-10">
        <Container>
          <Outlet context={{ userRole, walletAddress: address }} />
        </Container>
      </main>
    </div>
  );
};

export default MainLayout;
