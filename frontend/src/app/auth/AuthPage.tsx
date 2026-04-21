import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useWeb3Auth } from "../../service/web3/useWeb3Auth";
import logo from "../../assets/icons/divi_icon_demo.png";
import metamaskIcon from "../../assets/icons/Metamask.svg";
import googleIcon from "../../assets/icons/google.svg";
import "./AuthPage.scss";

type AuthAction = "signin" | "signup";

const AuthPage = () => {
  const navigate = useNavigate();
  const { jwt, address, connect, signAndVerifyNonce, logout } = useWeb3Auth();
  const [pendingAction, setPendingAction] = useState<AuthAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (jwt) {
      navigate("/app/dashboard", { replace: true });
    }
  }, [jwt, navigate]);

  useEffect(() => {
    if (!pendingAction || !address) {
      return;
    }

    const authorize = async () => {
      try {
        await signAndVerifyNonce();
        navigate("/app/dashboard", { replace: true });
      } catch (authError) {
        setError(authError instanceof Error ? authError.message : "Nie udało się zakończyć logowania.");
      } finally {
        setPendingAction(null);
      }
    };

    void authorize();
  }, [pendingAction, address, signAndVerifyNonce, navigate]);

  const handleAuth = async (action: AuthAction) => {
    setError(null);
    setPendingAction(action);

    try {
      await connect();
    } catch (connectError) {
      setPendingAction(null);
      setError(connectError instanceof Error ? connectError.message : "Nie udało się połączyć z MetaMask.");
    }
  };

  const handleDisconnect = () => {
    logout();
    setPendingAction(null);
    setError(null);
  };

  const isBusy = pendingAction !== null;
  const shortenedAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";

  return (
    <main className="auth-login">
      <div className="page">
        <section className="card" aria-label="Logowanie do DIVI">
          <div className="card__logo">
            <div className="logo-box">
              <img src={logo} alt="DIVI" />
            </div>
          </div>

          <h1 className="card__title">Zarejestruj się</h1>
          <p className="card__subtitle">Utwórz konto i rozpocznij korzystanie z DIVI</p>

          <div className={`wallet-status ${address ? "" : "wallet-status--hidden"}`}>
            <span className="wallet-status__icon">✓</span>
            <span className="wallet-status__address">{shortenedAddress}</span>
            <button className="wallet-status__disconnect" type="button" onClick={handleDisconnect}>
              odłącz
            </button>
          </div>

          <div className="auth-buttons">
            <button
              className={`btn btn--outline ${address ? "btn--connected" : ""}`}
              type="button"
              onClick={() => void handleAuth("signin")}
              disabled={isBusy}
            >
              <img src={metamaskIcon} className="btn__icon" alt="" aria-hidden="true" />
              {pendingAction === "signin" ? "Łączenie..." : "MetaMask"}
            </button>

            <button className="btn btn--outline" type="button">
              <img src={googleIcon} className="btn__icon" alt="" aria-hidden="true" />
              Google
            </button>
          </div>

          <div className="divider">
            <span className="divider__line" />
            <span className="divider__text">lub</span>
            <span className="divider__line" />
          </div>

          <button
            className="btn btn--primary"
            type="button"
            onClick={() => navigate("/register")}
            disabled={isBusy}
          >
            STWÓRZ KONTO
          </button>

          <p className="card__footer">
            Masz już konto? <Link className="card__footer-link" to="/login">Zaloguj się</Link>
          </p>

          {error ? <p className="auth-error">{error}</p> : null}
        </section>
      </div>
    </main>
  );
};

export default AuthPage;