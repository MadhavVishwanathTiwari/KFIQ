import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-6 py-20 text-center overflow-hidden">
      {/* Ambient backdrop matching kfiq2 */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-dot-grid opacity-50 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
        <div className="animate-aurora absolute -left-32 -top-32 size-[32rem] rounded-full bg-zinc-200/60 blur-3xl" />
        <div className="animate-float-slow absolute -right-24 top-8 size-[24rem] rounded-full bg-zinc-300/40 blur-3xl" />
      </div>

      <div className="mb-6 flex items-center justify-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0a0a0a] text-white text-xs font-bold tracking-widest">
          K
        </span>
        <span className="text-sm font-semibold text-zinc-400 tracking-widest uppercase">
          KFIQ
        </span>
      </div>

      <h1 className="font-display text-4xl font-extrabold tracking-tight text-[#0a0a0a] sm:text-5xl">
        Finish your registration
      </h1>
      <p className="mx-auto mt-5 max-w-md text-lg leading-relaxed text-zinc-500">
        Set your password, upload your resume, and complete your profile so we
        can match you with the right tasks.
      </p>
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
        <Link
          href="/onboarding"
          className="btn btn-primary inline-flex"
        >
          Continue onboarding →
        </Link>
      </div>
      <p className="mt-8 text-xs text-zinc-400">
        Free forever. No fees, ever.
      </p>
    </main>
  );
}