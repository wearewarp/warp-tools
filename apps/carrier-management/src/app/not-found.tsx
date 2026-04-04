import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-8">
      <div className="text-6xl font-bold text-[#1A2235] mb-4">404</div>
      <h1 className="text-xl font-semibold text-white mb-2">Page not found</h1>
      <p className="text-sm text-[#8B95A5] mb-6 max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="px-4 py-2 bg-[#00C650] hover:bg-[#00B347] text-black font-semibold rounded-xl text-sm transition-colors"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
