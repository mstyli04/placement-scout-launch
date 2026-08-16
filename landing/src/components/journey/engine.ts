import * as THREE from "three"

import { buildField, TOTALS } from "./field"
import { coastlineSegments } from "./geography"
import {
  coastFragment, coastVertex, particleFragment, particleVertex,
} from "./shaders"

/**
 * Everything that touches Three.js lives here, and this module is imported at
 * runtime rather than at build time. Three is ~500 kB — twenty times the rest
 * of the homepage bundle — and a landing page should not make a reader
 * download a 3D library before it can show them a paragraph. The page paints,
 * then this arrives.
 */
export type JourneyHandle = {
  setProgress: (p: number) => void
  dispose: () => void
}

// Density-weighted centre of the register, in world units — derived from the
// same region-density data the map uses, not eyeballed.
const DENSITY_CENTRE = { x: 2.22, y: -4.75 }

function smootherstep(a: number, b: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * t * (t * (t * 6 - 15) + 10)
}

export function startJourney(
  canvas: HTMLCanvasElement,
  reduced: boolean,
): JourneyHandle | null {
  let renderer: THREE.WebGLRenderer
  try {
    renderer = new THREE.WebGLRenderer({
      canvas, antialias: false, alpha: true, powerPreference: "high-performance",
    })
    if (!renderer.getContext()) return null
  } catch {
    return null // No WebGL. The page keeps working; it just has no visual.
  }

  renderer.setClearColor(0x000000, 0)
  // 73,685 additively-blended points are fill-rate bound, and a phone at
  // devicePixelRatio 3 asks for nine times the pixels of a 1x desktop screen
  // to draw the same picture. Capping the ratio on small screens costs almost
  // nothing visually — the points are 3px — and is the difference between
  // this being smooth on a phone and being a slideshow.
  const narrow = Math.min(window.innerWidth, window.innerHeight) < 768
  const dpr = Math.min(window.devicePixelRatio || 1, narrow ? 1.5 : 2)
  renderer.setPixelRatio(dpr)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 200)

  // One point per firm on the register — the real count, not a round number
  // chosen for performance. It is the claim the section makes.
  const geometry = buildField(TOTALS.firms)
  const material = new THREE.ShaderMaterial({
    vertexShader: particleVertex,
    fragmentShader: particleFragment,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uProgress: { value: 0 },
      uTime: { value: 0 },
      uSize: { value: 3.4 },
      uPixelRatio: { value: dpr },
      uColdColor: { value: new THREE.Color("#7e8899") },
      uBrandColor: { value: new THREE.Color("#4a86f0") },
      uSignalColor: { value: new THREE.Color("#48c07a") },
    },
  })
  const points = new THREE.Points(geometry, material)
  scene.add(points)

  const coastGeo = new THREE.BufferGeometry()
  coastGeo.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(coastlineSegments(), 3),
  )
  const coastMat = new THREE.ShaderMaterial({
    vertexShader: coastVertex,
    fragmentShader: coastFragment,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uProgress: { value: 0 },
      uColor: { value: new THREE.Color("#a8c4f5") },
    },
  })
  const coast = new THREE.LineSegments(coastGeo, coastMat)
  scene.add(coast)

  const resize = () => {
    const w = canvas.clientWidth || window.innerWidth
    const h = canvas.clientHeight || window.innerHeight
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    // A narrow screen makes the map taller than it is wide — widen the field
    // of view rather than cropping the country.
    camera.fov = w / h < 0.9 ? 66 : 52
    camera.updateProjectionMatrix()
  }
  resize()

  let progress = 0
  let frame = 0
  const clock = new THREE.Clock()

  const render = () => {
    material.uniforms.uProgress.value = progress
    coastMat.uniforms.uProgress.value = progress
    material.uniforms.uTime.value = reduced ? 0 : clock.getElapsedTime()

    // Camera choreography: a long push in from the census cloud to the map,
    // then a move onto the firms that are actually left.
    //
    // The target is not the middle of the country. Firm density is weighted
    // hard to the south-east (London and the South East hold about half the
    // register), so the survivors of the funnel sit around x=2.2, y=-4.8 in
    // world space — framing the geometric centre instead left the final act
    // hanging off the bottom-right corner. This follows the data.
    const ease = progress * progress * (3 - 2 * progress)
    const settle = smootherstep(0.55, 0.95, progress)
    const tx = THREE.MathUtils.lerp(0, DENSITY_CENTRE.x, settle)
    const ty = THREE.MathUtils.lerp(THREE.MathUtils.lerp(1.5, -0.8, ease), DENSITY_CENTRE.y, settle)

    camera.position.set(
      tx + Math.sin(progress * 0.9) * 2.2,
      ty + THREE.MathUtils.lerp(3.5, 1.4, ease),
      THREE.MathUtils.lerp(34, 11.5, ease),
    )
    camera.lookAt(tx, ty, 0)
    points.rotation.y = Math.sin(progress * 1.4) * 0.1
    coast.rotation.y = points.rotation.y

    renderer.render(scene, camera)
    frame = requestAnimationFrame(render)
  }
  render()
  window.addEventListener("resize", resize)

  return {
    setProgress: (p: number) => { progress = p },
    dispose: () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("resize", resize)
      geometry.dispose()
      material.dispose()
      coastGeo.dispose()
      coastMat.dispose()
      renderer.dispose()
    },
  }
}
