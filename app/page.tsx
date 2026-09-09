"use client";

import dynamic from "next/dynamic";
import GameApp from "@/components/GameApp";

const ViewGate = dynamic(() => import("@/components/ViewGate"), {
  ssr: false,
});

export default function Home() {
  return (
    <ViewGate>
      <GameApp />
    </ViewGate>
  );
}
