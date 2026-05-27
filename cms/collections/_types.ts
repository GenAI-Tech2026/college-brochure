/**
 * Minimal local stand-ins for Payload's types, so these files type-check
 * BEFORE `payload` is installed. When the real package lands, replace
 * with `import type { CollectionConfig } from 'payload'`.
 */
export interface FieldBase {
  name: string;
  required?: boolean;
  unique?: boolean;
  index?: boolean;
  defaultValue?: unknown;
  min?: number;
  max?: number;
  options?: string[];
  hasMany?: boolean;
  relationTo?: string;
  fields?: FieldBase[];
  validate?: (v: unknown) => true | string;
  type:
    | "text" | "textarea" | "number" | "select" | "checkbox"
    | "date" | "array" | "group" | "relationship" | "richText";
}

export interface CollectionConfig {
  slug: string;
  admin?: { useAsTitle?: string; defaultColumns?: string[] };
  fields: FieldBase[];
  access?: Record<string, unknown>;
  hooks?: Record<string, unknown>;
}
