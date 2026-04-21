import { Link } from "react-router-dom";
import logo from "../../assets/icons/divi_icon_demo.png";
import metamaskIcon from "../../assets/icons/Metamask.svg";
import googleIcon from "../../assets/icons/google.svg";
import "./LoginPage.scss";

const LoginPage = () => {
  return (
    <main className="auth-login">
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
            <button className="btn btn--outline" type="button">
              <img src={metamaskIcon} className="btn__icon" alt="" aria-hidden="true" />
              MetaMask
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

          <button className="btn btn--primary" type="button">
            ZALOGUJ SIĘ ZA POMOCĄ KONTA
          </button>

          <p className="card__footer">
            Nie masz konta? <Link className="card__footer-link" to="/register">Zarejestruj się</Link>
          </p>
        </section>
      </div>
    </main>
  );
};

export default LoginPage;
