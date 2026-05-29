import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  StudioHeader,
  TextField,
  TextareaField,
  SelectField,
  CheckboxField,
} from "@/components/admin/Field";
import { getSessionUser } from "@/lib/auth";
import { publishSubmissionAsReview } from "@/lib/admin/actions";

export const dynamic = "force-dynamic";

const VIBES = ["rage", "warm", "deadpan", "warning", "redeemed"] as const;
const METHODS = ["email-domain", "id-card", "alumni-roster", "video-selfie"] as const;

type Row = {
  id: number;
  case_no: string;
  college_name: string;
  college_slug: string | null;
  brochure_claim: string;
  reality: string;
  has_receipts: boolean;
  receipt_paths: string[];
  email: string;
  email_domain: string;
  identity: string;
  pseudonym: string;
  status: string;
  submitted_at: Date;
  reviewed_at: Date | null;
  notes: string | null;
};

async function setStatus(id: number, status: string) {
  "use server";
  const u = await getSessionUser();
  if (!u) redirect("/admin/login");
  await sql`
    UPDATE uf_submissions
    SET status = ${status},
        reviewed_at = now(),
        reviewer_user_id = ${u.id},
        updated_at = now()
    WHERE id = ${id}
  `;
  revalidatePath("/admin/submissions");
  revalidatePath(`/admin/submissions/${id}`);
  redirect(`/admin/submissions/${id}?ok=1`);
}

export default async function SubmissionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string }>;
}) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isFinite(id)) notFound();
  const { ok } = await searchParams;

  const [row] = await sql<Row[]>`
    SELECT id, case_no, college_name, college_slug, brochure_claim, reality,
           has_receipts, receipt_paths, email, email_domain, identity, pseudonym,
           status, submitted_at, reviewed_at, notes
    FROM uf_submissions WHERE id = ${id} LIMIT 1
  `;
  if (!row) notFound();

  // Does the resolved slug point at a real college? Drives a warning below.
  const matched = row.college_slug
    ? (
        await sql<{ short_name: string }[]>`
          SELECT short_name FROM uf_colleges WHERE slug = ${row.college_slug} LIMIT 1
        `
      )[0] ?? null
    : null;

  const verify = setStatus.bind(null, id, "verified");
  const reject = setStatus.bind(null, id, "rejected");
  const publish = publishSubmissionAsReview.bind(null, id);

  const isPublished = row.status === "published";
  // Sensible default review title from the claim.
  const defaultTitle =
    row.brochure_claim.length > 70
      ? row.brochure_claim.slice(0, 67) + "…"
      : row.brochure_claim;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 md:px-10 md:py-14">
      <StudioHeader
        kicker={`Admin · Submissions · ${row.case_no}`}
        title={row.college_name}
        rightCol={
          <span
            className={
              "font-mono text-meta uppercase tracking-[0.22em] " +
              (row.status === "verified" || row.status === "published"
                ? "text-[#06D6A0]"
                : row.status === "rejected"
                ? "text-truth"
                : "text-newsprint/75")
            }
          >
            {row.status}
          </span>
        }
      />
      {ok ? (
        <p className="mb-6 border-l-2 border-truth bg-truth/10 px-4 py-2 font-mono text-meta uppercase tracking-[0.25em] text-truth">
          Updated.
        </p>
      ) : null}

      <dl className="space-y-6">
        <Section label="Brochure claim" body={row.brochure_claim} />
        <Section label="Reality" body={row.reality} />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Meta label="Identity" value={`${row.identity} · ${row.pseudonym}`} />
          <Meta label="Email domain" value={row.email_domain} />
          <Meta label="Receipts attached" value={row.has_receipts ? "Yes" : "No"} />
          <Meta
            label="College match"
            value={
              matched
                ? matched.short_name
                : row.college_slug
                ? `unmatched (${row.college_slug})`
                : "—"
            }
          />
          <Meta label="Submitted" value={row.submitted_at.toISOString().slice(0, 19).replace("T", " ")} />
          <Meta label="Reviewed" value={row.reviewed_at?.toISOString().slice(0, 19).replace("T", " ") ?? "—"} />
        </div>

        {row.receipt_paths?.length ? (
          <div>
            <dt className="font-mono text-meta uppercase tracking-[0.3em] text-newsprint/55">
              Receipts ({row.receipt_paths.length})
            </dt>
            <dd className="mt-3 flex flex-wrap gap-3">
              {row.receipt_paths.map((p) => {
                const isPdf = p.toLowerCase().endsWith(".pdf");
                return (
                  <a
                    key={p}
                    href={p}
                    target="_blank"
                    rel="noreferrer"
                    className="block border border-newsprint/20 transition-colors hover:border-truth"
                  >
                    {isPdf ? (
                      <span className="flex h-28 w-28 items-center justify-center font-mono text-meta uppercase tracking-[0.2em] text-newsprint/70">
                        PDF
                      </span>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p} alt="Receipt" className="h-28 w-28 object-cover" />
                    )}
                  </a>
                );
              })}
            </dd>
          </div>
        ) : null}
      </dl>

      {/* Quick triage */}
      <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-newsprint/10 pt-6">
        <form action={verify}>
          <button
            type="submit"
            className="bg-[#06D6A0] px-5 py-2.5 font-mono text-meta uppercase tracking-[0.3em] text-ink hover:bg-[#06D6A0]/85"
          >
            Mark verified →
          </button>
        </form>
        <form action={reject}>
          <button
            type="submit"
            className="border border-newsprint/30 px-5 py-2.5 font-mono text-meta uppercase tracking-[0.25em] text-newsprint/75 hover:border-truth hover:text-truth"
          >
            Reject
          </button>
        </form>
        <a
          href="/admin/submissions"
          className="ml-auto font-mono text-meta uppercase tracking-[0.25em] text-newsprint/55 hover:text-newsprint"
        >
          ← Back to inbox
        </a>
      </div>

      {/* Publish → public review */}
      <section className="mt-12 border border-truth/30 bg-truth/[0.04] p-6 md:p-7">
        <h2 className="font-display text-2xl font-medium text-newsprint">
          {isPublished ? "Published as a review" : "Publish as a public review"}
        </h2>
        <p className="mt-2 font-mono text-meta uppercase tracking-[0.22em] text-newsprint/55">
          {isPublished
            ? "This submission is already on the wall. Re-publishing is disabled."
            : "Fill the review fields, then publish. This writes a live row to the reviews wall and re-computes the college’s truth score."}
        </p>

        {!isPublished && !matched ? (
          <p className="mt-4 border-l-2 border-truth bg-truth/10 px-3 py-2 font-mono text-meta uppercase tracking-[0.2em] text-truth">
            Heads up: no college matches “{row.college_slug ?? row.college_name}”. The review will
            still publish to the wall, but won’t appear on a college page until a college with this
            slug exists. Create it under Colleges first if you want the link.
          </p>
        ) : null}

        {!isPublished ? (
          <form action={publish} className="mt-6 space-y-6">
            <TextField label="Headline / title" name="title" defaultValue={defaultTitle} required />
            <TextareaField
              label="Body"
              name="body"
              defaultValue={row.reality}
              rows={6}
              hint="Pre-filled from the student’s reality. Edit for clarity; don’t change the facts."
            />
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <TextField
                label="College slug"
                name="college_slug"
                defaultValue={row.college_slug ?? ""}
                hint="Must match a college slug to show on its page"
              />
              <TextField label="Author pseudonym" name="author_pseudonym" defaultValue={row.pseudonym} required />
              <TextField label="Author year (1–5)" name="author_year" type="number" defaultValue={3} min={1} max={5} />
              <TextField label="Author branch" name="author_branch" defaultValue="Undisclosed" />
              <TextField label="Rating (1–5)" name="rating" type="number" defaultValue={3} min={1} max={5} />
              <TextField label="Truth score (0–100)" name="truth_score" type="number" defaultValue={70} min={0} max={100} />
              <SelectField label="Vibe" name="vibe" options={VIBES} defaultValue="warning" />
              <SelectField label="Verification method" name="verification_method" options={METHODS} defaultValue="email-domain" />
            </div>
            <TextareaField
              label="Tags"
              name="tags"
              defaultValue=""
              rows={2}
              hint="comma- or newline-separated"
            />
            <CheckboxField label="Has video" name="has_video" />

            <div className="flex items-center gap-3 border-t border-newsprint/10 pt-6">
              <button
                type="submit"
                className="bg-truth px-5 py-2.5 font-mono text-meta uppercase tracking-[0.3em] text-newsprint hover:bg-truth/85"
              >
                Publish to wall →
              </button>
              <span className="font-mono text-meta uppercase tracking-[0.2em] text-newsprint/45">
                {row.receipt_paths?.length ?? 0} receipt(s) will carry over
              </span>
            </div>
          </form>
        ) : null}
      </section>
    </div>
  );
}

function Section({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <dt className="font-mono text-meta uppercase tracking-[0.3em] text-newsprint/55">
        {label}
      </dt>
      <dd className="mt-2 whitespace-pre-wrap font-serif text-lg leading-relaxed text-newsprint">
        {body}
      </dd>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-meta uppercase tracking-[0.25em] text-newsprint/55">
        {label}
      </p>
      <p className="mt-1 font-sans text-newsprint">{value}</p>
    </div>
  );
}
