"use client";

import { useEffect, useRef } from "react";
import { markdown } from "@codemirror/lang-markdown";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap, lineNumbers } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";

export function MarkdownEditor({
  value,
  onChange,
}: {
  value: string;
  onChange?: (value: string) => void;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!hostRef.current || viewRef.current) return;

    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        history(),
        markdown(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) onChange?.(update.state.doc.toString());
        }),
        EditorView.theme({
          "&": {
            minHeight: "620px",
            fontSize: "15px",
            background: "#ffffff",
            color: "#111111",
          },
          ".cm-content": {
            padding: "18px 18px 28px",
            lineHeight: "1.75",
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          },
          ".cm-gutters": {
            background: "#f4f4f2",
            borderRight: "1px solid #dedbd7",
            color: "#777777",
          },
          ".cm-activeLine": {
            background: "#faf0ef",
          },
          ".cm-activeLineGutter": {
            background: "#f8dedb",
          },
          ".cm-focused": {
            outline: "none",
          },
        }),
      ],
    });

    viewRef.current = new EditorView({
      state,
      parent: hostRef.current,
    });

    return () => {
      viewRef.current?.destroy();
      viewRef.current = null;
    };
  }, [onChange, value]);

  return <div ref={hostRef} className="overflow-hidden rounded-md border border-[var(--line)]" />;
}
