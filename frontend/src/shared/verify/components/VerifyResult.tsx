import { type ReactNode } from 'react';

type VerifyResultProps = {
  variant: 'verified' | 'missing' | 'error' | 'verifying';
  title: string;
  description: string;
  children?: ReactNode;
  className?: string;
  leftClassName?: string;
  iconClassName?: string;
  spinnerClassName?: string;
  textClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  actionClassName?: string;
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
  children,
  className,
  leftClassName,
  iconClassName,
  spinnerClassName,
  textClassName,
  titleClassName,
  descriptionClassName,
  actionClassName,
}: VerifyResultProps) => (
  <div data-variant={variant} className={className}>
    <div className={leftClassName}>
      <div className={iconClassName}>
        {variant === 'verifying' ? <span className={spinnerClassName} /> : ICON_BY_VARIANT[variant]}
      </div>
      <div className={textClassName}>
        <span className={titleClassName}>{title}</span>
        <p className={descriptionClassName}>{description}</p>
      </div>
    </div>
    {children && <div className={actionClassName}>{children}</div>}
  </div>
);
