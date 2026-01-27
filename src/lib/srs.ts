export type Rating = "again" | "hard" | "good" | "easy";

export interface SrsState {
  ease: number;
  intervalDays: number;
  dueAt: Date;
  correct: number;
  wrong: number;
}

export function calculateSrs(
  current: SrsState,
  rating: Rating
): SrsState {
  const now = new Date();
  let { ease, intervalDays, correct, wrong } = current;

  switch (rating) {
    case "again":
      intervalDays = 0;
      wrong += 1;
      ease = Math.max(1.3, ease - 0.2);
      break;
    case "hard":
      intervalDays = 1;
      correct += 1;
      ease = Math.max(1.3, ease - 0.1);
      break;
    case "good":
      intervalDays = 3;
      correct += 1;
      break;
    case "easy":
      intervalDays = Math.max(1, Math.round(intervalDays * ease));
      correct += 1;
      ease += 0.1;
      break;
  }

  const dueAt = new Date(now);
  dueAt.setDate(dueAt.getDate() + (rating === "again" ? 1 : intervalDays));

  return { ease, intervalDays, dueAt, correct, wrong };
}
