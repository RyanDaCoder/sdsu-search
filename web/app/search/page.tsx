import SearchClient from "./SearchClient";

export default function Page() {
  return (
    <div className="min-h-screen bg-[#F9F9F9] p-4 sm:p-6">
      <div className="mb-10 text-center">
        <h1 className="text-3xl sm:text-4xl font-semibold text-[#2C2C2C] tracking-tight mb-3">
          SDSU Course Search
        </h1>
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="h-px w-12 bg-[#8B1538]"></div>
          <div className="h-1.5 w-1.5 rounded-full bg-[#8B1538]"></div>
          <div className="h-px w-12 bg-[#8B1538]"></div>
        </div>
        <p className="text-sm text-[#525252] max-w-2xl mx-auto leading-relaxed">
          Search courses and filter sections by subject, days, time, modality, and instructor. Build your schedule and plan your semester.
        </p>
      </div>

      <div className="mt-6">
        <SearchClient />
      </div>
    </div>
  );
}
