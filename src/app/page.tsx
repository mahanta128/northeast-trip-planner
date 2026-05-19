import Navbar from "./components/Navbar";
import TripPlannerForm from "./components/TripPlannerForm";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F7F4F0]">
      <Navbar />
      <TripPlannerForm />
    </div>
  );
}
