import type { Metadata } from "next";

import { TakenVisualPrototype } from "./taken-visual-prototype";

export const metadata: Metadata = {
  title: "Taken — tweede visuele proef | MijnPlanning",
  description: "Tweede, rustigere visuele proef van het scherm Taken",
};

export default function TakenPage() {
  return <TakenVisualPrototype />;
}
