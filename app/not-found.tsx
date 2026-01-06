import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-indigo-500/20 blur-[100px] rounded-full" />
        <h1 className="relative text-[12rem] font-black tracking-tighter text-gray-900 leading-none">
          404
        </h1>
      </div>

      <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight uppercase">
        Asset Not Found
      </h2>
      <p className="text-gray-500 max-w-sm mx-auto mb-10 font-medium">
        The digital content you are looking for does not exist or has been moved. Verify the URL and
        try again.
      </p>

      <Link
        href="/"
        className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-black shadow-xl hover:bg-black hover:-translate-y-1 transition-all duration-300"
      >
        Return to Store
      </Link>
    </div>
  );
}
