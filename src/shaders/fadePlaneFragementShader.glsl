uniform vec3 uColor;
varying vec2 vUv;

void main() {
  float fade = smoothstep(0.0, 0.3, vUv.x) * (1.0 - smoothstep(0.7, 1.0, vUv.x));
  fade *= smoothstep(0.0, 0.3, vUv.y) * (1.0 - smoothstep(0.7, 1.0, vUv.y));
  gl_FragColor = vec4(uColor, fade * 0.3);
}