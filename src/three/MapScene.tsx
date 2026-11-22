import { Html, QuadraticBezierLine } from "@react-three/drei";
import { Canvas, type ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { geo, homes } from "@/lib/data";
import { project } from "@/lib/geo";
import { useFrameloopInView } from "@/three/useFrameloopInView";

const LAND_DEPTH = 0.07;
const SUN = new THREE.Color("#f1592a");
const EMBER = new THREE.Color("#a8360d");
const MUTED = new THREE.Color("#cbbfb1");
const BG = "#f4ece1";
const COARSE = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

export type MapCamera = { target: readonly number[]; distance: number; tilt: number };

export type MapControl = {
	camera: MapCamera;
	/** Slugs to light up; null lights every home. */
	highlight: Set<string> | null;
	focus: string | null;
	place: { lat: number; lng: number; label: string } | null;
	nearest: string[];
	reduced: boolean;
};

function shapeFrom(ring: [number, number][]) {
	const s = new THREE.Shape();
	ring.forEach(([x, y], i) => (i === 0 ? s.moveTo(x, y) : s.lineTo(x, y)));
	return s;
}

function Land() {
	const { land, neighbour } = useMemo(() => {
		const build = (rings: [number, number][][], depth: number, bevel: boolean) => {
			const parts = rings.map((r) => {
				const g = new THREE.ExtrudeGeometry(shapeFrom(r), {
					depth,
					bevelEnabled: bevel,
					bevelThickness: 0.012,
					bevelSize: 0.01,
					bevelSegments: 2,
					curveSegments: 1,
				});
				return g;
			});
			const merged = mergeGeometries(parts, false);
			for (const p of parts) p.dispose();
			merged.rotateX(-Math.PI / 2);
			merged.computeVertexNormals();
			return merged;
		};
		return { land: build(geo.land, LAND_DEPTH, true), neighbour: build(geo.neighbour, 0.02, false) };
	}, []);
	useEffect(
		() => () => {
			land.dispose();
			neighbour.dispose();
		},
		[land, neighbour],
	);
	return (
		<group>
			<mesh geometry={land} castShadow receiveShadow>
				<meshStandardMaterial color="#fbf6ef" roughness={0.92} metalness={0} />
			</mesh>
			<mesh geometry={neighbour} receiveShadow>
				<meshStandardMaterial color="#ece2d5" roughness={1} />
			</mesh>
		</group>
	);
}

function SeaDots() {
	const geometry = useMemo(() => {
		const pts: number[] = [];
		for (let x = -9; x <= 9; x += 0.22) for (let z = -9; z <= 9; z += 0.22) pts.push(x, 0.002, z);
		const g = new THREE.BufferGeometry();
		g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
		return g;
	}, []);
	useEffect(() => () => geometry.dispose(), [geometry]);
	return (
		<points geometry={geometry}>
			<pointsMaterial color="#b9ab9c" size={1.6} sizeAttenuation={false} transparent opacity={0.55} depthWrite={false} />
		</points>
	);
}

/** A little house: walls and a pitched roof, standing on the map. */
function houseGeometry() {
	const w = 0.036;
	const wall = 0.05;
	const roof = 0.03;
	const s = new THREE.Shape();
	s.moveTo(-w, 0);
	s.lineTo(w, 0);
	s.lineTo(w, wall);
	s.lineTo(0, wall + roof);
	s.lineTo(-w, wall);
	s.closePath();
	const g = new THREE.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 1 });
	g.translate(0, 0, -0.025);
	return g;
}

function Pins({
	control,
	onHover,
	onSelect,
}: {
	control: React.RefObject<MapControl>;
	onHover: (slug: string | null) => void;
	onSelect: (slug: string) => void;
}) {
	const pins = useRef<THREE.InstancedMesh>(null);
	const hits = useRef<THREE.InstancedMesh>(null);
	const geometry = useMemo(houseGeometry, []);
	const scales = useRef(homes.map(() => 0));
	const colors = useRef(homes.map(() => SUN.clone()));
	const dummy = useMemo(() => new THREE.Object3D(), []);
	const start = useRef(performance.now());
	const hovered = useRef<number | null>(null);
	const armed = useRef<number | null>(null);

	useEffect(() => {
		const h = hits.current;
		if (!h) return;
		homes.forEach((home, i) => {
			dummy.position.set(home.x, LAND_DEPTH + 0.05, -home.y);
			dummy.scale.setScalar(1);
			dummy.updateMatrix();
			h.setMatrixAt(i, dummy.matrix);
		});
		h.instanceMatrix.needsUpdate = true;
		return () => geometry.dispose();
	}, [dummy, geometry]);

	useFrame((state, dt) => {
		const m = pins.current;
		const c = control.current;
		if (!m || !c) return;
		const t = (performance.now() - start.current) / 1000;
		const k = 1 - Math.exp(-dt * 10);
		const camAngle = Math.atan2(state.camera.position.x - 0, state.camera.position.z - 0);
		// Pins keep a similar size on screen whether the camera is over the whole country or one county.
		const zoom = THREE.MathUtils.clamp(state.camera.position.y / 4.2, 0.5, 1.2);
		homes.forEach((home, i) => {
			const lit = !c.highlight || c.highlight.has(home.slug);
			const isFocus = c.focus === home.slug || hovered.current === i;
			const isNear = c.nearest.includes(home.slug);
			// Pins drop in from the south-west to the north-east, 8ms apart.
			const order = (home.x - home.y) * 0.5 + 2;
			const appear = c.reduced ? 1 : THREE.MathUtils.clamp((t - 0.2 - order * 0.12) / 0.5, 0, 1);
			const target = (isFocus ? 2.1 : isNear ? 1.55 : lit ? 1.15 : 0.62) * (1 - (1 - appear) ** 3);
			scales.current[i] += (target - scales.current[i]) * k;
			const col = isFocus || isNear ? EMBER : lit ? SUN : MUTED;
			colors.current[i].lerp(col, k);
			const s = scales.current[i];
			const lift = isFocus ? 0.03 + Math.sin(t * 4) * 0.008 : 0;
			dummy.position.set(home.x, LAND_DEPTH + lift + (1 - appear) * 0.4, -home.y);
			dummy.rotation.set(0, camAngle, 0);
			dummy.scale.setScalar(Math.max(0.0001, s * zoom));
			dummy.updateMatrix();
			m.setMatrixAt(i, dummy.matrix);
			m.setColorAt(i, colors.current[i]);
		});
		m.instanceMatrix.needsUpdate = true;
		if (m.instanceColor) m.instanceColor.needsUpdate = true;
	});

	return (
		<group>
			<instancedMesh ref={pins} args={[geometry, undefined, homes.length]} castShadow frustumCulled={false}>
				<meshStandardMaterial roughness={0.5} metalness={0} toneMapped={false} />
			</instancedMesh>
			<instancedMesh
				ref={hits}
				args={[undefined, undefined, homes.length]}
				onPointerMove={(e: ThreeEvent<PointerEvent>) => {
					e.stopPropagation();
					if (e.instanceId === undefined) return;
					if (hovered.current !== e.instanceId) {
						hovered.current = e.instanceId;
						onHover(homes[e.instanceId].slug);
						document.body.style.cursor = "pointer";
					}
				}}
				onPointerOut={(e: ThreeEvent<PointerEvent>) => {
					if (e.pointerType !== "mouse") return;
					hovered.current = null;
					onHover(null);
					document.body.style.cursor = "";
				}}
				onClick={(e: ThreeEvent<MouseEvent>) => {
					e.stopPropagation();
					if (e.instanceId === undefined) return;
					// Touch: the first tap names the home, a second tap on it opens its page.
					const touch = ((e.nativeEvent as PointerEvent).pointerType ?? "mouse") !== "mouse";
					if (touch && armed.current !== e.instanceId) {
						armed.current = e.instanceId;
						hovered.current = e.instanceId;
						onHover(homes[e.instanceId].slug);
						return;
					}
					onSelect(homes[e.instanceId].slug);
				}}
			>
				<sphereGeometry args={[0.075, 8, 6]} />
				<meshBasicMaterial transparent opacity={0} depthWrite={false} />
			</instancedMesh>
		</group>
	);
}

function Tooltip({ control }: { control: React.RefObject<MapControl> }) {
	const ref = useRef<THREE.Group>(null);
	const current = useRef<string | null>(null);
	const htmlRef = useRef<HTMLDivElement>(null);
	useFrame(() => {
		const slug = control.current?.focus ?? null;
		const g = ref.current;
		if (!g) return;
		const home = slug ? homes.find((h) => h.slug === slug) : null;
		if (home) g.position.set(home.x, LAND_DEPTH + 0.2, -home.y);
		if (htmlRef.current) {
			htmlRef.current.style.opacity = home ? "1" : "0";
			if (slug !== current.current) {
				current.current = slug;
				htmlRef.current.dataset.slug = slug ?? "";
				const nameEl = htmlRef.current.querySelector("[data-name]");
				const metaEl = htmlRef.current.querySelector("[data-meta]");
				if (home && nameEl && metaEl) {
					nameEl.textContent = home.name;
					metaEl.textContent = `${home.town} · ${home.careTypes.length} kinds of care`;
				}
			}
		}
	});
	return (
		<group ref={ref}>
			<Html center zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
				<div
					ref={htmlRef}
					className="w-max -translate-y-6 whitespace-nowrap rounded-2xl bg-ink px-4 py-2.5 text-paper opacity-0 shadow-[0_14px_40px_-14px_rgb(0_0_0/0.55)] transition-opacity duration-150"
				>
					<p data-name className="type-label" />
					<p data-meta className="text-[0.875rem] text-paper/75" />
				</div>
			</Html>
		</group>
	);
}

function PlaceMarker({ place, nearest }: { place: MapControl["place"]; nearest: string[] }) {
	const ring = useRef<THREE.Mesh>(null);
	const pos = place ? project(place.lat, place.lng) : null;
	useFrame((state) => {
		if (!ring.current) return;
		const t = state.clock.elapsedTime;
		const p = (t % 1.8) / 1.8;
		ring.current.scale.setScalar(0.4 + p * 1.6);
		(ring.current.material as THREE.MeshBasicMaterial).opacity = (1 - p) * 0.6;
	});
	if (!pos) return null;
	const near = nearest.slice(0, 3).map((slug) => homes.find((h) => h.slug === slug)).filter((h) => h !== undefined);
	const from: [number, number, number] = [pos[0], LAND_DEPTH + 0.01, -pos[1]];
	return (
		<group>
			<group position={from}>
				<mesh rotation={[-Math.PI / 2, 0, 0]}>
					<circleGeometry args={[0.035, 32]} />
					<meshBasicMaterial color="#2b2321" toneMapped={false} />
				</mesh>
				<mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
					<ringGeometry args={[0.05, 0.065, 48]} />
					<meshBasicMaterial color="#2b2321" transparent opacity={0.5} toneMapped={false} />
				</mesh>
				<Html center position={[0, 0.16, 0]} zIndexRange={[19, 0]} style={{ pointerEvents: "none" }}>
					<div className="w-max whitespace-nowrap rounded-full bg-paper px-3 py-1.5 text-[0.875rem] font-semibold text-ink shadow-[0_0_0_1px_rgb(43_35_33/0.1),0_8px_24px_-10px_rgb(43_35_33/0.4)]">
						{place?.label}
					</div>
				</Html>
			</group>
			{near.map((h) => {
				const to: [number, number, number] = [h.x, LAND_DEPTH + 0.06, -h.y];
				const mid: [number, number, number] = [(from[0] + to[0]) / 2, LAND_DEPTH + 0.35, (from[2] + to[2]) / 2];
				return <QuadraticBezierLine key={h.slug} start={from} end={to} mid={mid} color="#a8360d" lineWidth={1.6} dashed dashSize={0.03} gapSize={0.02} />;
			})}
		</group>
	);
}

const CITIES: [string, number, number][] = [
	["Leicester", 52.636, -1.133],
	["Lincoln", 53.234, -0.538],
	["Nottingham", 52.954, -1.158],
	["Birmingham", 52.486, -1.89],
	["Hull", 53.745, -0.336],
	["Norwich", 52.63, 1.297],
	["Bristol", 51.455, -2.588],
	["Manchester", 53.48, -2.242],
	["London", 51.507, -0.128],
];

/** A few cities for bearings. They fade with distance so the close-ups stay clean. */
function Cities() {
	const refs = useRef<(HTMLSpanElement | null)[]>([]);
	const v = useMemo(() => new THREE.Vector3(), []);
	useFrame(({ camera }) => {
		CITIES.forEach(([, lat, lng], i) => {
			const el = refs.current[i];
			if (!el) return;
			const [x, y] = project(lat, lng);
			const d = camera.position.distanceTo(v.set(x, 0, -y));
			el.style.opacity = String(THREE.MathUtils.clamp((d - 2.2) / 1.6, 0, 1) * THREE.MathUtils.clamp((11 - d) / 3, 0, 1));
		});
	});
	return (
		<>
			{CITIES.map(([name, lat, lng], i) => {
				const [x, y] = project(lat, lng);
				return (
					<Html key={name} position={[x, LAND_DEPTH + 0.005, -y]} center zIndexRange={[10, 0]} style={{ pointerEvents: "none" }}>
						<span
							ref={(el) => {
								refs.current[i] = el;
							}}
							className="block w-max translate-y-3 whitespace-nowrap text-[0.8125rem] font-semibold tracking-[0.01em] text-stone/80"
						>
							{name}
						</span>
					</Html>
				);
			})}
		</>
	);
}

function CameraRig({ control }: { control: React.RefObject<MapControl> }) {
	const target = useRef(new THREE.Vector3(-0.3, 0, 0.35));
	const dist = useRef(9);
	const tilt = useRef(1.0);
	const { camera, size } = useThree();
	useFrame((state, dt) => {
		const c = control.current;
		if (!c) return;
		const k = c.reduced ? 1 : 1 - Math.exp(-dt * 2.2);
		let goal = c.camera;
		if (c.place) {
			const [x, y] = project(c.place.lat, c.place.lng);
			goal = { target: [x, 0, -y], distance: 2.6, tilt: 0.88 };
		}
		// Narrow, portrait viewports need to stand further back to see the same area.
		const aspect = size.width / Math.max(1, size.height);
		const far = aspect < 1 ? 1.45 / Math.max(0.55, aspect) : 1;
		target.current.lerp(new THREE.Vector3(goal.target[0], goal.target[1], goal.target[2]), k);
		dist.current += (goal.distance * far - dist.current) * k;
		tilt.current += (goal.tilt - tilt.current) * k;
		const px = c.reduced ? 0 : state.pointer.x * 0.06;
		const py = c.reduced ? 0 : state.pointer.y * 0.04;
		const phi = tilt.current - py;
		const theta = -0.18 + px;
		camera.position.set(
			target.current.x + dist.current * Math.sin(phi) * Math.sin(theta),
			target.current.y + dist.current * Math.cos(phi),
			target.current.z + dist.current * Math.sin(phi) * Math.cos(theta),
		);
		camera.lookAt(target.current);
	});
	return null;
}

export default function MapScene({
	control,
	onHover,
	onSelect,
	eventSource,
	place,
	nearest,
}: {
	place: MapControl["place"];
	nearest: string[];
	control: React.RefObject<MapControl>;
	onHover: (slug: string | null) => void;
	onSelect: (slug: string) => void;
	eventSource?: React.RefObject<HTMLElement | null>;
}) {
	const { ref, frameloop } = useFrameloopInView<HTMLDivElement>();
	return (
		<div ref={ref} className="absolute inset-0">
			<Canvas
				frameloop={frameloop}
				shadows={COARSE ? false : "percentage"}
				flat
				dpr={[1, COARSE ? 1.5 : 1.75]}
				camera={{ position: [0, 6, 6], fov: 30, near: 0.05, far: 80 }}
				gl={{ antialias: true, alpha: false }}
				eventSource={eventSource as React.RefObject<HTMLElement> | undefined}
				eventPrefix={eventSource ? "client" : undefined}
				aria-hidden
			>
				<color attach="background" args={[BG]} />
				<fog attach="fog" args={[BG, 9, 22]} />
				<hemisphereLight args={["#fff6ec", "#e9dccb", 1.15]} />
				<directionalLight
					position={[3.5, 6, 4]}
					intensity={1.6}
					color="#fff1e2"
					castShadow
					shadow-mapSize={[2048, 2048]}
					shadow-camera-left={-5}
					shadow-camera-right={5}
					shadow-camera-top={5}
					shadow-camera-bottom={-5}
					shadow-bias={-0.0004}
					shadow-radius={6}
				/>
				<mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.001, 0]}>
					<planeGeometry args={[40, 40]} />
					<shadowMaterial opacity={0.16} />
				</mesh>
				<SeaDots />
				<Land />
				<Pins control={control} onHover={onHover} onSelect={onSelect} />
				<PlaceMarker place={place} nearest={nearest} />
				<Cities />
				<Tooltip control={control} />
				<CameraRig control={control} />
			</Canvas>
		</div>
	);
}
