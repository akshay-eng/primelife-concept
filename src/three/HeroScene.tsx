import { Sparkles, Text, useTexture } from "@react-three/drei";
import { Canvas, type ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { Moment } from "@/lib/data";
import { scrollState } from "@/lib/scroll";
import { bentPlane, createPhotoMaterial } from "@/three/photoMaterial";
import { useFrameloopInView } from "@/three/useFrameloopInView";
import { asset } from "@/lib/asset";

const FOG = "#f2e4d4";
const COARSE = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
const INK = "#2b2321";
const SUN = "#f1592a";
const RADIUS = 3.95;
const CARD_W = 1.2;
const CARD_H = 1.58;
const TILT = 0.3;
const RING_Y = -0.5;

export type HeroControl = {
	/** 0 while the hero fills the screen, 1 once it has scrolled away. */
	exit: number;
	/** Set by the DOM: index of the card being hovered, or -1. */
	hovered: number;
	reduced: boolean;
};

type SceneProps = {
	photos: Moment[];
	control: React.RefObject<HeroControl>;
	onHover: (index: number) => void;
	onSelect: (index: number, pointerType: string) => void;
	onReady: () => void;
};

function PhotoCard({
	moment,
	index,
	count,
	geometry,
	control,
	onHover,
	onSelect,
	startedAt,
}: {
	moment: Moment;
	index: number;
	count: number;
	geometry: THREE.BufferGeometry;
	control: React.RefObject<HeroControl>;
	onHover: (i: number) => void;
	onSelect: (i: number, pointerType: string) => void;
	startedAt: React.RefObject<number>;
}) {
	const map = useTexture(moment.srcSmall);
	const gl = useThree((s) => s.gl);
	const material = useMemo(() => {
		map.colorSpace = THREE.SRGBColorSpace;
		map.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
		return createPhotoMaterial(map, CARD_W / CARD_H, FOG);
	}, [map, gl]);
	const mesh = useRef<THREE.Mesh>(null);
	const angle = (index / count) * Math.PI * 2;
	const yJitter = Math.sin(index * 2.3) * 0.22;

	useEffect(() => () => material.dispose(), [material]);

	useFrame((_, dt) => {
		const m = mesh.current;
		const c = control.current;
		if (!m || !c) return;
		const u = material.uniforms;
		const t = (performance.now() - (startedAt.current ?? 0)) / 1000;
		// Entrance: each card arrives 70ms after the one before, rising out of the ring.
		const local = THREE.MathUtils.clamp((t - 0.25 - index * 0.07) / 0.9, 0, 1);
		const eased = c.reduced ? (local > 0 ? 1 : 0) : 1 - (1 - local) ** 4;
		u.uReveal.value = eased;
		const isHover = c.hovered === index;
		const k = 1 - Math.exp(-dt * 12);
		u.uHover.value += ((isHover ? 1 : 0) - u.uHover.value) * k;
		u.uDim.value += ((c.hovered >= 0 && !isHover ? 1 : 0) - u.uDim.value) * k;
		const r = RADIUS * (1 + c.exit * 0.55) * (0.82 + 0.18 * eased);
		m.position.set(Math.sin(angle) * r, yJitter + (1 - eased) * -0.6, Math.cos(angle) * r);
		const s = (0.92 + 0.08 * eased) * (1 + u.uHover.value * 0.1);
		m.scale.setScalar(s);
	});

	return (
		<mesh
			ref={mesh}
			geometry={geometry}
			material={material}
			rotation={[0, angle, 0]}
			onPointerOver={(e: ThreeEvent<PointerEvent>) => {
				e.stopPropagation();
				onHover(index);
			}}
			onPointerOut={(e: ThreeEvent<PointerEvent>) => {
				// A finger lifting off is not "leaving": keep the caption until the next tap.
				if (e.pointerType === "mouse") onHover(-1);
			}}
			onClick={(e: ThreeEvent<MouseEvent>) => {
				e.stopPropagation();
				onSelect(index, (e.nativeEvent as PointerEvent).pointerType ?? "mouse");
			}}
		/>
	);
}

function Headline({ control, startedAt }: { control: React.RefObject<HeroControl>; startedAt: React.RefObject<number> }) {
	const group = useRef<THREE.Group>(null);
	const first = useRef<THREE.Mesh & { fillOpacity: number }>(null);
	const second = useRef<THREE.Mesh & { fillOpacity: number }>(null);
	useFrame(() => {
		const c = control.current;
		const g = group.current;
		if (!c || !g) return;
		const t = (performance.now() - (startedAt.current ?? 0)) / 1000;
		const a = c.reduced ? 1 : 1 - (1 - THREE.MathUtils.clamp((t - 0.1) / 1.1, 0, 1)) ** 4;
		const b = c.reduced ? 1 : 1 - (1 - THREE.MathUtils.clamp((t - 0.22) / 1.1, 0, 1)) ** 4;
		if (first.current) {
			first.current.position.y = 0.9 - (1 - a) * 0.5;
			first.current.fillOpacity = a;
		}
		if (second.current) {
			second.current.position.y = -0.82 - (1 - b) * 0.5;
			second.current.fillOpacity = b;
		}
		g.position.y = 0.42 + c.exit * 0.9;
	});
	const common = {
		font: asset("/fonts/bricolage-display-700.ttf"),
		fontSize: 2.02,
		letterSpacing: -0.045,
		anchorX: "center" as const,
		anchorY: "middle" as const,
		"material-toneMapped": false,
	};
	return (
		<group ref={group}>
			<Text ref={first} {...common} color={INK} position={[0, 0.88, 0]}>
				Enjoy
			</Text>
			<Text ref={second} {...common} color={SUN} position={[0, -0.74, 0]}>
				life.
			</Text>
		</group>
	);
}

function Rig({ photos, control, onHover, onSelect, onReady }: SceneProps) {
	const ring = useRef<THREE.Group>(null);
	const scaler = useRef<THREE.Group>(null);
	const startedAt = useRef(performance.now());
	const spin = useRef(0);
	const geometry = useMemo(() => bentPlane(CARD_W, CARD_H, RADIUS), []);
	const camera = useThree((s) => s.camera);

	useEffect(() => {
		startedAt.current = performance.now();
		onReady();
		return () => geometry.dispose();
	}, [geometry, onReady]);

	useFrame((state, dt) => {
		const c = control.current;
		if (!c || !ring.current || !scaler.current) return;
		// Fit the composition to the card: the ring spans about 9 units at z = 0.
		const v = state.viewport.getCurrentViewport(camera, new THREE.Vector3(0, 0, 0));
		// On wide cards the copy owns the bottom third, so the composition sits in the band above it.
		const wide = v.width / v.height > 1.1;
		// Portrait: size to the headline and let the ring run off the edges.
		const fit = wide ? Math.min(1.12, v.width / 10.4, v.height / 7.5) : Math.min(v.width / 6.1, v.height / 6.4);
		scaler.current.scale.setScalar(fit);
		scaler.current.position.y = wide ? v.height * 0.085 : 0;
		// Auto-rotate slowly; a scroll fling adds spin; hovering eases it almost to a stop.
		const base = c.reduced ? 0 : c.hovered >= 0 ? 0.015 : 0.085;
		const fling = c.reduced ? 0 : THREE.MathUtils.clamp(scrollState.velocity * 0.012, -0.5, 0.5);
		spin.current += (base + Math.abs(fling)) * dt;
		const px = c.reduced ? 0 : state.pointer.x;
		const py = c.reduced ? 0 : state.pointer.y;
		const k = 1 - Math.exp(-dt * 3);
		ring.current.rotation.y = spin.current + px * 0.35;
		ring.current.rotation.x += (TILT - py * 0.08 + c.exit * 0.18 - ring.current.rotation.x) * k;
		ring.current.rotation.z += (-0.05 + px * 0.03 - ring.current.rotation.z) * k;
		state.camera.position.x += (px * 0.55 - state.camera.position.x) * k;
		state.camera.position.y += (py * 0.3 - state.camera.position.y) * k;
		state.camera.position.z = 11 + c.exit * 2.4;
		state.camera.lookAt(0, 0, 0);
	});

	return (
		<group ref={scaler}>
			<Headline control={control} startedAt={startedAt} />
			<group ref={ring} position={[0, RING_Y, 0]} rotation={[TILT, 0, -0.05]}>
				{photos.map((m, i) => (
					<PhotoCard
						key={m.id}
						moment={m}
						index={i}
						count={photos.length}
						geometry={geometry}
						control={control}
						onHover={onHover}
						onSelect={onSelect}
						startedAt={startedAt}
					/>
				))}
			</group>
			{!control.current?.reduced && <Sparkles count={40} scale={[11, 6, 6]} size={2.6} speed={0.25} opacity={0.45} color="#f7a47e" noise={0.6} />}
		</group>
	);
}

export default function HeroScene(props: SceneProps & { eventSource: React.RefObject<HTMLElement | null> }) {
	const { eventSource, ...rest } = props;
	const { ref, frameloop } = useFrameloopInView<HTMLDivElement>();
	return (
		<div ref={ref} className="absolute inset-0">
			<Canvas
				frameloop={frameloop}
				flat
				dpr={[1, COARSE ? 1.5 : 1.75]}
				camera={{ position: [0, 0, 11], fov: 32, near: 0.1, far: 60 }}
				gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
				eventSource={eventSource as React.RefObject<HTMLElement>}
				eventPrefix="client"
				onPointerMissed={() => rest.onHover(-1)}
				aria-hidden
			>
				<Suspense fallback={null}>
					<Rig {...rest} />
				</Suspense>
			</Canvas>
		</div>
	);
}
