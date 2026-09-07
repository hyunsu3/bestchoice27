import GameApp from "@/components/GameApp";
import ViewGate from "@/components/ViewGate";

export default function Home() {
  return (
    <ViewGate>
      <GameApp />
    </ViewGate>
  );
}
