import {
  StudioHeader,
  TextField,
  TextareaField,
  SelectField,
} from "@/components/admin/Field";
import { createCollege } from "@/lib/admin/actions";

export const metadata = { title: "New college" };

const CATEGORIES = ["engineering", "private-deemed", "arts", "business", "regional"] as const;
const TIERS = ["tier-1", "tier-2", "tier-3"] as const;

export default function NewCollegePage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10 md:px-10 md:py-14">
      <StudioHeader kicker="Admin · Colleges" title="New college" />
      <p className="mb-8 font-mono text-meta uppercase tracking-[0.22em] text-newsprint/55">
        Only the basics are required. Slug, case number, accent and fingerprint
        auto-fill if left blank. Truth score and counts compute themselves once
        reviews and claims land.
      </p>

      <form action={createCollege} className="space-y-6">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <TextField label="Name" name="name" required hint="Full institution name" />
          <TextField label="Short name" name="short_name" required />
          <TextField label="Slug" name="slug" hint="auto from name if blank" />
          <TextField label="Case file no." name="case_file_number" hint="auto if blank" />
          <TextField label="City" name="city" required />
          <TextField label="State" name="state" required />
          <TextField label="Founded" name="founded" type="number" defaultValue={2000} />
          <TextField label="Primary accent" name="primary_accent" hint="hex e.g. #FF4332" />
          <SelectField label="Category" name="category" options={CATEGORIES} />
          <SelectField label="Tier" name="tier" options={TIERS} />
          <TextField label="Fingerprint seed" name="fingerprint_seed" hint="auto from slug if blank" />
        </div>

        <TextField label="Tagline" name="tagline" required />
        <TextareaField label="Brochure blurb" name="brochure_blurb" rows={4} required />

        <fieldset className="space-y-5 border-t border-newsprint/10 pt-6">
          <legend className="font-mono text-meta uppercase tracking-[0.3em] text-newsprint/55">
            Fees
          </legend>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <TextField label="Claimed (₹)" name="fee_claimed" type="number" defaultValue={0} />
            <TextField label="Actual (₹)" name="fee_actual" type="number" defaultValue={0} />
          </div>
          <TextField label="Fee note" name="fee_note" />
        </fieldset>

        <div className="flex items-center gap-3 border-t border-newsprint/10 pt-6">
          <button
            type="submit"
            className="bg-truth px-5 py-2.5 font-mono text-meta uppercase tracking-[0.3em] text-newsprint hover:bg-truth/85"
          >
            Create college →
          </button>
          <a
            href="/admin/colleges"
            className="font-mono text-meta uppercase tracking-[0.25em] text-newsprint/55 hover:text-newsprint"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
