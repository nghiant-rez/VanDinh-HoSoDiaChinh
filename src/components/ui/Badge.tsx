interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'insert' | 'update' | 'export' | 'default';
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  const variants = {
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    danger: 'bg-danger/10 text-danger border-danger/20',
    info: 'bg-primary/10 text-primary border-primary/20',
    insert: 'bg-badge-insert/10 text-badge-insert border-badge-insert/20',
    update: 'bg-badge-update/10 text-badge-update border-badge-update/20',
    export: 'bg-badge-export/10 text-badge-export border-badge-export/20',
    default: 'bg-bg-main text-text-secondary border-border',
  };

  return (
    <span className={`px-2.5 py-1 text-xs font-medium border rounded-full ${variants[variant]}`}>
      {children}
    </span>
  );
}
