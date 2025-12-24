import SearchClient from "./SearchClient";

export default function Page() {
  return (
    <div className="min-h-screen bg-[#F9F9F9] p-4 sm:p-6">
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#8B1538] focus:text-white focus:rounded-md focus:font-medium focus:outline-none focus:ring-2 focus:ring-[#8B1538] focus:ring-offset-2"
      >
        Skip to main content
      </a>

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

      <main id="main-content" className="mt-6">
        <SearchClient />
      </main>
    </div>
  );
}
