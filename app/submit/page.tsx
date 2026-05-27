import { Suspense } from "react";
import { MultiStepForm } from "@/components/submit/MultiStepForm";

export const metadata = { title: "Submit your truth" };

interface SearchParams { searchParams: Promise<{ college?: string }>; }

export default async function SubmitPage({ searchParams }: SearchParams) {
  const { college } = await searchParams;
  return (
    <div className="min-h-screen bg-ink px-6 pb-32 pt-32 md:px-10">
      <header className="mb-16">
        <p className="font-mono text-meta uppercase tracking-[0.3em] text-newsprint/60">
          Section · Classified · Submit
        </p>
        <h1 className="mt-3 font-display text-[clamp(3rem,10vw,10rem)] font-black uppercase leading-[0.85] tracking-[-0.04em] text-newsprint">
          File your <span className="italic text-truth">testimony.</span>
        </h1>
        <p className="mt-6 max-w-2xl font-serif text-xl text-newsprint/80">
          Five short steps. Pseudonymous by default. Verified before publication. Your name never appears. Your truth always does.
        </p>
      </header>
      <Suspense fallback={null}>
        <MultiStepForm defaultCollege={college} />
      </Suspense>
    </div>
  );
}
