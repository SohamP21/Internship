import Button from './Button';

export default function HeroBanner({ greeting, subtitle, ctaLabel, ctaAction, ctaTo }) {
  return (
    <section className="ui-hero">
      <div className="ui-hero__grain" aria-hidden />
      <div className="ui-hero__inner">
        <h1 className="ui-hero__greeting">{greeting}</h1>
        {subtitle ? <p className="ui-hero__subtitle">{subtitle}</p> : null}
        {ctaLabel ? (
          ctaTo ? (
            <Button to={ctaTo} variant="inverse" size="md">
              {ctaLabel}
            </Button>
          ) : (
            <Button type="button" variant="inverse" size="md" onClick={ctaAction}>
              {ctaLabel}
            </Button>
          )
        ) : null}
      </div>
    </section>
  );
}
