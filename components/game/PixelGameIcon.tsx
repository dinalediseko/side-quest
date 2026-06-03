import {
  Bird,
  Blocks,
  Boxes,
  CircleDot,
  Grid3x3,
  Worm,
} from "lucide-react";

import { GameIcon } from "@/types/game";

export default function PixelGameIcon({ icon }: { icon: GameIcon }) {
  const className = "h-12 w-12 stroke-[3] text-current";

  if (icon === "bird") {
    return <Bird className={className} />;
  }

  if (icon === "blocks") {
    return <Blocks className={className} />;
  }

  if (icon === "boxes") {
    return <Boxes className={className} />;
  }

  if (icon === "worm") {
    return <Worm className={className} />;
  }

  if (icon === "circle-dot") {
    return <CircleDot className={className} />;
  }

  return <Grid3x3 className={className} />;
}