import * as THREE from "three";

/**
 * A photo printed on a curved card: cover-fit, rounded corners, a warm grade,
 * and a fade toward the backdrop with distance so the ring reads in depth.
 * Edges are alpha-tested with alpha-to-coverage, so cards stay in the opaque
 * pass and never need sorting against each other or the headline.
 */
export function createPhotoMaterial(map: THREE.Texture, planeAspect: number, fog: THREE.ColorRepresentation) {
	const img = map.image as { width: number; height: number } | undefined;
	return new THREE.ShaderMaterial({
		uniforms: {
			uMap: { value: map },
			uImgAspect: { value: img ? img.width / img.height : 0.75 },
			uPlaneAspect: { value: planeAspect },
			uRadius: { value: 0.075 },
			uHover: { value: 0 },
			uDim: { value: 0 },
			uReveal: { value: 0 },
			uFog: { value: new THREE.Color(fog) },
			uFogNear: { value: 9 },
			uFogFar: { value: 16 },
		},
		vertexShader: /* glsl */ `
			varying vec2 vUv;
			varying float vDepth;
			void main() {
				vUv = uv;
				vec4 mv = modelViewMatrix * vec4(position, 1.0);
				vDepth = -mv.z;
				gl_Position = projectionMatrix * mv;
			}
		`,
		fragmentShader: /* glsl */ `
			uniform sampler2D uMap;
			uniform float uImgAspect;
			uniform float uPlaneAspect;
			uniform float uRadius;
			uniform float uHover;
			uniform float uDim;
			uniform float uReveal;
			uniform vec3 uFog;
			uniform float uFogNear;
			uniform float uFogFar;
			varying vec2 vUv;
			varying float vDepth;

			float sdRoundBox(vec2 p, vec2 b, float r) {
				vec2 q = abs(p) - b + r;
				return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
			}

			void main() {
				vec2 uv = vUv;
				if (!gl_FrontFacing) uv.x = 1.0 - uv.x;

				vec2 s = vec2(1.0);
				if (uImgAspect > uPlaneAspect) s.x = uPlaneAspect / uImgAspect;
				else s.y = uImgAspect / uPlaneAspect;
				float zoom = mix(1.1, 1.0, uHover);
				vec2 cuv = (uv - 0.5) * s / zoom + 0.5;
				vec3 col = texture2D(uMap, cuv).rgb;

				float l = dot(col, vec3(0.299, 0.587, 0.114));
				col = mix(vec3(l), col, mix(0.9, 1.06, uHover));
				col *= mix(vec3(1.0), vec3(1.035, 1.0, 0.95), 0.6);
				col *= mix(1.0, 0.78, uDim);

				float f = smoothstep(uFogNear, uFogFar, vDepth);
				col = mix(col, uFog, f * 0.48 * (1.0 - uHover));

				vec2 p = (vUv - 0.5) * vec2(uPlaneAspect, 1.0);
				float d = sdRoundBox(p, vec2(uPlaneAspect * 0.5, 0.5), uRadius);
				float aa = fwidth(d) * 1.2;
				float alpha = (1.0 - smoothstep(-aa, aa, d)) * uReveal;
				if (alpha < 0.002) discard;
				gl_FragColor = vec4(col, alpha);
				#include <colorspace_fragment>
			}
		`,
		side: THREE.DoubleSide,
		transparent: false,
		alphaToCoverage: true,
	});
}

/** A plane bent onto a cylinder of radius r, so a card hugs the ring it sits on. */
export function bentPlane(width: number, height: number, r: number, segments = 32) {
	const g = new THREE.PlaneGeometry(width, height, segments, 1);
	const pos = g.attributes.position as THREE.BufferAttribute;
	for (let i = 0; i < pos.count; i++) {
		const x = pos.getX(i);
		const a = x / r;
		pos.setX(i, Math.sin(a) * r);
		pos.setZ(i, Math.cos(a) * r - r);
	}
	pos.needsUpdate = true;
	g.computeVertexNormals();
	return g;
}
