import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWeb3Auth } from "../../service/web3/useWeb3Auth";
import { useIsAuthenticated } from "../../service/auth/useIsAuthenticated";
import { LandingHeader } from "./components/LandingHeader";
import { LandingHero } from "./components/LandingHero";
import { LandingStack } from "./components/LandingStack";
import { LandingHowItWorks } from "./components/LandingHowItWorks";
import { LandingIssuers } from "./components/LandingIssuers";
import { LandingFeatures } from "./components/LandingFeatures";
import { LandingUseCases } from "./components/LandingUseCases";
import { LandingFaq } from "./components/LandingFaq";
import { LandingCta } from "./components/LandingCta";
import { LandingFooter } from "./components/LandingFooter";

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
    <div className="landing min-h-screen bg-canvas font-sans text-neutral-900 antialiased">
      <LandingHeader onConnect={handleConnect} isConnecting={pendingAuthorization} />
      <main>
        <LandingHero />
        <LandingStack />
        <LandingHowItWorks />
        <LandingIssuers />
        <LandingFeatures />
        <LandingUseCases />
        <LandingFaq />
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  );
};

export default PublicPage;
