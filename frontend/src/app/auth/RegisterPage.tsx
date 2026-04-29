import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useWeb3Auth } from "../../service/web3/useWeb3Auth";
import { API_URL } from "../../types/api";
import logo from "../../assets/icons/divi_icon_demo.png";
import metamaskIcon from "../../assets/icons/Metamask.svg";
import googleIcon from "../../assets/icons/google.svg";
import "./RegisterPage.scss";

const RegisterPage = () => {
  const { address, connect } = useWeb3Auth();
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

      setEmail("");
      setPassword("");
      setSuccessMessage("Konto zostało utworzone.");
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

  const handleGoogleRegister = () => {
    setError(null);
    setSuccessMessage("Rejestracja przez Google nie jest jeszcze skonfigurowana.");
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

            <button className="btn btn--outline" type="button" onClick={handleGoogleRegister} disabled={isSubmitting}>
              <img src={googleIcon} className="btn__icon" alt="" aria-hidden="true" />
              Zarejestruj z Google
            </button>
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
