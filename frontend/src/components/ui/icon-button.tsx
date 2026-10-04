import type { ReactNode } from 'react';
import { Button, type ButtonProps } from './button.tsx';

type IconButtonProps = Omit<ButtonProps, 'size' | 'fullWidth' | 'children' | 'aria-label'> & {
  label: string; // required: an icon alone has no accessible name
  children: ReactNode;
};

export function IconButton({ label, variant = 'outline', children, ...props }: IconButtonProps) {
  return (
    <Button size="icon" variant={variant} aria-label={label} {...props}>
      {children}
    </Button>
  );
}
