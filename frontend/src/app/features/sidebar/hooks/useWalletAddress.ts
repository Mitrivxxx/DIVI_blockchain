import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

export function useWalletAddress(): [string | null, React.Dispatch<React.SetStateAction<string | null>>] {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    const getAddress = async () => {
      if (window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await provider.send('eth_requestAccounts', []);
          if (accounts && accounts.length > 0) {
            setWalletAddress(accounts[0]);
          }
        } catch (err) {
          setWalletAddress(null);
        }
      } else {
        setWalletAddress(null);
      }
    };
    getAddress();

    // Listen for account changes in MetaMask
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts && accounts.length > 0) {
          setWalletAddress(accounts[0] ?? null);
        } else {
          setWalletAddress(null);
        }
      };
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, []);

  return [walletAddress, setWalletAddress];
}
