import TripPlannerForm from "./components/TripPlannerForm";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex flex-col items-center justify-center px-4 py-16">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-2">
          Plan Your Northeast Trip
        </h1>
        <p className="text-gray-500 text-base">
          A smarter way to plan Meghalaya trips
        </p>
      </div>
      <TripPlannerForm />
    </main>
  );
}
