"use client";
import { useEffect, useRef, useState } from "react";
import type { ComponentType } from "react";
import type { ActState, SceneProps } from "@/lib/cinematic/types";

/**
 * Renders a React scene component into a viewport-sized stage. Used as the
 * fallback when no <video> or frame-sequence asset exists yet — perfect for
 * shipping pages with SVG-driven cinematic scenes today and dropping real
 * AI renders into the same Act slot tomorrow.
 *
 * Reports its measured size to the scene so it can lay out responsively.
 */
export function SVGScenePlayer({
  Scene,
  progress,
  state,
  className,
  fillRatio,
}: {
  Scene: ComponentType<SceneProps>;
  progress: number;
  state: ActState;
  className?: string;
  fillRatio?: number;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={wrapRef}
      className={"absolute inset-0 overflow-hidden " + (className ?? "")}
      data-fill={fillRatio?.toFixed(2)}
    >
      {size.w > 0 && size.h > 0 ? (
        <Scene progress={progress} state={state} width={size.w} height={size.h} />
      ) : null}
    </div>
  );
}
