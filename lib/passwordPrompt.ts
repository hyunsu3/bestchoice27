"use client";

type Listener = (open: boolean) => void;

let listener: Listener | null = null;
let resolver: ((value: string | null) => void) | null = null;

export function subscribePasswordPrompt(l: Listener) {
  listener = l;
  return () => {
    if (listener === l) listener = null;
  };
}

export function requestPassword(): Promise<string | null> {
  return new Promise((resolve) => {
    resolver = resolve;
    listener?.(true);
  });
}

export function resolvePasswordPrompt(value: string | null) {
  resolver?.(value);
  resolver = null;
  listener?.(false);
}
