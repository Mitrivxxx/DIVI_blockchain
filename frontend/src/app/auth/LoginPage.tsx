import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../assets/icons/divi_icon_demo.png";
import metamaskIcon from "../../assets/icons/Metamask.svg";
import googleIcon from "../../assets/icons/google.svg";
import { API_URL } from "@/types/api";
import "./LoginPage.scss";
import { useWeb3Auth } from "../../service/web3/useWeb3Auth";

const GOOGLE_CLIENT_ID = "827137465970-kc668qkj4j9ck05ufeqsgi67eb67ak08.apps.googleusercontent.com";
const EMAIL_LOGIN_STORAGE_KEY = "email-auth-session";

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSocialSubmitting, setIsSocialSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const { address, connect, signAndVerifyNonce, setJwt } = useWeb3Auth();


  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Podaj email i haslo.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/Auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const responseBody = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          typeof responseBody === "string"
            ? responseBody
            : responseBody?.title || responseBody?.detail || responseBody?.message || "Logowanie nie powiodlo sie.";
        throw new Error(message);
      }

      if (responseBody?.token) {
        setJwt(responseBody.token);
      }
      localStorage.setItem(EMAIL_LOGIN_STORAGE_KEY, "1");
      navigate("/app/dashboard", { replace: true });
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Logowanie nie powiodlo sie.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleResponse = async (response: any) => {
    setError(null);
    setIsSocialSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/Auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ idToken: response.credential }),
      });

      const body = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(body?.message || "Logowanie przez Google nie powiodło się.");
      }

      if (body?.token) {
        setJwt(body.token);
      }

      localStorage.setItem(EMAIL_LOGIN_STORAGE_KEY, "1");
      navigate("/app/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd podczas logowania przez Google.");
    } finally {
      setIsSocialSubmitting(false);
    }
  };

  useEffect(() => {
    const initGoogle = () => {
      if (!(window as any).google) return;

      (window as any).google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      });

      const parent = document.getElementById("google-login-button-hidden");
      if (parent) {
        (window as any).google.accounts.id.renderButton(parent, {
          theme: "outline",
          size: "large",
          width: parent.offsetWidth || 200,
        });
      }
    };

    initGoogle();

    const interval = setInterval(() => {
      if ((window as any).google) {
        initGoogle();
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const handleMetaMaskLogin = async () => {
    setError(null);
    setSuccessMessage(null);
    setIsConnecting(true);

    try {
      const { signer, address: connectedAddress } = await connect();
      await signAndVerifyNonce(signer, connectedAddress);
      localStorage.setItem(EMAIL_LOGIN_STORAGE_KEY, "1");
      navigate("/app/dashboard", { replace: true });
    } catch (connectError) {
      setError(connectError instanceof Error ? connectError.message : "Nie udało się połączyć z MetaMask.");
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <main className="auth-login auth-login--login">
      <div className="page">
        <section className="card" aria-label="Logowanie do DIVI">
          <div className="card__logo">
            <div className="logo-box">
              <img src={logo} alt="DIVI" />
            </div>
          </div>

          <h1 className="card__title">Zaloguj się</h1>
          <p className="card__subtitle">Zaloguj się i kontynuuj korzystanie z DIVI</p>

          <div className="auth-buttons">
            <button
              className={`btn btn--outline ${address ? "btn--connected" : ""}`}
              type="button"
              onClick={() => void handleMetaMaskLogin()}
              disabled={isConnecting || isSubmitting}
            >
              <img src={metamaskIcon} className="btn__icon" alt="" aria-hidden="true" />
              {isConnecting ? "Łączenie..." : address ? "MetaMask połączony" : "MetaMask"}
            </button>

            <div className="google-btn-wrapper">
              <button className="btn btn--outline" type="button" disabled={isSubmitting || isSocialSubmitting}>
                <img src={googleIcon} className="btn__icon" alt="" aria-hidden="true" />
                Google
              </button>
              <div id="google-login-button-hidden" className="google-button-overlay"></div>
            </div>
          </div>

          <div className="divider">
            <span className="divider__line" />
            <span className="divider__text">lub</span>
            <span className="divider__line" />
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <label className="login-form__field">
              <span className="login-form__label">E-mail</span>
              <input
                className="login-form__input"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="twoj@email.com"
                disabled={isSubmitting || isSocialSubmitting}
                required
              />
            </label>

            <label className="login-form__field">
              <span className="login-form__label">Haslo</span>
              <input
                className="login-form__input"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Wpisz haslo"
                disabled={isSubmitting || isSocialSubmitting}
                required
              />
            </label>

            <button className="btn btn--primary" type="submit" disabled={isSubmitting || isSocialSubmitting}>
              {isSubmitting ? "LOGOWANIE..." : "ZALOGUJ SIE"}
            </button>
          </form>

          <p className="card__footer">
            Nie masz konta? <Link className="card__footer-link" to="/register">Zarejestruj się</Link>
          </p>

          {error ? <p className="auth-error">{error}</p> : null}
        </section>
      </div>
    </main>
  );
};

export default LoginPage;
