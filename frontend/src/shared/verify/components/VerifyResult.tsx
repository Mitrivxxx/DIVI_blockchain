type VerifyResultProps = {
  variant: 'verified' | 'missing' | 'error' | 'verifying';
  title: string;
  description: string;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
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
  titleClassName,
  descriptionClassName,
}: VerifyResultProps) => (
  <div className={className} data-variant={variant}>
    <div className={titleClassName}>
      <span aria-hidden="true">{ICON_BY_VARIANT[variant]}</span>
      <span>{title}</span>
    </div>
    <p className={descriptionClassName}>{description}</p>
  </div>
);
