/**
 * Tiny form-field primitives. Server-component-safe (no client JS).
 * Styled to match the studio's typographic system.
 */

type BaseProps = {
  label: string;
  name: string;
  hint?: string;
  required?: boolean;
};

export function TextField({
  label,
  name,
  defaultValue,
  hint,
  required,
  type = "text",
  min,
  max,
  step,
}: BaseProps & {
  defaultValue?: string | number;
  type?: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <label className="block">
      <span className="block font-mono text-meta uppercase tracking-[0.25em] text-newsprint/60">
        {label}
        {required ? <span className="ml-1 text-truth">*</span> : null}
      </span>
      <input
        type={type}
        name={name}
        required={required}
        min={min}
        max={max}
        step={step}
        defaultValue={defaultValue ?? ""}
        className="can-fade mt-2 w-full border-b border-newsprint/30 bg-transparent py-2 text-newsprint outline-none focus:border-truth"
      />
      {hint ? (
        <span className="mt-1 block font-mono text-[0.65rem] uppercase tracking-[0.2em] text-newsprint/45">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

export function TextareaField({
  label,
  name,
  defaultValue,
  rows = 5,
  hint,
  required,
}: BaseProps & { defaultValue?: string; rows?: number }) {
  return (
    <label className="block">
      <span className="block font-mono text-meta uppercase tracking-[0.25em] text-newsprint/60">
        {label}
        {required ? <span className="ml-1 text-truth">*</span> : null}
      </span>
      <textarea
        name={name}
        required={required}
        defaultValue={defaultValue ?? ""}
        rows={rows}
        className="can-fade mt-2 w-full resize-vertical border border-newsprint/20 bg-transparent p-3 text-newsprint outline-none focus:border-truth"
      />
      {hint ? (
        <span className="mt-1 block font-mono text-[0.65rem] uppercase tracking-[0.2em] text-newsprint/45">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

export function SelectField({
  label,
  name,
  options,
  defaultValue,
  required,
}: BaseProps & { options: readonly string[]; defaultValue?: string }) {
  return (
    <label className="block">
      <span className="block font-mono text-meta uppercase tracking-[0.25em] text-newsprint/60">
        {label}
        {required ? <span className="ml-1 text-truth">*</span> : null}
      </span>
      <select
        name={name}
        defaultValue={defaultValue ?? options[0]}
        required={required}
        className="can-fade mt-2 w-full border-b border-newsprint/30 bg-[#141210] py-2 text-newsprint outline-none focus:border-truth"
      >
        {options.map((o) => (
          <option key={o} value={o} className="bg-ink">
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

export function CheckboxField({
  label,
  name,
  defaultChecked,
  hint,
}: Omit<BaseProps, "required"> & { defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-3">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        value="1"
        className="h-4 w-4 accent-truth"
      />
      <span className="font-mono text-meta uppercase tracking-[0.25em] text-newsprint/70">
        {label}
      </span>
      {hint ? (
        <span className="font-mono text-meta uppercase tracking-[0.2em] text-newsprint/40">
          · {hint}
        </span>
      ) : null}
    </label>
  );
}

export function SubmitRow({
  saveLabel = "Save",
  showDelete = false,
  deleteFormId,
  cancelHref,
}: {
  saveLabel?: string;
  showDelete?: boolean;
  deleteFormId?: string;
  cancelHref?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-newsprint/10 pt-6">
      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="bg-truth px-5 py-2.5 font-mono text-meta uppercase tracking-[0.3em] text-newsprint transition-colors hover:bg-truth/85"
        >
          {saveLabel} →
        </button>
        {cancelHref ? (
          <a
            href={cancelHref}
            className="font-mono text-meta uppercase tracking-[0.25em] text-newsprint/55 hover:text-newsprint"
          >
            Cancel
          </a>
        ) : null}
      </div>
      {showDelete && deleteFormId ? (
        <button
          type="submit"
          form={deleteFormId}
          className="font-mono text-meta uppercase tracking-[0.25em] text-newsprint/55 hover:text-truth"
        >
          Delete
        </button>
      ) : null}
    </div>
  );
}

export function StudioHeader({
  kicker,
  title,
  rightCol,
}: {
  kicker: string;
  title: string;
  rightCol?: React.ReactNode;
}) {
  return (
    <header className="mb-10 flex items-end justify-between gap-6">
      <div>
        <p className="font-mono text-meta uppercase tracking-[0.3em] text-newsprint/55">
          {kicker}
        </p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-newsprint md:text-4xl">
          {title}
        </h1>
      </div>
      {rightCol}
    </header>
  );
}
