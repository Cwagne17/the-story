export function AtlasIntro({ visible }: { visible: boolean }) {
  return (
    <div
      className={`atlas-intro ${visible ? "is-visible" : ""}`}
      aria-hidden={!visible}
    >
      <div className="atlas-intro__content">
        <div className="eyebrow">The Story</div>
        <h1>
          Explore the World
          <br />
          of Scripture
        </h1>
        <p>
          66 books. Thousands of years.
          <br />
          One unfolding story.
        </p>
        <div className="atlas-intro__prompt">Explore the map to begin</div>
      </div>
    </div>
  );
}
