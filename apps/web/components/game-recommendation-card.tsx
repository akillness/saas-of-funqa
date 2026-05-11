type GameRecommendationCardProps = {
  title: string;
  category: "games" | "movies" | "videos";
  aiScore: number;
  description?: string;
};

const CATEGORY_META: Record<
  GameRecommendationCardProps["category"],
  { label: string; dotColor: string; gradient: string }
> = {
  games: {
    label: "Games",
    dotColor: "var(--gm-accent-games)",
    gradient: "var(--gm-gradient-games)",
  },
  movies: {
    label: "Movies",
    dotColor: "var(--gm-accent-movies)",
    gradient: "var(--gm-gradient-movies)",
  },
  videos: {
    label: "Videos",
    dotColor: "var(--gm-accent-videos)",
    gradient: "var(--gm-gradient-videos)",
  },
};

export function GameRecommendationCard({
  title,
  category,
  aiScore,
  description,
}: GameRecommendationCardProps) {
  const meta = CATEGORY_META[category];
  const clampedScore = Math.min(100, Math.max(0, Math.round(aiScore)));

  return (
    <article className="grc-card" aria-label={title}>
      <div className="grc-gradient-cap" style={{ background: meta.gradient }} aria-hidden="true">
        <span className="grc-ai-badge">AI {clampedScore}%</span>
      </div>
      <div className="grc-body">
        <div className="grc-category">
          <span
            className="grc-category-dot"
            style={{ background: meta.dotColor }}
            aria-hidden="true"
          />
          <span className="grc-category-label">{meta.label}</span>
        </div>
        <h3 className="grc-title">{title}</h3>
        {description && <p className="grc-description">{description}</p>}
      </div>
    </article>
  );
}
