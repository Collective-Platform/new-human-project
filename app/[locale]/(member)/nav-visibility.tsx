"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

type NavVisibilityContextValue = {
  hidden: boolean;
  setHidden: (hidden: boolean) => void;
};

const NavVisibilityContext = createContext<NavVisibilityContextValue>({
  hidden: false,
  setHidden: () => {},
});

export function NavVisibilityProvider({ children }: { children: ReactNode }) {
  const [hidden, setHiddenState] = useState(false);
  const setHidden = useCallback((v: boolean) => setHiddenState(v), []);
  return (
    <NavVisibilityContext.Provider value={{ hidden, setHidden }}>
      {children}
    </NavVisibilityContext.Provider>
  );
}

export function useNavVisibility() {
  return useContext(NavVisibilityContext);
}
