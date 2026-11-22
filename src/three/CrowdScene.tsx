import { Environment, Lightformer } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { FIGURE_SVG } from "@/lib/figure";
import { scrollState } from "@/lib/scroll";
import { useFrameloopInView } from "@/three/useFrameloopInView";

/** The logo's figure as a solid: extruded, bevelled, 1 unit tall, standing on its feet at the origin. */
export function figureGeometry(depth = 0.16) {
	const data = new SVGLoader().parse(FIGURE_SVG);
	const parts: THREE.BufferGeometry[] = [];
	for (const path of data.paths) {
		for (const shape of path.toShapes()) {
			parts.push(
				new THREE.ExtrudeGeometry(shape, { depth: depth * 684, bevelEnabled: true, bevelThickness: 18, bevelSize: 14, bevelSegments: 4, curveSegments: 14 }),
			);
		}
	}
	const g = mergeGeometries(parts, false);
	for (const p of parts) p.dispose();
	// SVG y points down; flip, then normalise to a height of 1 with the feet at y = 0.
	g.scale(1, -1, 1);
	g.computeBoundingBox();
	const box = g.boundingBox as THREE.Box3;
	const h = box.max.y - box.min.y;
	g.translate(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);
	g.scale(1 / h, 1 / h, 1 / h);
	g.computeVertexNormals();
	return g;
}

const COARSE = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

/** Deterministic noise so the crowd is scattered, never a grid. */
const rand = (n: number) => {
	const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
	return x - Math.floor(x);
};
const PALETTE = ["#f1592a", "#f1592a", "#f1592a", "#ff9a6e", "#ffd0b8", "#fbf6ef"].map((c) => new THREE.Color(c));
const ROWS = [
	{ n: 9, z: 0.9, spread: 4.4, size: 1.0 },
	{ n: 12, z: -0.5, spread: 5.4, size: 0.92 },
	{ n: 15, z: -2.0, spread: 6.6, size: 0.86 },
];

function Crowd({ reduced }: { reduced: boolean }) {
	const mesh = useRef<THREE.InstancedMesh>(null);
	const geometry = useMemo(() => figureGeometry(), []);
	const dummy = useMemo(() => new THREE.Object3D(), []);
	const color = useMemo(() => new THREE.Color(), []);
	const origin = useRef(0);
	const phase = useRef(0);
	const people = useMemo(() => {
		const out: { x: number; z: number; s: number; c: THREE.Color; turn: number; seed: number }[] = [];
		let k = 0;
		for (const row of ROWS) {
			for (let i = 0; i < row.n; i++) {
				k++;
				const t = row.n === 1 ? 0.5 : i / (row.n - 1);
				out.push({
					x: (t - 0.5) * 2 * row.spread + (rand(k) - 0.5) * 0.5,
					z: row.z + (rand(k + 50) - 0.5) * 0.6,
					s: row.size * (0.82 + rand(k + 90) * 0.3),
					c: PALETTE[Math.floor(rand(k + 130) * PALETTE.length)],
					turn: (rand(k + 170) - 0.5) * 0.7,
					seed: rand(k + 210) * 6.28,
				});
			}
		}
		return out;
	}, []);
	useEffect(() => () => geometry.dispose(), [geometry]);

	useFrame((state, dt) => {
		const m = mesh.current;
		if (!m) return;
		// A Mexican wave: it starts where the pointer is and runs faster while the page scrolls.
		const target = reduced ? 0 : state.pointer.x * 5;
		origin.current += (target - origin.current) * (1 - Math.exp(-dt * 2));
		phase.current += dt * (reduced ? 0 : 2.2 + Math.min(4, Math.abs(scrollState.velocity) * 0.08));
		people.forEach((p, i) => {
			const d = Math.abs(p.x - origin.current) + Math.abs(p.z) * 0.3;
			const wave = Math.max(0, Math.sin(d * 0.9 - phase.current)) ** 5;
			const sway = Math.sin(phase.current * 0.7 + p.seed) * 0.02;
			dummy.position.set(p.x, wave * 0.34 * p.s, p.z);
			dummy.rotation.set(0, p.turn, sway + wave * 0.05 * Math.sign(p.x - origin.current));
			dummy.scale.set(p.s, p.s * (1 + wave * 0.04), p.s);
			dummy.updateMatrix();
			m.setMatrixAt(i, dummy.matrix);
			color.copy(p.c).multiplyScalar(0.9 + wave * 0.25);
			m.setColorAt(i, color);
		});
		m.instanceMatrix.needsUpdate = true;
		if (m.instanceColor) m.instanceColor.needsUpdate = true;
	});

	return (
		<instancedMesh ref={mesh} args={[geometry, undefined, people.length]} frustumCulled={false}>
			{COARSE ? (
				<meshStandardMaterial roughness={0.32} metalness={0} />
			) : (
				<meshPhysicalMaterial roughness={0.3} metalness={0} clearcoat={1} clearcoatRoughness={0.2} />
			)}
		</instancedMesh>
	);
}

/** Narrow screens stand further back so the crowd still reads as a crowd. */
function Framing() {
	useFrame(({ camera, size, scene }) => {
		const aspect = size.width / Math.max(1, size.height);
		camera.position.z = aspect < 1.6 ? 6.4 + (1.6 - aspect) * 5.5 : 6.4;
		camera.lookAt(0, 0.55, 0);
		if (scene.fog instanceof THREE.Fog) {
			scene.fog.near = camera.position.z - 0.2;
			scene.fog.far = camera.position.z + 4.8;
		}
	});
	return null;
}

export default function CrowdScene() {
	const { ref, frameloop } = useFrameloopInView<HTMLDivElement>();
	const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	return (
		<div ref={ref} className="absolute inset-0">
			<Canvas
				frameloop={frameloop}
				dpr={[1, COARSE ? 1.5 : 1.75]}
				camera={{ position: [0, 0.95, 6.4], fov: 30, near: 0.1, far: 40 }}
				gl={{ antialias: true, alpha: true }}
				onCreated={({ camera }) => camera.lookAt(0, 0.55, 0)}
				aria-hidden
			>
				<fog attach="fog" args={["#1e1a19", 6.5, 11]} />
				<ambientLight intensity={0.35} />
				<directionalLight position={[3, 5, 4]} intensity={2.2} color="#fff0e0" />
				<Environment resolution={128}>
					<Lightformer form="rect" intensity={2.2} position={[0, 4, 3]} scale={[8, 2, 1]} color="#ffe2cc" />
					<Lightformer form="rect" intensity={1.2} position={[-5, 1, 1]} rotation-y={Math.PI / 2} scale={[4, 2, 1]} color="#f1592a" />
					<Lightformer form="ring" intensity={1} position={[4, 2, -2]} scale={2} color="#ffffff" />
				</Environment>
				<Crowd reduced={reduced} />
				<Framing />
			</Canvas>
		</div>
	);
}
