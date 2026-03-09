import { Navigate, Route, Routes, BrowserRouter } from "react-router-dom";
import { Web3AuthProvider } from "../app/context/Web3AuthContext";
import MainLayout from "../pages/MainLayout";
import PublicPage from "../public/main-page/MainPage";

function App() {
  return (
    <BrowserRouter>
      <Web3AuthProvider>
        <Routes>
          <Route path="/" element={<PublicPage />} />
          <Route path="/app" element={<MainLayout />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Web3AuthProvider>
    </BrowserRouter>
  );
}

export default App;
