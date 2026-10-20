import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWeb3Auth } from "../../service/web3/useWeb3Auth";
import { useIsAuthenticated } from "../../service/auth/useIsAuthenticated";
import Header from "../../shared/header/Header";
import Verify from "@/shared/verify/Verify";
import "./MainPage.scss";

const PublicPage = () => {
  const navigate = useNavigate();
  const { address, connect, signAndVerifyNonce } = useWeb3Auth();
  const isAuthenticated = useIsAuthenticated();
  const [pendingAuthorization, setPendingAuthorization] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/app/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleConnect = async () => {
    await connect();
    setPendingAuthorization(true);
  };

  useEffect(() => {
    if (!pendingAuthorization || !address) {
      return;
    }

    const authorize = async () => {
      try {
        await signAndVerifyNonce();
        navigate("/app/dashboard");
      } finally {
        setPendingAuthorization(false);
      }
    };

    authorize();
  }, [pendingAuthorization, address, signAndVerifyNonce, navigate]);

  return (
    <div>
      <Header
        showBell={false}
        authMode="connect"
        connect={handleConnect}
        authLinks={[
          { to: "/auth", label: "Zarejestruj się" },
          { to: "/login", label: "Zaloguj się" },
        ]}
      />

      <div className="block">
        <Verify />
      </div>
      <div className="block">
        <h1>public</h1>
      </div>
      
    </div>
  );
};

export default PublicPage;