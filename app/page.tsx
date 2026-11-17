import Generator from "@/components/Generator";
import HeroCinema from "@/components/HeroCinema";
import LiveSiteModal from "@/components/LiveSite";
import Motion from "@/components/Motion";
import Nav from "@/components/Nav";
import RingSection from "@/components/RingSection";
import { Faq, FinalCta, Footer, Guarantee, Plans, Process, WaFloat } from "@/components/Sections";
import Wall from "@/components/Wall";

export default function Home() {
  return (
    <>
      <Motion />
      <Nav />
      <main>
        <HeroCinema />
        <RingSection />
        <Generator />
        <Wall />
        <Process />
        <Plans />
        <Guarantee />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
      <WaFloat />
      <LiveSiteModal />
    </>
  );
}
