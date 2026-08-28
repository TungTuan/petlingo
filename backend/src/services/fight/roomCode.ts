import { randomInt } from "node:crypto";

// Excludes visually-confusable characters (0/O, 1/I/L) — this code gets
// read off one kid's screen and typed into another's, so every character
// has to be unmistakable at a glance.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;

export function generateRoomCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET[randomInt(ALPHABET.length)];
  }
  return code;
}
