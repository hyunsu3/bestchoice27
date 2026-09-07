"use client";

import { useSyncExternalStore } from "react";

const PASSWORD_KEY = "bestchoice.editPassword";
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return window.sessionStorage.getItem(PASSWORD_KEY) !== null;
}

function getServerSnapshot() {
  return false;
}

export function useViewUnlocked() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export async function unlockView(password: string): Promise<boolean> {
  const res = await fetch("/api/auth/verify", {
    method: "POST",
    headers: { "x-app-password": password },
  });
  if (!res.ok) return false;
  window.sessionStorage.setItem(PASSWORD_KEY, password);
  emit();
  return true;
}
