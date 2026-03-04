import { Web3AuthProvider } from '../app/context/Web3AuthContext';
import MainLayout from '../pages/MainLayout';

function App() {
  return (
    <Web3AuthProvider>
      <MainLayout />
    </Web3AuthProvider>
  );
}

export default App;
