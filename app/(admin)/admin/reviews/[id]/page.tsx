import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import {
  StudioHeader,
  TextField,
  TextareaField,
  SelectField,
  CheckboxField,
  SubmitRow,
} from "@/components/admin/Field";
import { updateReview, deleteReview } from "@/lib/admin/actions";

export const dynamic = "force-dynamic";

const VIBES = ["rage", "warm", "deadpan", "warning", "redeemed"] as const;
const METHODS = ["id-card", "email-domain", "alumni-roster", "video-selfie"] as const;

type Row = {
  id: number;
  college_slug: string;
  author_pseudonym: string;
  author_year: number;
  author_branch: string;
  rating: number;
  truth_score: number;
  title: string;
  body: string;
  tags: string[];
  vibe: string;
  has_video: boolean;
  verification_method: string;
  upvotes: number;
  receipts: number;
};

export default async function EditReviewPage({
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
    SELECT id, college_slug, author_pseudonym, author_year, author_branch,
           rating, truth_score, title, body, tags, vibe, has_video,
           verification_method, upvotes, receipts
    FROM uf_reviews WHERE id = ${id} LIMIT 1
  `;
  if (!row) notFound();

  const save = updateReview.bind(null, id);
  const del = deleteReview.bind(null, id);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 md:px-10 md:py-14">
      <StudioHeader
        kicker={`Admin · Reviews · #${row.id}`}
        title={row.title.slice(0, 60)}
      />
      {ok ? (
        <p className="mb-6 border-l-2 border-truth bg-truth/10 px-4 py-2 font-mono text-meta uppercase tracking-[0.25em] text-truth">
          Saved.
        </p>
      ) : null}

      <form action={save} className="space-y-6">
        <TextField label="Title" name="title" defaultValue={row.title} required />
        <TextareaField label="Body" name="body" defaultValue={row.body} rows={8} required />

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <TextField label="College slug" name="college_slug" defaultValue={row.college_slug} required />
          <TextField label="Author pseudonym" name="author_pseudonym" defaultValue={row.author_pseudonym} required />
          <TextField label="Author year (1–5)" name="author_year" type="number" defaultValue={row.author_year} />
          <TextField label="Author branch" name="author_branch" defaultValue={row.author_branch} />
          <TextField label="Rating (1–5)" name="rating" type="number" defaultValue={row.rating} />
          <TextField label="Truth score (0–100)" name="truth_score" type="number" defaultValue={row.truth_score} />
          <SelectField label="Vibe" name="vibe" options={VIBES} defaultValue={row.vibe} />
          <SelectField label="Verification method" name="verification_method" options={METHODS} defaultValue={row.verification_method} />
          <TextField label="Upvotes" name="upvotes" type="number" defaultValue={row.upvotes} />
          <TextField label="Receipts" name="receipts" type="number" defaultValue={row.receipts} />
        </div>

        <TextareaField
          label="Tags"
          name="tags"
          defaultValue={row.tags.join(", ")}
          rows={2}
          hint="comma- or newline-separated"
        />

        <CheckboxField label="Has video" name="has_video" defaultChecked={row.has_video} />

        <SubmitRow showDelete deleteFormId="delete-review" cancelHref="/admin/reviews" />
      </form>

      <form id="delete-review" action={del} className="hidden" />
    </div>
  );
}
