varying vec2 vUv;
uniform float uSize;
uniform vec3 uLineColor;

float gridLine(float coord, float size) {
  float line = abs(fract(coord * size) - 0.5);
  return smoothstep(0.05, 0.0, line); // smooth lines
}

void main() {
  float dist = length(vUv) * 2.0;
  float alpha = smoothstep(1.0, 0.5, dist);

  float xLine = gridLine(vUv.x, uSize);
  float yLine = gridLine(vUv.y, uSize);
  float lineStrength = max(xLine, yLine);

  gl_FragColor = vec4(uLineColor, alpha * lineStrength * 0.1);
}