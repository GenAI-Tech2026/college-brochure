import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import {
  StudioHeader,
  TextField,
  TextareaField,
  SelectField,
  SubmitRow,
} from "@/components/admin/Field";
import { updateCollege, deleteCollege } from "@/lib/admin/actions";

export const dynamic = "force-dynamic";

const CATEGORIES = ["engineering", "private-deemed", "arts", "business", "regional"] as const;
const TIERS = ["tier-1", "tier-2", "tier-3"] as const;

type Row = {
  id: number;
  slug: string;
  name: string;
  short_name: string;
  city: string;
  state: string;
  founded: number;
  category: string;
  tier: string;
  case_file_number: string;
  primary_accent: string;
  fingerprint_seed: string;
  truth_score: number;
  review_count: number;
  verified_count: number;
  tagline: string;
  brochure_blurb: string;
  long_read_deck: string;
  long_read_pull_quote: string;
  long_read_byline: string;
  fee_claimed: number;
  fee_actual: number;
  fee_note: string;
};

export default async function EditCollegePage({
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
    SELECT id, slug, name, short_name, city, state, founded, category, tier,
           case_file_number, primary_accent, fingerprint_seed, truth_score,
           review_count, verified_count, tagline, brochure_blurb,
           long_read_deck, long_read_pull_quote, long_read_byline,
           fee_claimed, fee_actual, fee_note
    FROM uf_colleges WHERE id = ${id} LIMIT 1
  `;
  if (!row) notFound();

  const save = updateCollege.bind(null, id);
  const del = deleteCollege.bind(null, id);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 md:px-10 md:py-14">
      <StudioHeader
        kicker={`Admin · Colleges · #${row.id}`}
        title={row.short_name}
      />
      {ok ? (
        <p className="mb-6 border-l-2 border-truth bg-truth/10 px-4 py-2 font-mono text-meta uppercase tracking-[0.25em] text-truth">
          Saved.
        </p>
      ) : null}

      <form action={save} className="space-y-6">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <TextField label="Slug" name="slug" defaultValue={row.slug} required />
          <TextField label="Case file no." name="case_file_number" defaultValue={row.case_file_number} />
          <TextField label="Name" name="name" defaultValue={row.name} required />
          <TextField label="Short name" name="short_name" defaultValue={row.short_name} required />
          <TextField label="City" name="city" defaultValue={row.city} />
          <TextField label="State" name="state" defaultValue={row.state} />
          <TextField label="Founded" name="founded" type="number" defaultValue={row.founded} />
          <TextField label="Primary accent" name="primary_accent" defaultValue={row.primary_accent} hint="hex e.g. #FF4332" />
          <SelectField label="Category" name="category" options={CATEGORIES} defaultValue={row.category} />
          <SelectField label="Tier" name="tier" options={TIERS} defaultValue={row.tier} />
          <TextField label="Truth score" name="truth_score" type="number" defaultValue={row.truth_score} hint="0–100" />
          <TextField label="Fingerprint seed" name="fingerprint_seed" defaultValue={row.fingerprint_seed} />
          <TextField label="Review count" name="review_count" type="number" defaultValue={row.review_count} />
          <TextField label="Verified count" name="verified_count" type="number" defaultValue={row.verified_count} />
        </div>

        <TextField label="Tagline" name="tagline" defaultValue={row.tagline} />
        <TextareaField label="Brochure blurb" name="brochure_blurb" defaultValue={row.brochure_blurb} rows={4} />

        <fieldset className="space-y-5 border-t border-newsprint/10 pt-6">
          <legend className="font-mono text-meta uppercase tracking-[0.3em] text-newsprint/55">
            Long read
          </legend>
          <TextField label="Deck" name="long_read_deck" defaultValue={row.long_read_deck} />
          <TextField label="Pull quote" name="long_read_pull_quote" defaultValue={row.long_read_pull_quote} />
          <TextField label="Byline" name="long_read_byline" defaultValue={row.long_read_byline} />
        </fieldset>

        <fieldset className="space-y-5 border-t border-newsprint/10 pt-6">
          <legend className="font-mono text-meta uppercase tracking-[0.3em] text-newsprint/55">
            Fees
          </legend>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <TextField label="Claimed (₹)" name="fee_claimed" type="number" defaultValue={row.fee_claimed} />
            <TextField label="Actual (₹)" name="fee_actual" type="number" defaultValue={row.fee_actual} />
          </div>
          <TextField label="Fee note" name="fee_note" defaultValue={row.fee_note} />
        </fieldset>

        <SubmitRow
          showDelete
          deleteFormId="delete-college"
          cancelHref="/admin/colleges"
        />
      </form>

      <form id="delete-college" action={del} className="hidden" />
    </div>
  );
}
