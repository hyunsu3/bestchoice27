"use client";

import { requestPassword } from "./passwordPrompt";

const PASSWORD_KEY = "bestchoice.editPassword";

function getStoredPassword(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(PASSWORD_KEY);
}

async function promptForPassword(): Promise<string | null> {
  const pw = await requestPassword();
  if (pw) window.sessionStorage.setItem(PASSWORD_KEY, pw);
  return pw;
}

export async function authorizedFetch(url: string, init: RequestInit = {}) {
  let pw = getStoredPassword() ?? (await promptForPassword());
  if (!pw) throw new Error("비밀번호를 입력해야 합니다.");

  const withAuth = (password: string): RequestInit => ({
    ...init,
    headers: { ...(init.headers ?? {}), "x-app-password": password },
  });

  let res = await fetch(url, withAuth(pw));
  if (res.status === 401) {
    window.sessionStorage.removeItem(PASSWORD_KEY);
    pw = await promptForPassword();
    if (!pw) throw new Error("비밀번호를 입력해야 합니다.");
    res = await fetch(url, withAuth(pw));
  }
  return res;
}
