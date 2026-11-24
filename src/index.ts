/*!
 * vary
 * Copyright(c) 2014-2017 Douglas Christopher Wilson
 * MIT Licensed
 */

// HTTP field names are tokens.
const FIELD_NAME_REGEXP = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;

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
  if (typeof header !== "string") {
    throw new TypeError("header argument is required");
  }

  if (!field) {
    throw new TypeError("field argument is required");
  }

  const fields = Array.isArray(field) ? field : parse(String(field));

  for (let i = 0; i < fields.length; i++) {
    if (!FIELD_NAME_REGEXP.test(fields[i])) {
      throw new TypeError("field argument contains an invalid header name");
    }
  }

  if (header === "*") {
    return header;
  }

  const values = parse(header.toLowerCase());

  if (fields.indexOf("*") !== -1 || values.indexOf("*") !== -1) {
    return "*";
  }

  let value = header;
  for (let i = 0; i < fields.length; i++) {
    const name = fields[i];
    const lower = name.toLowerCase();

    if (values.indexOf(lower) === -1) {
      values.push(lower);
      value = value ? value + ", " + name : name;
    }
  }

  return value;
}

/**
 * Parse a Vary header into an array.
 */
function parse(header: string): string[] {
  let start = 0;
  let end = 0;
  const list: string[] = [];

  for (let i = 0; i < header.length; i++) {
    switch (header.charCodeAt(i)) {
      case 0x09: // Horizontal tab
      case 0x20: // Space
        if (start === end) {
          start = end = i + 1;
        }
        break;
      case 0x2c: // Comma
        list.push(header.substring(start, end));
        start = end = i + 1;
        break;
      default:
        end = i + 1;
        break;
    }
  }

  list.push(header.substring(start, end));

  return list;
}

/**
 * Add one or more fields to a response's Vary header.
 */
export function vary(res: Response, field: string | readonly string[]): void {
  if (!res || !res.getHeader || !res.setHeader) {
    throw new TypeError("res argument is required");
  }

  const value = res.getHeader("Vary") || "";
  const header = Array.isArray(value) ? value.join(", ") : String(value);
  const updated = append(header, field);

  if (updated) {
    res.setHeader("Vary", updated);
  }
}

vary.append = append;

export default vary;
