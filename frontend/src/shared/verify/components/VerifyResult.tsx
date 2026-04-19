import { type ReactNode } from 'react';

type VerifyResultProps = {
  variant: 'verified' | 'missing' | 'error' | 'verifying';
  title: string;
  children?: ReactNode;
  className?: string;
  leftClassName?: string;
  iconClassName?: string;
  spinnerClassName?: string;
  textClassName?: string;
  titleClassName?: string;
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
  children,
  className,
  leftClassName,
  iconClassName,
  spinnerClassName,
  textClassName,
  titleClassName,
  actionClassName,
}: VerifyResultProps) => (
  <div data-variant={variant} className={className}>
    <div className={leftClassName}>
      <div className={iconClassName}>
        {variant === 'verifying' ? <span className={spinnerClassName} /> : ICON_BY_VARIANT[variant]}
      </div>
      <div className={textClassName}>
        <span className={titleClassName}>{title}</span>
      </div>
    </div>
    {children && <div className={actionClassName}>{children}</div>}
  </div>
);
