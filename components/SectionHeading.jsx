export default function SectionHeading({ icon: Icon, title, children, actions }) {
  return (
    <header className="section-heading">
      {Icon && (
        <span className="section-heading__icon" aria-hidden="true">
          <Icon size={22} />
        </span>
      )}
      <div className="section-heading__text">
        <h1 id="page-title" tabIndex={-1}>
          {title}
        </h1>
        {children && <p>{children}</p>}
      </div>
      {actions && <div className="section-heading__actions">{actions}</div>}
    </header>
  );
}
