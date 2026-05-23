import Navbar from "./components/Navbar";
import TripPlannerForm from "./components/TripPlannerForm";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#090401]">
      <Navbar />
      <TripPlannerForm />
    </div>
  );
}
