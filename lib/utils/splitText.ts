/**
 * Tiny split-text utility — Club GreenSock's SplitText is paid.
 * We DOM-mutate a single time, then return refs to per-char and per-word
 * spans so GSAP can animate them with `stagger`.
 *
 * Why hand-rolled: license, bundle size, and we don't need their
 * 16-feature feature-matrix. We need chars + words.
 */

export interface SplitTextResult {
  chars: HTMLSpanElement[];
  words: HTMLSpanElement[];
  revert: () => void;
}

export function splitText(
  el: HTMLElement,
  opts: { chars?: boolean; words?: boolean } = { chars: true, words: true }
): SplitTextResult {
  const original = el.innerHTML;
  const text = el.textContent ?? "";
  el.innerHTML = "";
  el.setAttribute("aria-label", text);

  const words: HTMLSpanElement[] = [];
  const chars: HTMLSpanElement[] = [];

  text.split(" ").forEach((word, wIdx, arr) => {
    const wordSpan = document.createElement("span");
    wordSpan.style.display = "inline-block";
    wordSpan.style.whiteSpace = "pre";
    wordSpan.setAttribute("aria-hidden", "true");
    wordSpan.className = "split-word";

    if (opts.chars) {
      [...word].forEach((ch) => {
        const charSpan = document.createElement("span");
        charSpan.style.display = "inline-block";
        charSpan.style.willChange = "transform, opacity";
        charSpan.className = "split-char";
        charSpan.textContent = ch;
        chars.push(charSpan);
        wordSpan.appendChild(charSpan);
      });
    } else {
      wordSpan.textContent = word;
    }

    words.push(wordSpan);
    el.appendChild(wordSpan);
    if (wIdx < arr.length - 1) el.appendChild(document.createTextNode(" "));
  });

  const revert = () => {
    el.innerHTML = original;
    el.removeAttribute("aria-label");
  };
  return { chars, words, revert };
}
