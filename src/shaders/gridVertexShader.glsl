varying vec2 vUv;

void main() {
  vUv = uv - 0.5;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}