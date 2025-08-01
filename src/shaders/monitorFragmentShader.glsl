uniform sampler2D uTextureA;
uniform sampler2D uTextureB;
uniform float uBrightness;
uniform float uContrast;
uniform float uMix;
uniform float uAberrationAmount; // Add this uniform in JS
varying vec2 vUv;

void main() {
  // Chromatic offset vector (can be radial, here it's a fixed offset)
  vec2 offset = vec2(uAberrationAmount);

  // Sample each channel at slightly different UVs
  vec4 texA = vec4(
    texture2D(uTextureA, vUv + offset).r,   // Red
    texture2D(uTextureA, vUv).g,            // Green
    texture2D(uTextureA, vUv - offset).b,   // Blue
    1.0
  );

  vec4 texB = vec4(
    texture2D(uTextureB, vUv + offset).r,
    texture2D(uTextureB, vUv).g,
    texture2D(uTextureB, vUv - offset).b,
    1.0
  );

  vec4 mixed = mix(texA, texB, uMix);

  // Apply brightness and contrast
  mixed.rgb = (mixed.rgb - 0.5) * uContrast + 0.5;
  mixed.rgb *= uBrightness;

  gl_FragColor = mixed;
}