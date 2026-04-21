import { Link } from "react-router-dom";
import logo from "../../assets/icons/divi_icon_demo.png";
import googleIcon from "../../assets/icons/google.svg";
import "./RegisterPage.scss";

const RegisterPage = () => {
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

          <form className="register-form" onSubmit={(event) => event.preventDefault()}>
            <label className="register-form__field">
              <span className="register-form__label">Imię</span>
              <input
                className="register-form__input"
                type="text"
                name="firstName"
                placeholder="Jan"
                autoComplete="given-name"
              />
            </label>

            <label className="register-form__field">
              <span className="register-form__label">Nazwisko</span>
              <input
                className="register-form__input"
                type="text"
                name="lastName"
                placeholder="Kowalski"
                autoComplete="family-name"
              />
            </label>

            <label className="register-form__field">
              <span className="register-form__label">E-mail</span>
              <input
                className="register-form__input"
                type="email"
                name="email"
                placeholder="jan@divi.com"
                autoComplete="email"
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
              />
            </label>

            <label className="register-form__field">
              <span className="register-form__label">Powtórz hasło</span>
              <input
                className="register-form__input"
                type="password"
                name="confirmPassword"
                placeholder="Powtórz hasło"
                autoComplete="new-password"
              />
            </label>

            <label className="register-form__terms">
              <input className="register-form__checkbox" type="checkbox" name="terms" />
              <span>Akceptuję regulamin i politykę prywatności</span>
            </label>

            <button className="btn btn--primary" type="submit">
              UTWÓRZ KONTO
            </button>
          </form>

          <div className="divider">
            <span className="divider__line" />
            <span className="divider__text">lub</span>
            <span className="divider__line" />
          </div>

          <button className="btn btn--outline btn--full" type="button">
            <img src={googleIcon} className="btn__icon" alt="" aria-hidden="true" />
            Zarejestruj z Google
          </button>

          <p className="card__footer">
            Masz już konto? <Link className="card__footer-link" to="/login">Zaloguj się</Link>
          </p>
        </section>
      </div>
    </main>
  );
};

export default RegisterPage;
