import { useWeb3Auth } from "../web3/useWeb3Auth";
import { EMAIL_LOGIN_STORAGE_KEY } from "./constants";

export function useIsAuthenticated() {
  const { jwt } = useWeb3Auth();
  const isEmailSessionActive = localStorage.getItem(EMAIL_LOGIN_STORAGE_KEY) === "1";

  return !!jwt || isEmailSessionActive;
}
