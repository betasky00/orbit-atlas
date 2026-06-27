// ---------------------------------------------------------------------------
// Reel blueprint model
//
// We take a reel/video the user likes, sample frames across its timeline, and
// have GPT-4o Vision reverse-engineer the EDIT into a structured blueprint:
// the shot list, cut timings, on-screen text, transitions, pacing and music
// vibe. The user then swaps their own footage into each shot "slot" to
// recreate the same edit with their content.
// ---------------------------------------------------------------------------

export type ShotKind = "clip" | "image" | "text-card";
export type Transition =
  | "cut"
  | "fade"
  | "dissolve"
  | "slide"
  | "zoom-in"
  | "zoom-out"
  | "whip-pan"
  | "match-cut"
  | "flash";

export type TextPosition = "top" | "center" | "bottom";

export interface ReelShot {
  index: number;
  start: number; // seconds
  end: number; // seconds
  duration: number; // seconds
  kind: ShotKind;
  description: string; // what's happening / what to film
  onScreenText?: string | null;
  textPosition?: TextPosition;
  transitionIn?: Transition;
  transitionOut?: Transition;
  cameraMove?: string; // e.g. "handheld push-in", "static"
  replaceable: boolean;
  // filled in by the user when recreating:
  userMedia?: string; // data URL of their clip/image
  userMediaType?: "image" | "video";
}

export interface ReelBlueprint {
  sourceName?: string;
  totalDuration: number;
  aspectRatio: string; // "9:16"
  pacing: "fast" | "medium" | "slow";
  musicVibe: string; // inferred mood / genre / energy
  bpmGuess?: number | null;
  hook: string; // what makes the first ~3s grab attention
  shots: ReelShot[];
  caption?: string;
  hashtags?: string[];
  editingNotes?: string[]; // actionable tips to match the edit
}

export interface SavedReel extends ReelBlueprint {
  id: string;
  name: string;
  createdAt: number;
}
