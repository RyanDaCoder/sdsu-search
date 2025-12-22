import SearchClient from "./SearchClient";

export default function Page() {
  return (
    <div className="min-h-screen p-6">
      <h1 className="text-2xl font-semibold">SDSU Search</h1>
      <p className="text-sm opacity-70 mt-1">
        Search courses and filter sections by subject/days/time/modality/instructor.
      </p>

      <div className="mt-6">
        <SearchClient />
      </div>
    </div>
  );
}
