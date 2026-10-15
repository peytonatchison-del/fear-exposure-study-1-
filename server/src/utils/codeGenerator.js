import crypto from 'node:crypto';

// Unambiguous alphabet: no 0/O, 1/I/L, to reduce transcription errors when a
// participant re-enters their code on a later session.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateStudyCode(length = 6) {
  let code = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i += 1) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  // Group as XXX-XXX for readability.
  return code.match(/.{1,3}/g).join('-');
}

export function generateUniqueStudyCode(db) {
  let code;
  let exists = true;
  let attempts = 0;
  while (exists && attempts < 25) {
    code = generateStudyCode();
    exists = !!db.prepare('SELECT id FROM participants WHERE study_code = ?').get(code);
    attempts += 1;
  }
  if (exists) throw new Error('Could not generate a unique study code, please retry.');
  return code;
}
