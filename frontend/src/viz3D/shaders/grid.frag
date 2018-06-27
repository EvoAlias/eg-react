#extension GL_OES_standard_derivatives : enable

varying vec3 vertex;

void main() {
    vec2 coord = vertex.xy;
    float feather = 0.0;
    vec2 grid = abs(fract(coord - feather) - feather) / fwidth(coord);
    float line = min(grid.x, grid.y);

    gl_FragColor = vec4(vec3(1.0 - min(line, 1.0)), 0.5);
}