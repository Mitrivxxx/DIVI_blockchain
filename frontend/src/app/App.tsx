import { Navigate, Route, Routes, BrowserRouter, useOutletContext, useParams } from "react-router-dom";
import { Web3AuthProvider } from "../service/Web3AuthContext";
import MainLayout from "./layout/MainLayout";
import PublicPage from "../public/main-page/MainPage";
import AuthPage from "./auth/AuthPage";
import LoginPage from "./auth/LoginPage";
import RegisterPage from "./auth/RegisterPage";
import ShareCredentialPage from "./features/profile/ShareCredentialPage";
import PublicProfile from "./features/profile/PublicProfile";
import Home from "./features/home/Home";
import Network from "./features/network/Network";
import Institutions from "./features/institutions/Institutions";
import Upload from "./features/uploadFile/Upload";
import MyDocuments from "./features/MyDocuments";
import IssuedDocuments from "./features/issuedDocuments/IssuedDocuments";
import Verify from "./features/Verify";
import Profile from "./features/profile/Profile";
import Help from "./features/Help";
import IssuerRole from "./features/issuerRole/IssuerRole";
import NotifyPage from "./features/notify/NotifyPage";
import { legacyAppPathRedirect } from "./features/navigation/routes";

type AppOutletContext = {
  userRole: string | null;
  walletAddress: string | null;
};

function LegacyAppRedirect() {
  const { tabPath } = useParams<{ tabPath?: string }>();
  return <Navigate to={legacyAppPathRedirect(tabPath)} replace />;
}

function ProfileBridge() {
  const { userRole, walletAddress } = useOutletContext<AppOutletContext>();
  return <Profile userRole={userRole} walletAddress={walletAddress} />;
}

function NotifyBridge() {
  const { userRole } = useOutletContext<AppOutletContext>();
  return <NotifyPage userRole={userRole} />;
}

function App() {
  return (
    <BrowserRouter>
      <Web3AuthProvider>
        <Routes>
          <Route path="/public" element={<PublicPage />} />
          <Route path="/share/:token" element={<ShareCredentialPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/app/auth" element={<Navigate to="/auth" replace />} />
          <Route path="/app/login" element={<Navigate to="/login" replace />} />
          <Route path="/app/register" element={<Navigate to="/register" replace />} />
          <Route path="/app" element={<Navigate to="/" replace />} />
          <Route path="/app/:tabPath" element={<LegacyAppRedirect />} />

          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/network" element={<Network />} />
            <Route path="/institutions" element={<Institutions />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/profile" element={<ProfileBridge />} />
            <Route path="/u/:ethereumAddress" element={<PublicProfile />} />
            <Route path="/issuer-role" element={<IssuerRole />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/issued-documents" element={<IssuedDocuments />} />
            <Route path="/my-documents" element={<MyDocuments />} />
            <Route path="/notifications" element={<NotifyBridge />} />
            <Route path="/help" element={<Help />} />
          </Route>

          <Route path="*" element={<Navigate to="/public" replace />} />
        </Routes>
      </Web3AuthProvider>
    </BrowserRouter>
  );
}

export default App;
