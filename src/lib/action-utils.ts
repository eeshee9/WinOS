/**
 * Extracts and trims a string field from FormData.
 * Returns "" when the field is absent or blank.
 */
export function getStr(formData: FormData, name: string): string {
  return (formData.get(name) as string | null)?.trim() ?? "";
}

/**
 * Validates a text field and returns a single-item error array, or undefined
 * when the value is valid.  The return type matches the `field?: string[]`
 * shape used in every action's error state.
 *
 * @param label   Human-readable field name used in error messages.
 * @param value   Already-trimmed value to validate.
 * @param max     Optional maximum character length.
 * @param optional  When true, an empty value is allowed.
 */
export function validateText(
  label: string,
  value: string,
  max?: number,
  { optional = false }: { optional?: boolean } = {}
): string[] | undefined {
  if (!optional && !value) return [`${label} is required`];
  if (max !== undefined && value.length > max) {
    return [`${label} must be ${max} characters or fewer`];
  }
  return undefined;
}
