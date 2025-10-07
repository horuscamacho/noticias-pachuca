import { cssInterop } from 'nativewind';
import * as LucideIcon from 'lucide-react-native';

export type IconName = keyof typeof LucideIcon;

export function iconWithClassName(icon: LucideIcon.LucideIcon) {
  cssInterop(icon, {
    className: {
      target: 'style',
      nativeStyleToProp: {
        color: true,
        opacity: true,
      },
    },
  });
}

iconWithClassName(LucideIcon.Check);

export { LucideIcon };
