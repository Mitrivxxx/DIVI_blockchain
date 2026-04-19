import { Navigate, Route, Routes, BrowserRouter } from "react-router-dom";
import { Web3AuthProvider } from "../service/Web3AuthContext";
import MainLayout from "./layout/MainLayout";
import PublicPage from "../public/main-page/MainPage";
import AuthPage from "./auth/AuthPage";

function App() {
  return (
    <BrowserRouter>
      <Web3AuthProvider>
        <Routes>
          <Route path="/" element={<PublicPage />} />
          <Route path="/app/auth" element={<AuthPage />} />
          <Route path="/app/:tabPath?" element={<MainLayout />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Web3AuthProvider>
    </BrowserRouter>
  );
}

export default App;
