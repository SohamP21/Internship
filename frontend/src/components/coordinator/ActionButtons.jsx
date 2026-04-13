import { useEffect, useRef, useState } from 'react';

const ActionButtons = ({ secondaryActions, subtleActions }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClick = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClick);
    }

    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  const visibleSecondary = secondaryActions.slice(0, 3);
  const overflowSecondary = secondaryActions.slice(3);

  return (
    <div className="admin-event-card__footer">
      <div className="admin-event-card__subtle-row">
        {subtleActions.map((action) => (
          <button
            key={action.label}
            type="button"
            className="admin-btn admin-btn--subtle"
            onClick={action.onClick}
          >
            {action.label}
          </button>
        ))}
      </div>
      <div className="admin-event-card__ghost-row">
        {visibleSecondary.map((action) => (
          <button
            key={action.label}
            type="button"
            className="admin-btn admin-btn--ghost"
            onClick={action.onClick}
          >
            {action.label}
          </button>
        ))}
        {overflowSecondary.length > 0 && (
          <div className="admin-more-menu" ref={menuRef}>
            <button
              type="button"
              className="admin-btn admin-btn--ghost admin-btn--icon"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              ···
            </button>
            {menuOpen && (
              <div className="admin-more-menu__panel" role="menu">
                {overflowSecondary.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    role="menuitem"
                    className="admin-more-menu__item"
                    onClick={() => {
                      setMenuOpen(false);
                      action.onClick();
                    }}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActionButtons;
