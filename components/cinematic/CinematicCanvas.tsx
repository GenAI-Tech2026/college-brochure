"use client";
import type { Act, ActState } from "@/lib/cinematic/types";
import { SVGScenePlayer } from "./SVGScenePlayer";
import { FrameSequencePlayer } from "./FrameSequencePlayer";
import { VideoActPlayer } from "./VideoActPlayer";

/**
 * The top-level "canvas" that fills the viewport and switches between act
 * renderers. Supports crossfading two acts at once (current + previous) for
 * form-progress mode.
 *
 * NOTE: this isn't an HTMLCanvasElement — it's a positioned <div> stage that
 * the underlying renderers (one of which IS a real canvas) live inside. The
 * name comes from the IDE-friendly mental model "one cinematic canvas per
 * page".
 */
export function CinematicCanvas({
  current,
  previous,
  fade = 1,
  progress,
  activeState = "active",
  fillRatio,
}: {
  current: Act;
  previous?: Act | null;
  /** 0..1 fade-from-previous-to-current. Used only in form-driven mode. */
  fade?: number;
  /** 0..1 within the current act (scroll mode) or just 0 (form mode). */
  progress: number;
  activeState?: ActState;
  fillRatio?: number;
}) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-ink">
      {previous ? (
        <div
          aria-hidden
          className="absolute inset-0 transition-opacity"
          style={{ opacity: 1 - fade }}
        >
          <ActRenderer act={previous} progress={0.5} state="exiting" />
        </div>
      ) : null}
      <div
        className="absolute inset-0 transition-opacity"
        style={{ opacity: fade }}
      >
        <ActRenderer act={current} progress={progress} state={activeState} fillRatio={fillRatio} />
      </div>
    </div>
  );
}

function ActRenderer({
  act,
  progress,
  state,
  fillRatio,
}: {
  act: Act;
  progress: number;
  state: ActState;
  fillRatio?: number;
}) {
  switch (act.asset.type) {
    case "video":
      return (
        <VideoActPlayer
          src={act.asset.desktop}
          durationSec={act.asset.durationSec}
          progress={progress}
          autoplay={act.asset.autoplay ?? true}
        />
      );
    case "frames":
      return (
        <FrameSequencePlayer
          pathTemplate={act.asset.desktop}
          frameCount={act.asset.frameCount}
          pad={act.asset.pad ?? 4}
          progress={progress}
        />
      );
    case "scene":
      return (
        <SVGScenePlayer
          Scene={act.asset.Component}
          progress={progress}
          state={state}
          fillRatio={fillRatio}
        />
      );
  }
}
