import { useState, useEffect } from 'react';

export function useEthereumAddress() {
  const [ethereumAddress, setEthereumAddress] = useState('');
  const [ethEditable, setEthEditable] = useState(false);

  useEffect(() => {
    const getAddress = async () => {
      if ((window as any).ethereum) {
        try {
          const { ethers } = await import('ethers');
          const provider = new ethers.BrowserProvider((window as any).ethereum);
          const accounts = await provider.send('eth_requestAccounts', []);
          if (accounts && accounts.length > 0) {
            setEthereumAddress(accounts[0]);
            setEthEditable(false);
          }
        } catch {
          // ignore
        }
      }
    };
    getAddress();
  }, []);

  return {
    ethereumAddress,
    setEthereumAddress,
    ethEditable,
    setEthEditable
  };
}