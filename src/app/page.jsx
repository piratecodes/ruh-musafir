import Image from "next/image";
import Header from "@/components/landing/header";
import Rooms from "@/components/landing/RoomsPreview";
import Experiences from "@/components/landing/Experiences";
import Cta from "@/components/landing/cta";

export default function Home() {
  return (
    <main>
      <Header />
      <Rooms />
      <Experiences />
      <Cta />
    </main>

  );
}
