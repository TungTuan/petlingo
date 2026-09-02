import { useEffect, useMemo, useState } from "react";
import { getPetEvolutionStage, type PetMood } from "../lib/petEvolution";
import { FLYING_PET_IDS, PETS, PET_CUTE_MOTION } from "./ui/tokens";

const ANIMATED_MAX_PET_IDS = new Set([
  "angel", "aqua", "bamboo", "berry", "biscuit", "blaze", "buddy", "coco", "cocoa", "ducky",
  "ellie", "frostwing", "frosty", "gargo", "glacio", "kiwi", "leo", "lila", "milky", "mimi",
  "misty", "mystic", "nimbus", "nocty", "papillon", "pepper", "poppy", "prism", "rosie", "sia",
  "smokey", "snowy", "sprout", "stella", "stripe", "sunny", "umbra", "void", "waffle",
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
  const hasSelfMotionMedia = mediaAnimated && isMaxLevel && ANIMATED_MAX_PET_IDS.has(petId);
  const shouldFly = animated && motion && isMaxLevel && isFlying && !hasSelfMotionMedia;
  const cuteMotion = animated && motion && isMaxLevel && !isFlying && petId !== "buddy" && !hasSelfMotionMedia ? PET_CUTE_MOTION[petId] ?? "tilt" : null;
  const stage = level === undefined ? null : getPetEvolutionStage(level);
  const preferred = useMemo(() => {
    if (stage === "egg") return `/pets/eggs/${rarity.toLowerCase()}.png`;
    if (petId === "buddy" && stage === "medium") return `/pets/evolution/buddy-medium-${mood}.png`;
    if (mediaAnimated && petId === "buddy" && level !== undefined && level >= 30) {
      return "/pets/animation/buddy-cute-max-v1.webp";
    }
    // Ember's wing flap is baked into the webp itself (loops on its own,
    // same asset Flappy Dragon uses) — no level gate needed, it can just
    // stand there and flap naturally at any level/stage past the egg.
    if (mediaAnimated && petId === "ember") {
      return "/pets/animation/ember-wing-flap-v6.webp";
    }
    if (mediaAnimated && level !== undefined && level >= 30 && ANIMATED_MAX_PET_IDS.has(petId)) {
      return `/pets/animation/${petId}-max-v1.webp`;
    }
    // Chỉ 24/40 pet có sẵn ảnh buồn riêng (frontend/public/pets/sad/) — pet
    // còn thiếu sẽ tự rơi về ảnh vui bình thường qua onError bên dưới (fallback
    // vốn đã trỏ đúng `/pets/${petId}.png`), không cần danh sách kiểm tra ở đây.
    if (mood === "sad") return `/pets/sad/${petId}.png`;
    return `/pets/${petId}.png`;
  }, [level, mediaAnimated, mood, petId, rarity, stage]);
  const fallback = `/pets/${petId}.png`;
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
      className={`${animated && motion && !isMaxLevel ? "animate-pet-idle" : ""} ${stage ? `pet-stage-${stage}` : ""} ${shouldFly ? "pet-max-aura pet-fly-drift" : ""} ${cuteMotion ? `pet-max-aura pet-cute-${cuteMotion}` : ""} ${isMaxLevel ? `${shouldFly || cuteMotion ? "" : "pet-max-glow-static"} pet-aura-${rarity.toLowerCase()}` : ""} select-none object-contain ${className}`}
    />
  );
}
