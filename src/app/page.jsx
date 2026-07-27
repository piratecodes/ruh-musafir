import Image from "next/image";
import Header from "@/component/landing/header";
import Rooms from "@/component/landing/RoomsPreview";
import Experiences from "@/component/landing/Experiences";
import Cta from "@/component/landing/cta";

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
