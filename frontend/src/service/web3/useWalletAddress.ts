import { useWeb3Auth } from '../Web3AuthContext';

export function useWalletAddress(): [string | null] {
  const { address } = useWeb3Auth();
  return [address];
}
