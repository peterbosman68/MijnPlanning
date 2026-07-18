import type { Metadata } from "next";

import { TakenVisualPrototype } from "./taken-visual-prototype";

export const metadata: Metadata = {
  title: "Taken — visuele proef | MijnPlanning",
  description: "Voorlopige visuele proef van het scherm Taken",
};

export default function TakenPage() {
  return <TakenVisualPrototype />;
}
