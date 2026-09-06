import type { ReactNode } from 'react';

type SectionCardProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
};

export function SectionCard({ eyebrow, title, description, actions, children, className, id }: SectionCardProps) {
  const sectionClassName = ['section-card', className].filter(Boolean).join(' ');

  return (
    <section className={sectionClassName} id={id}>
      <div className="section-card__header">
        <div className="section-card__heading">
          {eyebrow ? <p className="section-card__eyebrow">{eyebrow}</p> : null}
          <h2 className="section-card__title">{title}</h2>
          {description ? <p className="section-card__description">{description}</p> : null}
        </div>
        {actions ? <div className="section-card__actions">{actions}</div> : null}
      </div>
      <div className="section-card__body">{children}</div>
    </section>
  );
}
