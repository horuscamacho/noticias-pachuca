# ThemedText Accessibility Checklist

Comprehensive accessibility guidelines for the ThemedText component.

## Built-in Accessibility Features

### 1. Automatic Semantic Roles

ThemedText automatically assigns accessibility roles based on variant:

| Variant | Accessibility Role | Purpose |
|---------|-------------------|---------|
| `hero`, `h1`, `h2`, `h3`, `h4` | `header` | Announces as heading to screen readers |
| `link` | `link` | Announces as clickable link |
| `button` | `button` | Announces as pressable button |
| All others | `text` (default) | Standard text content |

### 2. Dynamic Type Support

- Component respects user's system font size settings
- Font sizes scale dynamically based on accessibility preferences
- Maximum scaling is capped at 1.5x to prevent layout breaks
- Uses `maxFontSizeMultiplier={1.5}` prop

### 3. Responsive Sizing

- Font sizes automatically scale from phone to tablet
- Ensures readability across all device sizes
- Line heights and letter spacing optimized for each variant

## Usage Guidelines

### Headings Hierarchy

Always use proper heading hierarchy for screen readers:

```tsx
// Correct - proper hierarchy
<ThemedText variant="h1">Article Title</ThemedText>
<ThemedText variant="h2">Section One</ThemedText>
<ThemedText variant="h3">Subsection A</ThemedText>

// Incorrect - skipping levels
<ThemedText variant="h1">Article Title</ThemedText>
<ThemedText variant="h3">Section One</ThemedText> // Skip h2
```

### Interactive Text

For pressable text, ensure proper labeling:

```tsx
// Good - descriptive label
<ThemedText
  variant="link"
  onPress={handleReadMore}
  accessibilityLabel="Read full article about climate change"
  accessibilityHint="Double tap to open article"
>
  Read more
</ThemedText>

// Avoid - vague label
<ThemedText variant="link" onPress={handleReadMore}>
  Click here
</ThemedText>
```

### Images and Icons

When using text with icons, combine accessibility labels:

```tsx
<Pressable
  accessibilityLabel="Share article on social media"
  accessibilityRole="button"
>
  <ThemedText variant="button">
    Share 🔗
  </ThemedText>
</Pressable>
```

### Error Messages

Make errors clear and actionable:

```tsx
// Good - clear error with action
<View>
  <ThemedText
    variant="error"
    accessibilityRole="alert"
    accessibilityLabel="Error: Failed to load article"
  >
    Failed to load article
  </ThemedText>
  <ThemedText
    variant="link"
    onPress={retry}
    accessibilityLabel="Retry loading article"
  >
    Try again
  </ThemedText>
</View>
```

### Lists and Truncation

When truncating text, provide full content to screen readers:

```tsx
<ThemedText
  variant="body"
  numberOfLines={2}
  accessibilityLabel={fullArticleText}
>
  {truncatedText}
</ThemedText>
```

## Color Contrast Guidelines

All ThemedText variants meet WCAG AA contrast requirements:

### Text Colors and Backgrounds

| Variant | Default Color | Min Contrast | WCAG Level |
|---------|--------------|--------------|------------|
| `hero`, `h1`, `h2`, `h3`, `h4` | #000000 | 21:1 | AAA |
| `body`, `bodyEmphasis` | #1F1F1F | 16:1 | AAA |
| `small`, `caption` | #4B5563 | 8:1 | AA |
| `error` | #FF0000 | 5.3:1 | AA Large Text |
| `link` | #854836 | 6.4:1 | AA |

### Custom Color Combinations

When overriding colors, verify contrast:

```tsx
// Use WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/

// Good - high contrast
<ThemedText variant="caption" className="bg-brutalist-brown text-white">
  POLITICS
</ThemedText>

// Check - verify contrast
<ThemedText variant="body" style={{ color: '#666666' }}>
  Custom gray text
</ThemedText>
```

## Testing Checklist

### Screen Reader Testing

- [ ] Test with VoiceOver (iOS) or TalkBack (Android)
- [ ] Verify heading hierarchy is announced correctly
- [ ] Confirm interactive elements are discoverable
- [ ] Check that labels are descriptive and clear
- [ ] Verify error messages are announced as alerts

### Visual Testing

- [ ] Test with system font size at minimum setting
- [ ] Test with system font size at maximum setting
- [ ] Verify text doesn't overflow containers at 1.5x scaling
- [ ] Check color contrast in light mode
- [ ] Check color contrast in dark mode (if supported)

### Keyboard Navigation

- [ ] Tab order is logical
- [ ] Interactive text is focusable
- [ ] Focus indicators are visible
- [ ] Links can be activated with Enter/Space

### Motion and Animation

- [ ] Respect `prefers-reduced-motion` for any animations
- [ ] Avoid auto-scrolling text
- [ ] Keep breaking news banners stable (no rapid flashing)

## Common Accessibility Patterns

### Article Header

```tsx
<View>
  <ThemedText
    variant="h1"
    accessibilityRole="header"
    accessibilityLabel="Article title"
  >
    {article.title}
  </ThemedText>

  <ThemedText
    variant="small"
    accessibilityLabel={`Published ${article.date} by ${article.author}`}
  >
    {article.date} • {article.author}
  </ThemedText>
</View>
```

### Breaking News Banner

```tsx
<View
  accessibilityRole="alert"
  accessibilityLive="assertive"
  className="bg-brutalist-red p-3"
>
  <ThemedText variant="breakingNewsBadge">
    BREAKING
  </ThemedText>
  <ThemedText
    variant="breakingNews"
    accessibilityLabel={`Breaking news: ${headline}`}
  >
    {headline}
  </ThemedText>
</View>
```

### Category Filter

```tsx
<Pressable
  accessibilityRole="button"
  accessibilityLabel={`Filter by ${category}`}
  accessibilityState={{ selected: isActive }}
>
  <ThemedText
    variant="caption"
    className={isActive ? 'bg-brutalist-brown text-white' : 'bg-white'}
  >
    {category}
  </ThemedText>
</Pressable>
```

### Quote with Attribution

```tsx
<View accessibilityRole="text">
  <ThemedText
    variant="quote"
    accessibilityLabel={`Quote from ${author}: ${quoteText}`}
  >
    {quoteText}
  </ThemedText>
  <ThemedText variant="small">
    — {author}
  </ThemedText>
</View>
```

## Platform-Specific Considerations

### iOS (VoiceOver)

- Uses `accessibilityLabel` for custom announcements
- Supports `accessibilityHint` for additional context
- `accessibilityRole` maps to UIAccessibility traits

### Android (TalkBack)

- Uses `accessibilityLabel` (contentDescription)
- `accessibilityRole` maps to class names
- Supports `accessibilityLiveRegion` for dynamic content

## Resources

- [React Native Accessibility Docs](https://reactnative.dev/docs/accessibility)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [iOS VoiceOver Testing Guide](https://developer.apple.com/accessibility/voiceover/)
- [Android TalkBack Testing Guide](https://support.google.com/accessibility/android/answer/6283677)

## Quick Reference

### Minimum Requirements

1. Use semantic variants (`h1-h4` for headings)
2. Provide `accessibilityLabel` for interactive elements
3. Verify color contrast (4.5:1 for normal, 3:1 for large text)
4. Test with screen readers
5. Support dynamic type scaling

### Best Practices

1. Keep labels concise but descriptive
2. Avoid "click here" or "learn more" without context
3. Use proper heading hierarchy
4. Announce errors as alerts
5. Group related text in accessible containers
6. Test with actual assistive technologies
