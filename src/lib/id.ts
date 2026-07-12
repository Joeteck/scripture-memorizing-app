// src/lib/id.ts
//
// Local-first records (verses, categories) are created entirely on-device
// now, with no server round trip to hand back a generated id — so this
// device has to make its own. Not a spec-compliant UUID, but unique
// enough for a local primary key: millisecond timestamp (sorts roughly
// chronologically, which is a nice side effect) plus a random suffix to
// cover multiple records created in the same millisecond.
export function generateId(): string {
  const time = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `${time}-${random}`;
}
