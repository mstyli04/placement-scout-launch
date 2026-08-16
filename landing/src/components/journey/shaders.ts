/**
 * Everything below is a pure function of uProgress. No velocity, no
 * accumulated simulation state, no easing toward a target between frames —
 * scrubbing to 0.63 gives an identical image whether you arrived from 0.2 or
 * from 1.0. That property is what makes a scroll piece feel attached to the
 * page rather than chasing it, and it is what makes it testable: a headless
 * check can set a progress value and assert on the settled frame.
 *
 * uTime is used only for effects that are honestly ambient — the breathing of
 * the signal points and the drift of the census cloud — never for anything
 * that carries meaning.
 */

export const particleVertex = /* glsl */ `
uniform float uProgress;
uniform float uTime;
uniform float uSize;
uniform float uPixelRatio;

attribute vec3 aTarget;
attribute float aSeed;
attribute float aGroup;

varying float vAlpha;
varying float vGroup;
varying float vIgnite;

const float GROUP_MOVED      = 0.0;
const float GROUP_NO_SITE    = 1.0;
const float GROUP_NO_CAREERS = 2.0;
const float GROUP_WATCHED    = 3.0;

// Stage windows. Deliberately overlapping by a little so no two acts start on
// the same frame — a hard boundary reads as a jump cut.
float stage(float a, float b) {
  return smoothstep(a, b, uProgress);
}

// Cheap hash for per-particle variation that stays deterministic.
float hash(float n) { return fract(sin(n * 43758.5453123) * 43758.5453123); }

void main() {
  vGroup = aGroup;

  // --- Act 1: landfall. The census cloud resolves into the real map. ---
  // Staggered per particle so the coastline assembles in a wave rather than
  // every point arriving together.
  float lag = hash(aSeed * 91.7) * 0.10;
  float land = stage(0.04 + lag, 0.30 + lag);
  land = land * land * (3.0 - 2.0 * land);

  vec3 pos = mix(position, aTarget, land);

  // Ambient drift, strongest while dispersed, almost gone once landed.
  float drift = (1.0 - land) * 0.55 + 0.02;
  pos.x += sin(uTime * 0.16 + aSeed * 24.0) * drift;
  pos.y += cos(uTime * 0.13 + aSeed * 31.0) * drift;
  pos.z += sin(uTime * 0.11 + aSeed * 17.0) * drift;

  // --- Acts 2 and 3: the funnel thins. ---
  // A culled particle falls away and out, it does not simply fade: the point
  // is that most of the register is discarded, and discarding should look
  // like something leaving.
  float cull = 0.0;
  if (aGroup == GROUP_NO_SITE)         cull = stage(0.34, 0.52);
  else if (aGroup == GROUP_NO_CAREERS) cull = stage(0.56, 0.72);

  float fall = cull * cull;
  pos.y -= fall * (5.0 + hash(aSeed * 12.3) * 9.0);
  pos.z -= fall * (2.0 + hash(aSeed * 55.1) * 5.0);
  pos.x += (hash(aSeed * 7.7) - 0.5) * fall * 5.0;

  // --- Act 4: the nightly sweep. ---
  // A band crossing the map during the watch stage, brightening what it
  // passes. This is the recheck, made visible.
  float sweepT = stage(0.60, 0.86);
  float sweepY = mix(12.0, -12.0, sweepT);
  float sweepHit = 1.0 - smoothstep(0.0, 1.5, abs(aTarget.y - sweepY));
  sweepHit *= step(0.001, sweepT) * (1.0 - step(0.999, sweepT));

  // --- Act 5: ignition. Only the firms that actually moved. ---
  float ignite = 0.0;
  if (aGroup == GROUP_MOVED) {
    ignite = stage(0.74, 0.90);
    // Breathing, out of phase per particle so it never pulses in unison.
    ignite *= 0.72 + 0.28 * sin(uTime * 1.6 + aSeed * 40.0);
  }
  vIgnite = ignite;

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;

  // Size: perspective-attenuated, with the survivors growing as the field
  // thins so the remaining data stays readable rather than vanishing.
  float base = uSize * (0.55 + hash(aSeed * 3.1) * 0.6);
  float survivorBoost =
      (aGroup == GROUP_WATCHED ? 1.0 + stage(0.56, 0.80) * 1.5 : 1.0)
    * (aGroup == GROUP_MOVED   ? 1.0 + stage(0.70, 0.92) * 5.0 : 1.0);
  float size = base * survivorBoost * (1.0 + sweepHit * 1.4);

  gl_PointSize = size * uPixelRatio * (14.0 / -mv.z);

  // Alpha: arrive with the landfall, leave with the cull, and never let the
  // discarded groups linger as visual noise behind the answer.
  float a = 0.05 + land * 0.85;
  a *= (1.0 - cull);
  if (aGroup == GROUP_WATCHED) a *= 0.55 + stage(0.56, 0.80) * 0.45;
  if (aGroup == GROUP_MOVED)   a = max(a, ignite);
  a += sweepHit * 0.45 * (1.0 - cull);

  vAlpha = clamp(a, 0.0, 1.0);
}
`

export const particleFragment = /* glsl */ `
precision highp float;

uniform vec3 uColdColor;
uniform vec3 uBrandColor;
uniform vec3 uSignalColor;
uniform float uProgress;

varying float vAlpha;
varying float vGroup;
varying float vIgnite;

void main() {
  // Soft round sprite. Squared falloff reads closer to a light source than a
  // linear one, and avoids the flat-disc look of a hard circle.
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;
  float falloff = pow(1.0 - d * 2.0, 1.9);

  // The palette walks with the journey: cold slate while it is just a
  // census, brand blue once it is a real dataset, signal green only for the
  // firms that actually moved.
  vec3 color = mix(uColdColor, uBrandColor, smoothstep(0.10, 0.45, uProgress));
  if (vGroup == 0.0) {
    color = mix(color, uSignalColor, vIgnite);
    // A touch of warmth in the core of an ignited point, so it reads as lit
    // rather than merely coloured.
    color += vec3(0.25, 0.18, 0.0) * vIgnite * falloff;
  }

  gl_FragColor = vec4(color, vAlpha * falloff);
}
`

export const coastVertex = /* glsl */ `
uniform float uProgress;
varying float vT;
void main() {
  vT = clamp((position.y + 12.0) / 24.0, 0.0, 1.0);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export const coastFragment = /* glsl */ `
precision highp float;
uniform float uProgress;
uniform vec3 uColor;
varying float vT;
void main() {
  // The coastline draws itself in as the particles land, holds while the
  // funnel runs, then recedes so the surviving firms are what you look at.
  float draw = smoothstep(0.10, 0.34, uProgress);
  float recede = 1.0 - smoothstep(0.72, 0.96, uProgress);
  gl_FragColor = vec4(uColor, 0.30 * draw * recede);
}
`
