// Transform with polar example
// transform_inverse takes a x,y on the grid, and it transforms to polar coordinates (rho, theta)
// transform_forward takes a (rho, theta) and transforms it into x,y

// consider u_limits1 the domain nad u_limits2 the range
//   [domain, domain]
//  /                \
// [range,        range]

void main()
{
    // NP1 is in uv coordinates
    vec2 NP1 = v_texcoord - vec2(0.5, 0.5);
    // P1 is position within grid
    vec2 P1 = scale_forward(NP1, u_limits1);
    // P2 is in our projected system
    vec2 P2 = transform_inverse(P1);

    // Test if we are within limits
    // dont discard fragment because we may need to draw the border
    bvec2 outside = bvec2(false);
    if(P2.x < u_limits2[0]) outside.x = true;
    if(P2.x > u_limits2[1]) outside.x = true;
    if(P2.y < u_limits2[2]) outside.y = true;
    if(P2.y > u_limits2[3]) outside.y = true;

    // Convert projection a point in u_limit2
    vec2 NP2 = scale_inverse(P2, u_limits2);
    vec2 P;
    float tick;
    vec2 v_size = vec2(800.0, 640.0);

    // Major tick, X axis
    // get distance to neareast tick
    tick = get_tick(NP2.x + 0.5, u_limits2[0], u_limits2[1], u_major_grid_step[0]);
    // get position in grid
    P = transform_forward(vec2(tick, P2.y));
    // get position in uv
    P = scale_inverse(P, u_limits1);
    // find distance to tick
    // float Mx = length(v_size * (NP1 - P));
    // float Mx = screen_distance(vec4(NP1,0,1), vec4(P,0,1));
    float Mx = distance(vec4(NP1,0,1), vec4(P,0,1));

    // do the above for everything else

    // Minor tick, X axis
    tick = get_tick(NP2.x+.5, u_limits2[0], u_limits2[1], u_minor_grid_step[0]);
    P = transform_forward(vec2(tick,P2.y));
    P = scale_inverse(P, u_limits1);
    // float mx = length(v_size * (NP1 - P));
    // Here we assume the quad is contained in the XZ plane
    // float mx = length(v_size * (NP1 - P));
    // float mx = screen_distance(vec4(NP1,0,1), vec4(P,0,1));
    float mx = distance(vec4(NP1,0,1), vec4(P,0,1));
    // Major tick, Y axis
    tick = get_tick(NP2.y+.5, u_limits2[2], u_limits2[3], u_major_grid_step[1]);
    P = transform_forward(vec2(P2.x,tick));
    P = scale_inverse(P, u_limits1);
    // float My = length(v_size * (NP1 - P));
    // Here we assume the quad is contained in the XZ plane
    // float My = length(v_size * (NP1 - P));
    // float My = screen_distance(vec4(NP1,0,1), vec4(P,0,1));
    float My = distance(vec4(NP1,0,1), vec4(P,0,1));
    // Minor tick, Y axis
    tick = get_tick(NP2.y+.5, u_limits2[2], u_limits2[3], u_minor_grid_step[1]);
    P = transform_forward(vec2(P2.x,tick));
    P = scale_inverse(P, u_limits1);
    // float my = length(v_size * (NP1 - P));
    // Here we assume the quad is contained in the XZ plane
    // float my = length(v_size * (NP1 - P));
    // float my = screen_distance(vec4(NP1,0,1), vec4(P,0,1));
    float my = distance(vec4(NP1,0,1), vec4(P,0,1));

    // determin major or minor
    float M = min(Mx,My);
    float m = min(mx,my);

    // Finally check if index is out of bounds
    if (outside.x && outside.y) {
        // discard if outside major grid lines
        if (Mx > 0.5 * (u_major_grid_width + u_antialias)) {
            discard;
        } else if (My > 0.5 * (u_major_grid_width + u_antialias)) {
            discard;
        } else {
            // max for corner antialiasing
            M = max(Mx, My);
        }
    } else if (outside.x) {
        if (Mx > 0.5 * (u_major_grid_width + u_antialias)) {
            discard;
        } else {
            M = m = Mx;
        }
    } else if (outside.y) {
        if (My > 0.5 * (u_major_grid_width + u_antialias)) {
            discard;
        } else {
            M = m = My;
        }
    }

    // Mix major/minor colors to get dominate color
    vec4 color = u_major_grid_color;
    float alpha1 = stroke_alpha(M, u_major_grid_width, u_antialias);
    float alpha2 = stroke_alpha(m, u_minor_grid_width, u_antialias);
    float alpha = alpha1;
    if (alpha2 > alpha1 * 1.5) {
        alpha = alpha2;
        color = u_minor_grid_color;
    }
    // vec4 bg_color = vec4(0.0, 0.0, 0.0, 1.0);
    // gl_FragColor = mix(color, bg_color, alpha);

    // we could have a texture for free
    // vec4 texcolor = texture2D(u_texture, vec2(NP2.x, 1.0-NP2.y));
    // gl_FragColor = mix(texcolor, color, alpha);
    gl_FragColor = mix(vec4(1.0, 1.0, 1.0, 1.0), color, alpha);
}