import { useState, useEffect, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useWeb3Auth } from "../../service/web3/useWeb3Auth";
import { API_URL } from "../../types/api";
import logo from "../../assets/icons/divi_icon_demo.png";
import metamaskIcon from "../../assets/icons/Metamask.svg";
import googleIcon from "../../assets/icons/google.svg";
import "./RegisterPage.scss";

const RegisterPage = () => {
  const navigate = useNavigate();
  const { address, connect, setJwt } = useWeb3Auth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

    const shortenedAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email.trim() || !password) {
      setError("Podaj email i hasło.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/Auth/register`, {
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
            : responseBody?.title || responseBody?.detail || responseBody?.message || "Nie udało się utworzyć konta.";
        throw new Error(message);
      }

      // Konto utworzone - zaloguj się automatycznie
      localStorage.setItem("email-auth-session", "1");

      const loginResponse = await fetch(`${API_URL}/Auth/login`, {
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

      if (!loginResponse.ok) {
        throw new Error("Logowanie nie powiodło się.");
      }

      const loginBody = await loginResponse.json().catch(() => null);
      if (loginBody?.token) {
        setJwt(loginBody.token);
      }

      navigate("/app/dashboard", { replace: true });
    } catch (registerError) {
      setError(registerError instanceof Error ? registerError.message : "Nie udało się utworzyć konta.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMetaMaskRegister = async () => {
    setError(null);
    setSuccessMessage(null);
    setIsConnecting(true);

    try {
      await connect();
      setSuccessMessage("Portfel MetaMask został połączony.");
    } catch (connectError) {
      setError(connectError instanceof Error ? connectError.message : "Nie udało się połączyć z MetaMask.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleGoogleResponse = async (response: any) => {
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/Auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          idToken: response.credential,
        }),
      });

      const googleBody = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(googleBody?.message || "Rejestracja przez Google nie powiodła się.");
      }

      if (googleBody?.token) {
        setJwt(googleBody.token);
      }

      localStorage.setItem("email-auth-session", "1");
      navigate("/app/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd podczas logowania przez Google.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const initGoogle = () => {
      if (!(window as any).google) return;

      (window as any).google.accounts.id.initialize({
        client_id: "827137465970-kc668qkj4j9ck05ufeqsgi67eb67ak08.apps.googleusercontent.com",
        callback: handleGoogleResponse,
      });

      const parent = document.getElementById("google-button-hidden");
      if (parent) {
        (window as any).google.accounts.id.renderButton(parent, {
          theme: "outline",
          size: "large",
          width: parent.offsetWidth || 200,
        });
      }
    };

    // Try immediately
    initGoogle();

    // Or wait for script to load
    const interval = setInterval(() => {
      if ((window as any).google) {
        initGoogle();
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const handleGoogleRegister = () => {
    if (!(window as any).google) {
      setError("Usługa Google nie została jeszcze załadowana.");
      return;
    }
    (window as any).google.accounts.id.prompt();
  };

  return (
    <main className="auth-login auth-login--register">
      <div className="page">
        <section className="card" aria-label="Formularz rejestracji DIVI">
          <div className="card__logo">
            <div className="logo-box">
              <img src={logo} alt="DIVI" />
            </div>
          </div>

          <h1 className="card__title">Formularz rejestracji</h1>
          <p className="card__subtitle">Wypełnij dane, aby utworzyć nowe konto</p>

          <div className={`wallet-status ${address ? "" : "wallet-status--hidden"}`}>
            <span className="wallet-status__icon">✓</span>
            <span className="wallet-status__address">{shortenedAddress}</span>
          </div>

          <form className="register-form" onSubmit={handleSubmit}>
            <label className="register-form__field">
              <span className="register-form__label">E-mail</span>
              <input
                className="register-form__input"
                type="email"
                name="email"
                placeholder="jan@divi.com"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>

            <label className="register-form__field">
              <span className="register-form__label">Hasło</span>
              <input
                className="register-form__input"
                type="password"
                name="password"
                placeholder="Wpisz hasło"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>

            <button className="btn btn--primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "TWORZENIE..." : "UTWÓRZ KONTO"}
            </button>
          </form>

          <div className="divider">
            <span className="divider__line" />
            <span className="divider__text">lub</span>
            <span className="divider__line" />
          </div>

          <div className="auth-buttons auth-buttons--register">
            <button
              className={`btn btn--outline ${address ? "btn--connected" : ""}`}
              type="button"
              onClick={() => void handleMetaMaskRegister()}
              disabled={isConnecting || isSubmitting}
            >
              <img src={metamaskIcon} className="btn__icon" alt="" aria-hidden="true" />
              {isConnecting ? "Łączenie..." : address ? "MetaMask połączony" : "MetaMask"}
            </button>

            <div className="google-btn-wrapper">
              <button className="btn btn--outline" type="button" disabled={isSubmitting}>
                <img src={googleIcon} className="btn__icon" alt="" aria-hidden="true" />
                Zarejestruj z Google
              </button>
              <div id="google-button-hidden" className="google-button-overlay"></div>
            </div>
          </div>

          <p className="card__footer">
            Masz już konto? <Link className="card__footer-link" to="/login">Zaloguj się</Link>
          </p>

          {successMessage ? <p className="auth-success">{successMessage}</p> : null}
          {error ? <p className="auth-error">{error}</p> : null}
        </section>
      </div>
    </main>
  );
};

export default RegisterPage;
