// Line antialias area (usually 1 pixel)
uniform float u_antialias;
// Cartesian and projected limits as xmin,xmax,ymin,ymax
uniform vec4 u_limits1, u_limits2;
// Major and minor grid steps
uniform vec2 u_major_grid_step, u_minor_grid_step;
// Major and minor grid line widths (1.50 pixel, 0.75 pixel)
uniform float u_major_grid_width, u_minor_grid_width;
// Major grid line color
uniform vec4 u_major_grid_color;
// Minor grid line color
uniform vec4 u_minor_grid_color;
// Texture coordinates (from (-0.5,-0.5) to (+0.5,+0.5)
varying vec2 v_texcoord;

// = object.matrixWorld
uniform mat4 modelMatrix;

// = camera.matrixWorldInverse * object.matrixWorld
uniform mat4 modelViewMatrix;

// = camera.projectionMatrix
uniform mat4 projectionMatrix;

// = inverse transpose of modelViewMatrix
uniform mat3 normalMatrix;

