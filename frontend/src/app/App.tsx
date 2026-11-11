import { Navigate, Route, Routes, BrowserRouter, useOutletContext, useParams } from "react-router-dom";
import { AuthPage, LoginPage, RegisterPage, Web3AuthProvider } from "@/modules/identity";
import { NetworkPage, ProfilePage, PublicProfilePage } from "@/modules/members";
import {
  InstitutionDetailPage,
  InstitutionsPage,
  IssuerRolePage,
  NotifyPage,
} from "@/modules/issuers";
import {
  IssuedDocumentsPage,
  MyDocumentsPage,
  ShareCredentialPage,
  UploadPage,
  VerifyPage,
} from "@/modules/documents";
import PublicPage from "@/public/main-page/MainPage";
import { legacyAppPathRedirect } from "@/shared/lib/routes";
import MainLayout from "./layout/MainLayout";
import HomePage from "./pages/HomePage";
import HelpPage from "./pages/HelpPage";

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
  return <ProfilePage userRole={userRole} walletAddress={walletAddress} />;
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
            <Route path="/" element={<HomePage />} />
            <Route path="/network" element={<NetworkPage />} />
            <Route path="/institutions" element={<InstitutionsPage />} />
            <Route path="/i/:memberId" element={<InstitutionDetailPage />} />
            <Route path="/verify" element={<VerifyPage />} />
            <Route path="/profile" element={<ProfileBridge />} />
            <Route path="/u/:ethereumAddress" element={<PublicProfilePage />} />
            <Route path="/issuer-role" element={<IssuerRolePage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/issued-documents" element={<IssuedDocumentsPage />} />
            <Route path="/my-documents" element={<MyDocumentsPage />} />
            <Route path="/notifications" element={<NotifyBridge />} />
            <Route path="/help" element={<HelpPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/public" replace />} />
        </Routes>
      </Web3AuthProvider>
    </BrowserRouter>
  );
}

export default App;
