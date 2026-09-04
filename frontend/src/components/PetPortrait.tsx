import { useEffect, useMemo, useState } from "react";
import { getPetEvolutionStage, type PetMood } from "../lib/petEvolution";
import { FLYING_PET_IDS, PETS, PET_CUTE_MOTION } from "./ui/tokens";

const ANIMATED_MAX_PET_IDS = new Set([
  "angel", "aqua", "bamboo", "berry", "biscuit", "blaze", "buddy", "coco", "cocoa", "ducky",
  "ellie", "frostwing", "frosty", "gargo", "glacio", "kiwi", "leo", "lila", "milky", "mimi",
  "misty", "mystic", "nimbus", "nocty", "papillon", "pepper", "poppy", "prism", "rosie", "sia",
  "smokey", "snowy", "sprout", "stella", "stripe", "sunny", "umbra", "void", "waffle",
  "haetae",
]);

interface PetPortraitProps {
  petId: string;
  name: string;
  className?: string;
  animated?: boolean;
  motion?: boolean;
  mediaAnimated?: boolean;
  level?: number;
  mood?: PetMood;
}

export default function PetPortrait({ petId, name, className = "", animated = false, motion = true, mediaAnimated = true, level, mood = "happy" }: PetPortraitProps) {
  const rarity = PETS.find((pet) => pet.id === petId)?.rarity ?? "Common";
  const isMaxLevel = level !== undefined && level >= 30;
  const isFlying = FLYING_PET_IDS.has(petId);
  const hasSelfMotionMedia = mood !== "sad" && mediaAnimated && isMaxLevel && ANIMATED_MAX_PET_IDS.has(petId);
  // Animated WebP only animates the pet itself (for example Ember's wing
  // flap). It must not disable the container's gentle flight path; otherwise
  // the dragon flaps its wings while remaining pinned to the ground on Home.
  const shouldFly = mood !== "sad" && animated && motion && isMaxLevel && isFlying;
  const cuteMotion = mood !== "sad" && animated && motion && isMaxLevel && !isFlying && petId !== "buddy" && !hasSelfMotionMedia ? PET_CUTE_MOTION[petId] ?? "tilt" : null;
  const stage = level === undefined ? null : getPetEvolutionStage(level);
  const preferred = useMemo(() => {
    if (stage === "egg") return `/pets/eggs/${rarity.toLowerCase()}.webp`;
    if (petId === "buddy" && stage === "medium") return `/pets/evolution/buddy-medium-${mood}.webp`;
    // Ember's wing motion is baked into its WebP. Keep that motion while
    // hungry and let the `pet-mood-sad` CSS supply the tired posture/filter;
    // swapping to the static sad PNG made its wings freeze completely.
    if (mediaAnimated && petId === "ember") return "/pets/animation/ember-wing-flap-v6.webp";
    // Other pets still prefer their dedicated sad artwork while hungry.
    if (mood === "sad") return `/pets/sad/${petId}.webp`;
    if (mediaAnimated && petId === "buddy" && level !== undefined && level >= 30) {
      return "/pets/animation/buddy-cute-max-v1.webp";
    }
    if (mediaAnimated && level !== undefined && level >= 30 && ANIMATED_MAX_PET_IDS.has(petId)) {
      return `/pets/animation/${petId}-max-v1.webp`;
    }
    // Every catalog pet has a dedicated transparent sad sprite. Keep onError
    // as a defensive fallback for malformed API data or a missing future asset.
    return `/pets/${petId}.webp`;
  }, [level, mediaAnimated, mood, petId, rarity, stage]);
  const fallback = `/pets/${petId}.webp`;
  const [src, setSrc] = useState(preferred);

  useEffect(() => setSrc(preferred), [preferred]);

  return (
    <img
      src={src}
      alt={name}
      draggable={false}
      onError={() => {
        if (src !== fallback) setSrc(fallback);
      }}
      className={`${animated && motion && !isMaxLevel ? "animate-pet-idle" : ""} ${mood === "sad" && stage !== "egg" ? "pet-mood-sad" : ""} ${stage ? `pet-stage-${stage}` : ""} ${shouldFly ? "pet-max-aura pet-fly-drift" : ""} ${cuteMotion ? `pet-max-aura pet-cute-${cuteMotion}` : ""} ${isMaxLevel ? `${shouldFly || cuteMotion ? "" : "pet-max-glow-static"} pet-aura-${rarity.toLowerCase()}` : ""} select-none object-contain ${className}`}
    />
  );
}
