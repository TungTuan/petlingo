export type PetEvolutionStage = "egg" | "mini" | "medium" | "large";
export type PetMood = "happy" | "sad";

export function getPetEvolutionStage(level: number): PetEvolutionStage {
  if (level <= 1) return "egg";
  if (level < 10) return "mini";
  if (level < 20) return "medium";
  return "large";
}

export function getPetMood(hunger: number): PetMood {
  return hunger <= 30 ? "sad" : "happy";
}
