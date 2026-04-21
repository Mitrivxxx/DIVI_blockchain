import { Navigate, Route, Routes, BrowserRouter } from "react-router-dom";
import { Web3AuthProvider } from "../service/Web3AuthContext";
import MainLayout from "./layout/MainLayout";
import PublicPage from "../public/main-page/MainPage";
import AuthPage from "./auth/AuthPage";
import LoginPage from "./auth/LoginPage";
import RegisterPage from "./auth/RegisterPage";

function App() {
  return (
    <BrowserRouter>
      <Web3AuthProvider>
        <Routes>
          <Route path="/" element={<PublicPage />} />
          <Route path="/app/auth" element={<Navigate to="/auth" replace />} />
          <Route path="/app/login" element={<Navigate to="/login" replace />} />
          <Route path="/app/register" element={<Navigate to="/register" replace />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/app/:tabPath?" element={<MainLayout />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Web3AuthProvider>
    </BrowserRouter>
  );
}

export default App;
