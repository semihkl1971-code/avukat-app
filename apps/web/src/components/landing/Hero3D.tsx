'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

/**
 * Hero arka planı için gerçek WebGL 3D sahne:
 * - Dönen, parlayan wireframe ikosahedron (çekirdek)
 * - Etrafında 3D parçacık bulutu (yıldız alanı)
 * - Fareyle/dokunuşla parallax
 * - prefers-reduced-motion'a saygılı, temiz unmount
 */
export default function Hero3D() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    if (typeof window === 'undefined') return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const w = () => mount.clientWidth || window.innerWidth
    const h = () => mount.clientHeight || window.innerHeight

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(55, w() / h(), 0.1, 100)
    camera.position.z = 16

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6))
    renderer.setSize(w(), h())
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    const group = new THREE.Group()
    scene.add(group)

    // ── Çekirdek: iç içe iki wireframe ikosahedron ──
    const ico1 = new THREE.Mesh(
      new THREE.IcosahedronGeometry(4.6, 1),
      new THREE.MeshBasicMaterial({ color: 0x8b80ff, wireframe: true, transparent: true, opacity: 0.55 }),
    )
    const ico2 = new THREE.Mesh(
      new THREE.IcosahedronGeometry(6.6, 1),
      new THREE.MeshBasicMaterial({ color: 0xa855f7, wireframe: true, transparent: true, opacity: 0.18 }),
    )
    group.add(ico1, ico2)

    // Köşe noktaları (parlayan düğümler)
    const nodeGeo = new THREE.BufferGeometry()
    nodeGeo.setAttribute('position', ico1.geometry.getAttribute('position').clone())
    const nodes = new THREE.Points(
      nodeGeo,
      new THREE.PointsMaterial({ color: 0x22d3ee, size: 0.16, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }),
    )
    group.add(nodes)

    // ── Parçacık bulutu (küresel kabuk) ──
    const COUNT = 1300
    const pPos = new Float32Array(COUNT * 3)
    const pCol = new Float32Array(COUNT * 3)
    const cA = new THREE.Color(0x6c63ff)
    const cB = new THREE.Color(0x22d3ee)
    for (let i = 0; i < COUNT; i++) {
      const r = 9 + Math.random() * 11
      const th = Math.acos(2 * Math.random() - 1)
      const ph = Math.random() * Math.PI * 2
      pPos[i * 3] = r * Math.sin(th) * Math.cos(ph)
      pPos[i * 3 + 1] = r * Math.sin(th) * Math.sin(ph)
      pPos[i * 3 + 2] = r * Math.cos(th)
      const c = cA.clone().lerp(cB, Math.random())
      pCol[i * 3] = c.r; pCol[i * 3 + 1] = c.g; pCol[i * 3 + 2] = c.b
    }
    const partGeo = new THREE.BufferGeometry()
    partGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3))
    partGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3))
    const particles = new THREE.Points(
      partGeo,
      new THREE.PointsMaterial({ size: 0.08, vertexColors: true, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }),
    )
    scene.add(particles)

    // ── Fare parallax ──
    const target = { x: 0, y: 0 }
    const cur = { x: 0, y: 0 }
    function onMove(e: PointerEvent) {
      target.x = (e.clientX / window.innerWidth - 0.5) * 2
      target.y = (e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('pointermove', onMove, { passive: true })

    // ── Animasyon ──
    let raf = 0
    const clock = new THREE.Clock()
    function render() {
      const t = clock.getElapsedTime()
      cur.x += (target.x - cur.x) * 0.04
      cur.y += (target.y - cur.y) * 0.04
      group.rotation.y = t * 0.12 + cur.x * 0.5
      group.rotation.x = Math.sin(t * 0.18) * 0.12 + cur.y * 0.35
      ico2.rotation.z = t * 0.06
      nodes.rotation.copy(ico1.rotation)
      particles.rotation.y = t * 0.02
      camera.position.x += (cur.x * 1.6 - camera.position.x) * 0.05
      camera.position.y += (-cur.y * 1.2 - camera.position.y) * 0.05
      camera.lookAt(0, 0, 0)
      renderer.render(scene, camera)
      raf = requestAnimationFrame(render)
    }

    function onResize() {
      camera.aspect = w() / h()
      camera.updateProjectionMatrix()
      renderer.setSize(w(), h())
    }
    window.addEventListener('resize', onResize)

    if (reduce) {
      renderer.render(scene, camera) // tek kare, hareketsiz
    } else {
      render()
    }

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      ico1.geometry.dispose(); ico2.geometry.dispose(); nodeGeo.dispose(); partGeo.dispose()
      ;(ico1.material as THREE.Material).dispose()
      ;(ico2.material as THREE.Material).dispose()
      ;(nodes.material as THREE.Material).dispose()
      ;(particles.material as THREE.Material).dispose()
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div
      ref={mountRef}
      aria-hidden
      style={{
        position: 'absolute', top: 0, left: 'calc(50% - 50vw)', width: '100vw', height: '100%',
        zIndex: 0, pointerEvents: 'none', overflow: 'hidden',
        maskImage: 'radial-gradient(ellipse 75% 70% at 50% 42%, #000 38%, transparent 78%)',
        WebkitMaskImage: 'radial-gradient(ellipse 75% 70% at 50% 42%, #000 38%, transparent 78%)',
      }}
    />
  )
}
