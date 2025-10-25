# Zustand Quick Reference - 2025

## Installation

```bash
npm install zustand@5.0.8
npm install immer                                    # Optional: mutable updates
npm install --save-dev @redux-devtools/extension    # Optional: DevTools
npx expo install @react-native-async-storage/async-storage  # For persistence
```

---

## Basic Store

```typescript
import { create } from 'zustand';

interface Store {
  count: number;
  increase: () => void;
}

const useStore = create<Store>()((set) => ({
  count: 0,
  increase: () => set((state) => ({ count: state.count + 1 })),
}));
```

---

## Using in Components

```typescript
// Select single value
const count = useStore((state) => state.count);

// Select action
const increase = useStore((state) => state.increase);

// Select multiple with useShallow
import { useShallow } from 'zustand/react/shallow';

const { count, increase } = useStore(
  useShallow((state) => ({
    count: state.count,
    increase: state.increase,
  }))
);
```

---

## With Persistence (AsyncStorage)

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useStore = create<Store>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

---

## With Immer (Mutable Updates)

```typescript
import { immer } from 'zustand/middleware/immer';

const useStore = create<Store>()(
  immer((set) => ({
    todos: [],
    addTodo: (todo) =>
      set((state) => {
        state.todos.push(todo); // Direct mutation!
      }),
  }))
);
```

---

## With DevTools

```typescript
import { devtools } from 'zustand/middleware';

const useStore = create<Store>()(
  devtools(
    (set) => ({
      count: 0,
      increase: () => set((state) => ({ count: state.count + 1 }), false, 'count/increase'),
    }),
    { name: 'CounterStore' }
  )
);
```

---

## Complete Stack (DevTools + Persist + Immer)

```typescript
import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useStore = create<Store>()(
  devtools(
    persist(
      immer((set) => ({
        count: 0,
        increase: () =>
          set(
            (state) => {
              state.count += 1;
            },
            false,
            'count/increase'
          ),
      })),
      {
        name: 'store-storage',
        storage: createJSONStorage(() => AsyncStorage),
      }
    ),
    { name: 'MyStore' }
  )
);
```

**Order matters!** Always: `devtools(persist(immer(...)))`

---

## Slice Pattern

```typescript
import { create, StateCreator } from 'zustand';

// Define slices
interface CounterSlice {
  count: number;
  increase: () => void;
}

interface UserSlice {
  user: User | null;
  setUser: (user: User) => void;
}

// Create slices
const createCounterSlice: StateCreator<
  CounterSlice & UserSlice,
  [],
  [],
  CounterSlice
> = (set) => ({
  count: 0,
  increase: () => set((state) => ({ count: state.count + 1 })),
});

const createUserSlice: StateCreator<CounterSlice & UserSlice, [], [], UserSlice> = (
  set
) => ({
  user: null,
  setUser: (user) => set({ user }),
});

// Combine
type AppStore = CounterSlice & UserSlice;

const useAppStore = create<AppStore>()((...a) => ({
  ...createCounterSlice(...a),
  ...createUserSlice(...a),
}));
```

---

## Async Actions

```typescript
interface Store {
  users: User[];
  isLoading: boolean;
  fetchUsers: () => Promise<void>;
}

const useStore = create<Store>()((set) => ({
  users: [],
  isLoading: false,
  fetchUsers: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/users');
      const users = await response.json();
      set({ users, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
    }
  },
}));
```

---

## Computed Values

```typescript
// In component
const hasActiveFilters = useStore((state) => {
  return !!(state.filters.search || state.filters.category);
});

// Or use useMemo
const sortedItems = useMemo(() => {
  return items.sort((a, b) => a.date - b.date);
}, [items]);
```

---

## Transient Updates (No Re-renders)

```typescript
// Subscribe to changes without re-rendering
useEffect(() => {
  const unsubscribe = useStore.subscribe(
    (state) => state.scrollOffset,
    (offset) => {
      // Handle scroll without re-render
      console.log('Scroll offset:', offset);
    }
  );

  return unsubscribe;
}, []);
```

---

## Access Store Outside Components

```typescript
// Direct access
const currentCount = useStore.getState().count;

// Update directly
useStore.setState({ count: 5 });

// Subscribe
const unsubscribe = useStore.subscribe((state) => {
  console.log('Count changed:', state.count);
});
```

---

## Reset Store

```typescript
interface Store {
  count: number;
  user: User | null;
  reset: () => void;
}

const initialState = {
  count: 0,
  user: null,
};

const useStore = create<Store>()((set) => ({
  ...initialState,
  reset: () => set(initialState),
}));
```

---

## Partial Persistence

```typescript
persist(
  (set) => ({ /* store */ }),
  {
    name: 'my-store',
    partialize: (state) => ({
      // Only persist these fields
      user: state.user,
      theme: state.theme,
      // Exclude: isLoading, tempData, etc.
    }),
  }
)
```

---

## Check Hydration Status

```typescript
function MyComponent() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const unsubscribe = useStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });
    return unsubscribe;
  }, []);

  if (!isHydrated) return <Loading />;

  return <div>Hydrated!</div>;
}
```

---

## Performance Tips

### 1. Select Primitives Directly

```typescript
// ✅ GOOD
const count = useStore((state) => state.count);

// ❌ BAD
const data = useStore((state) => ({ count: state.count }));
```

### 2. Use useShallow for Objects

```typescript
import { useShallow } from 'zustand/react/shallow';

const { name, age } = useStore(
  useShallow((state) => ({
    name: state.name,
    age: state.age,
  }))
);
```

### 3. Memoize Derived Values

```typescript
const filteredData = useMemo(() => {
  return data.filter((item) => item.active);
}, [data]);
```

### 4. Throttle High-Frequency Updates

```typescript
<FlatList
  onScroll={handleScroll}
  scrollEventThrottle={100} // Update every 100ms max
/>
```

---

## Common Mistakes

| Mistake                                         | Fix                                             |
| ----------------------------------------------- | ----------------------------------------------- |
| Creating objects in selectors                   | Use `useShallow` or multiple selectors          |
| Storing everything globally                     | Use local state for UI-only concerns            |
| Not initializing tabs/slices                    | Initialize on mount or use getters with defaults |
| Persisting non-serializable data                | Only persist primitives, objects, arrays        |
| Not handling async hydration                    | Check hydration status before using data        |
| Applying middleware inside slices               | Only apply at store level                       |
| Using `create<T>(...)` instead of `create<T>()()` | Use curried syntax for TypeScript              |

---

## Debugging Checklist

- [ ] Check Redux DevTools for state changes
- [ ] Verify selectors with `console.log`
- [ ] Check React DevTools Profiler for re-renders
- [ ] Ensure middleware order: `devtools(persist(immer(...)))`
- [ ] Verify AsyncStorage for persistence issues
- [ ] Check hydration status for persisted stores

---

## When to Use

| Use Zustand                   | Use Local State (useState)   |
| ----------------------------- | ---------------------------- |
| Shared across components      | Single component only        |
| Needs persistence             | Temporary UI state           |
| Complex state logic           | Simple toggle/input state    |
| Need DevTools debugging       | Form inputs (use form lib)   |
| Global theme/settings         | Modal open/close             |
| User authentication           | Dropdown open/close          |
| Tab/navigation state          | Temporary loading states     |

---

## TypeScript Types

```typescript
import { create, StateCreator } from 'zustand';
import type { } from '@redux-devtools/extension'; // For devtools typing

// Basic
interface Store {
  count: number;
  increase: () => void;
}

// With StateCreator
const storeCreator: StateCreator<Store> = (set) => ({
  count: 0,
  increase: () => set((state) => ({ count: state.count + 1 })),
});

// With middleware
const storeCreator: StateCreator<
  Store,
  [['zustand/devtools', never], ['zustand/persist', unknown]],
  [],
  Store
> = (set) => ({ /* ... */ });
```

---

## Resources

- **Docs**: https://zustand.docs.pmnd.rs
- **GitHub**: https://github.com/pmndrs/zustand
- **TypeScript Guide**: https://zustand.docs.pmnd.rs/guides/typescript
- **Discussions**: https://github.com/pmndrs/zustand/discussions

---

**Version**: Zustand v5.0.8 (2025)
