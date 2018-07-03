// [-0.5,-0.5]x[0.5,0.5] -> [xmin,xmax]x[ymin,ymax]
vec2 scale_forward(vec2 P, vec4 limits) {
    // limits = xmin,xmax,ymin,ymax
    P += vec2(.5, .5);
    P *= vec2(limits[1] - limits[0], limits[3] - limits[2]);
    P += vec2(limits[0], limits[2]);
    return P;
}

// [xmin,xmax]x[ymin,ymax] -> [-0.5, -0.5]x[0.5,0.5]
vec2 scale_inverse(vec2 P, vec4 limits) {
    P -= vec2(limits[0], limits[2]);
    P /= vec2(limits[1] - limits[0], limits[3] - limits[2]);
    return P - vec2(.5, .5);
}