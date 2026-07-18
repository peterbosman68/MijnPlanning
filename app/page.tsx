export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-16">
      <section aria-labelledby="page-title">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-600">
          Technische basis
        </p>
        <h1 id="page-title" className="mt-2 text-3xl font-semibold text-slate-950">
          MijnPlanning
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-slate-700">
          De technische projectbasis is gereed.
        </p>
      </section>
    </main>
  );
}
