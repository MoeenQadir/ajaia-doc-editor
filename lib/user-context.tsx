"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { MOCK_USERS, type MockUser } from "./permissions";

interface UserContextType {
  currentUser: MockUser;
  setCurrentUser: (user: MockUser) => void;
  switchUser: (userId: string) => void;
  fetchWithUser: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function ActiveUserProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<MockUser>(MOCK_USERS[0]);

  // Read saved user on mount
  useEffect(() => {
    const saved = localStorage.getItem("ajaia_active_user_id");
    if (saved) {
      const found = MOCK_USERS.find((u) => u.id === saved);
      if (found) {
        setCurrentUserState(found);
      }
    }
  }, []);

  const setCurrentUser = (user: MockUser) => {
    setCurrentUserState(user);
    localStorage.setItem("ajaia_active_user_id", user.id);
  };

  const switchUser = (userId: string) => {
    const found = MOCK_USERS.find((u) => u.id === userId);
    if (found) {
      setCurrentUser(found);
    }
  };

  const fetchWithUser = async (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> => {
    const headers = new Headers(init?.headers);
    headers.set("x-user-id", currentUser.id);

    return fetch(input, {
      ...init,
      headers,
    });
  };

  return (
    <UserContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        switchUser,
        fetchWithUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useActiveUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useActiveUser must be used within an ActiveUserProvider");
  }
  return context;
}

