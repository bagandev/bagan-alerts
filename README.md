# bagan-alerts

GitHub-style alerts for [Bagan](https://github.com/bagandev). Turns GitHub's
alert block-quote markers (`[!NOTE]`, `[!TIP]`, …) into colored badge
labels when your Markdown is rendered.

## Syntax

Write alerts exactly like you would on GitHub — a block quote whose first
paragraph starts with one of the five markers:

```md
> [!NOTE]
> Useful information that users should know, even when skimming content.

> [!TIP]
> Helpful advice for doing things better.

> [!IMPORTANT]
> Key information users need to know to succeed.

> [!WARNING]
> Urgent info that needs immediate user attention.

> [!CAUTION]
> Negative potential consequences of an action.
```

Each alert type gets its own badge color:

| Marker          | Label     | Badge color |
| --------------- | --------- | ----------- |
| `[!NOTE]`       | NOTE      | blue        |
| `[!TIP]`        | TIP       | green       |
| `[!IMPORTANT]`  | IMPORTANT | purple      |
| `[!WARNING]`    | WARNING   | purple      |
| `[!CAUTION]`    | CAUTION   | red         |

## Behavior

- The marker paragraph is replaced by a colored badge paragraph (white text
  on a colored background, rounded corners), rendered entirely with inline
  styles — no external CSS is required.
- The rest of the quote is preserved and re-emitted after the badge, so your
  alert body keeps all of its original content and formatting.
- Kramdown attributes on the quote (`{:#id .class key="val"}`) are kept
  intact.
- A quote is only treated as an alert if its first child is a paragraph
  starting with a text node that is *exactly* one of the markers — anything
  else is left untouched.

## License

[MIT](./LICENSE)
