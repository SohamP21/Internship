/**
 * Full-viewport two-panel shell: left 40% (brand / context), right 60% (form + internal scroll).
 */
export default function FormLayout({
  leftTitle,
  leftSubtitle,
  leftContent,
  rightHeader,
  children,
  footer,
  mobileHeaderExtra,
  className = '',
}) {
  return (
    <div className={`form-shell ${className}`.trim()}>
      <aside className="form-shell__left" aria-hidden={false}>
        <div className="form-shell__left-inner">
          <div className="form-shell__logo" aria-hidden>
            Event<span>ify</span>
          </div>
          {mobileHeaderExtra ? (
            <div className="form-shell__mobile-extra">{mobileHeaderExtra}</div>
          ) : null}
          {leftTitle ? <h1 className="form-shell__left-title">{leftTitle}</h1> : null}
          {leftSubtitle ? <p className="form-shell__left-subtitle">{leftSubtitle}</p> : null}
          {leftContent ? <div className="form-shell__left-body">{leftContent}</div> : null}
        </div>
      </aside>

      <div className="form-shell__right">
        {rightHeader ? (
          <div className="form-shell__right-header">{rightHeader}</div>
        ) : null}
        <div className="form-shell__right-scroll">{children}</div>
        {footer ? <div className="form-shell__footer">{footer}</div> : null}
      </div>
    </div>
  );
}
