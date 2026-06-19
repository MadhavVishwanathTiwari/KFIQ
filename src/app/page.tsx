import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
      <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-indigo-600">
        KFIQ Internship Platform
      </p>
      <h1 className="mb-4 text-4xl font-bold tracking-tight text-slate-900">
        Finish your registration
      </h1>
      <p className="mb-8 max-w-xl text-lg text-slate-600">
        Set your password, upload your resume, and enrich your profile so we can
        match you with the right tasks.
      </p>
      <Link href="/onboarding" className="btn btn-primary">
        Continue onboarding
      </Link>
    </main>
  );
}
