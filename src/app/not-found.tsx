import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
      <p className="mb-2 font-mono text-sm font-medium uppercase tracking-widest text-navo-blue">
        Error
      </p>
      <h1 className="mb-4 text-[8rem] font-bold leading-none text-navo-navy dark:text-white">
        404
      </h1>
      <h2 className="mb-3 text-2xl font-semibold text-navo-navy dark:text-white">
        Page not found
      </h2>
      <p className="mb-8 max-w-md text-gray-500 dark:text-gray-400">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 rounded-lg bg-navo-blue px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-navo-deep focus:outline-none focus:ring-2 focus:ring-navo-blue focus:ring-offset-2 dark:focus:ring-offset-gray-950"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
