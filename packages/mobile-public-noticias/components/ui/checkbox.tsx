import * as React from 'react';
import { Pressable, View } from 'react-native';
import * as CheckboxPrimitive from '@rn-primitives/checkbox';
import { LucideIcon } from '@/lib/icons/icon';
import { cn } from '@/lib/utils';

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        'native:size-[20] web:peer web:size-4 web:shrink-0 border-primary web:ring-offset-background web:focus-visible:outline-none web:focus-visible:ring-2 web:focus-visible:ring-ring web:focus-visible:ring-offset-2 data-[disabled=true]:web:cursor-not-allowed data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[disabled=true]:opacity-50 size-4 shrink-0 justify-center items-center rounded-sm border',
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className={cn('items-center justify-center h-full w-full')}>
        <LucideIcon.Check size={12} className='text-primary-foreground' />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
