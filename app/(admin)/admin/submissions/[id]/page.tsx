import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { StudioHeader } from "@/components/admin/Field";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Row = {
  id: number;
  case_no: string;
  college_name: string;
  college_slug: string | null;
  brochure_claim: string;
  reality: string;
  has_receipts: boolean;
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
           has_receipts, email, email_domain, identity, pseudonym, status,
           submitted_at, reviewed_at, notes
    FROM uf_submissions WHERE id = ${id} LIMIT 1
  `;
  if (!row) notFound();

  const verify = setStatus.bind(null, id, "verified");
  const reject = setStatus.bind(null, id, "rejected");
  const publish = setStatus.bind(null, id, "published");

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
          <Meta label="College slug (resolved)" value={row.college_slug ?? "—"} />
          <Meta label="Submitted" value={row.submitted_at.toISOString().slice(0, 19).replace("T", " ")} />
          <Meta label="Reviewed" value={row.reviewed_at?.toISOString().slice(0, 19).replace("T", " ") ?? "—"} />
        </div>
      </dl>

      <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-newsprint/10 pt-6">
        <form action={verify}>
          <button
            type="submit"
            className="bg-[#06D6A0] px-5 py-2.5 font-mono text-meta uppercase tracking-[0.3em] text-ink hover:bg-[#06D6A0]/85"
          >
            Verify →
          </button>
        </form>
        <form action={publish}>
          <button
            type="submit"
            className="bg-truth px-5 py-2.5 font-mono text-meta uppercase tracking-[0.3em] text-newsprint hover:bg-truth/85"
          >
            Publish →
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
