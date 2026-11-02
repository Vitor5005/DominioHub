import logoMark from '../../assets/brand/logo-mark.svg';

interface BrandProps {
  tone?: 'dark' | 'light';
}

export function Brand({
  tone = 'dark',
}: BrandProps) {
  return (
    <div
      className={`brand brand--${tone}`}
      aria-label="DomínioHub"
    >
      <img
        className="brand__mark"
        src={logoMark}
        alt=""
        aria-hidden="true"
      />

      <span className="brand__name">
        DomínioHub
      </span>
    </div>
  );
}
