import { type ReactNode } from 'react';

type VerifyResultProps = {
  variant: 'verified' | 'missing' | 'error' | 'verifying';
  title: string;
  description: string;
  className?: string;
  contentClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  actionsClassName?: string;
  children?: ReactNode;
};

const ICON_BY_VARIANT: Record<VerifyResultProps['variant'], string> = {
  verified: '✓',
  missing: '?',
  error: '×',
  verifying: '…',
};

export const VerifyResult = ({
  variant,
  title,
  description,
  className,
  contentClassName,
  titleClassName,
  descriptionClassName,
  actionsClassName,
  children,
}: VerifyResultProps) => (
  <div className={className} data-variant={variant}>
    <div className={contentClassName}>
      <div className={titleClassName}>
        <span aria-hidden="true">{ICON_BY_VARIANT[variant]}</span>
        <span>{title}</span>
      </div>
      <p className={descriptionClassName}>{description}</p>
    </div>
    {children && <div className={actionsClassName}>{children}</div>}
  </div>
);
