/*!
 * vary
 * Copyright(c) 2014-2017 Douglas Christopher Wilson
 * MIT Licensed
 */

// HTTP field names are tokens.
const INVALID_FIELD_NAME = /^$|[^!#$%&'*+\-.^_`|~0-9A-Za-z]/;

/**
 * A response with methods for reading and setting headers.
 */
export interface Response {
  getHeader(name: string): string | number | readonly string[] | undefined;
  setHeader(name: string, value: string): unknown;
}

/**
 * Append one or more fields to a Vary header.
 */
export function append(
  header: string,
  field: string | readonly string[],
): string {
  const values = parse(header.toLowerCase());
  const fields = Array.isArray(field) ? field : parse(String(field));
  let wildcard = values.includes("*");
  let result = header;

  for (const name of fields) {
    if (INVALID_FIELD_NAME.test(name)) invalidFieldName(name);

    const lower = name.toLowerCase();
    if (lower === "*") wildcard = true;
    if (!values.includes(lower)) {
      values.push(lower);
      result = result ? result + ", " + name : name;
    }
  }

  return wildcard ? "*" : result;
}

/**
 * Format field names as a Vary header.
 */
export function format(fields: readonly string[]): string {
  if (fields.length === 0) return "";

  const first = fields[0];
  if (INVALID_FIELD_NAME.test(first)) invalidFieldName(first);
  let result = first;

  for (let i = 1; i < fields.length; i++) {
    const name = fields[i];
    if (INVALID_FIELD_NAME.test(name)) invalidFieldName(name);
    result = result + ", " + name;
  }

  return result;
}

function invalidFieldName(name: string): never {
  throw new TypeError(`Vary field contains invalid characters: ${name}`);
}

/**
 * Parse the non-empty members of a Vary header.
 */
export function parse(header: string): string[] {
  const list: string[] = [];
  const length = header.length;
  let start = 0;

  while (start < length) {
    // Trim spaces and horizontal tabs at the member's edges.
    do {
      const code = header.charCodeAt(start);
      if (code !== 0x20 && code !== 0x09) break;
      start++;
    } while (start < length);

    const comma = header.indexOf(",", start);
    let end = comma === -1 ? length : comma;
    while (end > start) {
      const code = header.charCodeAt(end - 1);
      if (code !== 0x20 && code !== 0x09) break;
      end--;
    }

    if (start < end) list.push(header.slice(start, end));
    start = end + 1;
  }

  return list;
}

/**
 * Add one or more fields to a response's Vary header.
 */
export function vary(res: Response, field: string | readonly string[]): void {
  const value = res.getHeader("Vary") ?? "";
  const header = Array.isArray(value) ? value.join(", ") : String(value);

  const updated = append(header, field);
  if (updated) res.setHeader("Vary", updated);
}
