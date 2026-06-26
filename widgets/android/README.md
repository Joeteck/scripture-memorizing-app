# Phase 2 — Android home/lock-screen widget

This is the part that genuinely needs a native build step, so it's scoped
separately from the MVP rather than faked. It's the more realistic of the
two native-widget paths (no Mac required), using
`react-native-android-widget`, which lets you define the widget's layout
in JSX and compiles it into a real Android App Widget.

## Why this can't ship in today's zip

Expo Go (the app you use for `npx expo start`) can only run pure-JS apps.
A home/lock-screen widget is a separate native Android component
(`AppWidgetProvider`) that has to be compiled into the app binary. That
means you need:

1. `npx expo install react-native-android-widget`
2. A **Dev Client** build instead of Expo Go: `npx expo prebuild` then
   `eas build --profile development --platform android` (or a local
   `./gradlew` build if you have Android Studio installed)
3. The widget's own small layout + task handler, registered via an Expo
   config plugin

## Outline for when you're ready to build this

```
widgets/android/
  VerseWidget.tsx        # JSX layout for the widget face (one verse + ref)
  widget-task-handler.ts # runs on an interval, picks the "next" verse,
                          # updates the widget via requestWidgetUpdate()
```

`VerseWidget.tsx` would render something like:

```tsx
import { FlexWidget, TextWidget } from "react-native-android-widget";

export function VerseWidget({ reference, content }: { reference: string; content: string }) {
  return (
    <FlexWidget style={{ height: "match_parent", width: "match_parent", padding: 16, backgroundColor: "#FBF8F2" }}>
      <TextWidget text={reference} style={{ fontSize: 14, color: "#3D4B8C", fontWeight: "600" }} />
      <TextWidget text={content} style={{ fontSize: 16, color: "#14171F", marginTop: 6 }} />
    </FlexWidget>
  );
}
```

`widget-task-handler.ts` would pull the next verse from the same
`verses_cache` SQLite table the app already writes to (see `src/lib/db.ts`)
so the widget shows real data without a network call, and call
`requestWidgetUpdate()` on the interval the user picked when adding the
verse.

Wiring this in fully is a half-day-ish task once you have a Dev Client
build working — happy to do it together when you're at that point.
