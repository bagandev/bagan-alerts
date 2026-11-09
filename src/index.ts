// cSpell:disable
import type { BaganPlugin, Block, Span } from "@bagandev/types";

/**
 * The five GitHub-flavored alert markers, as they must appear (exactly) as
 * the first text node of a block quote.
 */
const markers = [
  "[!NOTE]",
  "[!TIP]",
  "[!IMPORTANT]",
  "[!WARNING]",
  "[!CAUTION]",
] as const;

/** Union of the recognized marker strings, e.g. `"[!NOTE]"`. */
type Markers = (typeof markers)[number];

/**
 * Extract the alert label from a marker, e.g. `"[!NOTE]"` → `"NOTE"`.
 *
 * The label is rendered as the badge text.
 */
function getLabel(mkr: Markers) {
  const re = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]s*$/;
  const m = mkr.match(re);
  return m?.[1] as string;
}

/**
 * Badge background color for each alert kind:
 * NOTE → blue, TIP → green, IMPORTANT → purple, WARNING → purple,
 * CAUTION → red.
 */
function getColor(mkr: Markers) {
  return mkr === "[!CAUTION]"
    ? "#cf222e"
    : mkr === "[!IMPORTANT]"
      ? "#8250df"
      : mkr === "[!NOTE]"
        ? "#0969da"
        : mkr === "[!TIP]"
          ? "#1a7f37"
          : "#8250df";
}

/**
 * Build the colored badge paragraph that replaces the marker paragraph.
 *
 * Inline styles keep the badge self-contained — no external CSS needed.
 * The embedded newlines/spaces are harmless inside a style attribute.
 *
 * @param mkr The matched marker, e.g. `"[!NOTE]"`.
 * @param pos Source span of the paragraph the marker replaces.
 * @param textPos Source span of the marker text node.
 */
function badgeBlock(mkr: Markers, pos: Span, textPos: Span): Block {
  const label = getLabel(mkr);
  const color = getColor(mkr);

  return {
    type: "Paragraph",
    attrs: {
      attributes: [
        [
          "style",
          `font-family: Arial, Helvetica, sans-serif;
        background-color: ${color};
        color: white;
        padding: 4px;
        text-align: center;
        font-size: 12px;
        font-weight: 600;
        max-width: 100px;
        border-radius: 5px;`,
        ],
      ],
    },
    children: [{ type: "Text", value: label, pos: textPos }],
    pos,
  };
}

/**
 * The bagan-alerts plugin.
 *
 * A Bagan markdown plugin that turns GitHub-style alert block quotes into
 * colored badge labels.
 *
 * Recognized markers (first line of a block quote, exact match):
 *
 * ```md
 * > [!NOTE]
 * > Useful information that users should know, even when skimming content.
 *
 * > [!TIP]
 * > Helpful advice for doing things better.
 *
 * > [!IMPORTANT]
 * > Key information users need to know to succeed.
 *
 * > [!WARNING]
 * > Urgent info that needs immediate user attention.
 *
 * > [!CAUTION]
 * > Negative potential consequences of an action.
 * ```
 *
 * The marker paragraph is replaced by a colored badge paragraph
 * (e.g. NOTE in blue, CAUTION in red) rendered with inline styles, and the
 * remaining body of the quote is kept untouched after the badge. Kramdown
 * attributes (`{:#id .class key="val"}`) on the quote are preserved.
 */
const baganAlerts: BaganPlugin = {
  name: "bagan-alerts",
  version: "0.1.1",
  type: "markdown",
  description: "GitHub-style alerts for Bagan",
  fun(config, cache) {
    return {
      /**
       * Block visitor that rewrites alert block quotes.
       *
       * @param blocks A one-item tuple `[block]` with the block being
       *   visited (per the `BlockCallback` signature).
       * @returns A replacement block quote containing the badge plus the
       *   original alert body, or `recurse: true` for non-alert blocks.
       */
      visitBlock(blocks) {
        // `blocks` is a one-item tuple: `[block]` (see the JSDoc above).
        for (const block of blocks) {
          if (block.type === "BlockQuote") {
            // First child = potential marker paragraph; the rest = the alert
            // body, which must survive the transformation untouched.
            const firstChild = block.children[0];
            const restChild = block.children.slice(1);
            if (firstChild && firstChild.type === "Paragraph") {
              // It's an alert only if the paragraph starts with a text node
              // that is *exactly* one of the markers.
              if (
                firstChild.children[0] &&
                firstChild.children[0].type === "Text" &&
                markers.includes(firstChild.children[0].value as any)
              ) {
                // The matched `[!NOTE]`-style text node.
                const marker = firstChild.children[0];
                const firstRestChild = firstChild.children.slice(1);
                const replaceBlock = badgeBlock(
                  marker.value as Markers, // Safe: validated by includes() above.
                  firstChild.pos,
                  marker.pos,
                );
                // Rebuild the quote: badge in place of the marker paragraph,
                // alert body preserved after it.
                const replacement: Block = {
                  type: "BlockQuote",
                  pos: block.pos,
                  children: [replaceBlock],
                };
                if (firstRestChild.length > 0) {
                  for (const child of firstRestChild) {
                    if (
                      child.type !== "SoftBreak" &&
                      child.type !== "HardBreak" &&
                      child.type !== "LinkReference"
                    ) {
                      const block: Block = {
                        type: "Paragraph",
                        children: [child],
                        pos: child.pos,
                      };
                      replacement.children.push(block);
                    }
                  } // -- for
                } // -- if
                for (const child of restChild) {
                  replacement.children.push(child);
                }
                if (block.attrs) {
                  // Keep Kramdown attributes ({:#id .class key="val"}) intact.
                  replacement.attrs = block.attrs;
                }
                return {
                  replaceWith: [replacement],
                };
              }
            }
          }
        }
        return { recurse: true };
      },
    };
  },
};
