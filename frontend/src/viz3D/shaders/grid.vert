varying vec3 vertex;

void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    vertex = position.xyz;//vec3(position.x * 3.0, position.y * 6.0, position.z * 3.0);
}
