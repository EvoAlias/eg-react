// Antialiased stroke alpha coeff
float stroke_alpha(float distance, float linewidth, float antialias)
{
    float t = linewidth/2.0 - antialias;
    float signed_distance = distance;
    float border_distance = abs(signed_distance) - t;
    float alpha = border_distance/antialias;
    alpha = exp(-alpha*alpha);
    if( border_distance > (linewidth/2.0 + antialias) )
    return 0.0;
    else if( border_distance < 0.0 )
    return 1.0;
    else
    return alpha;
}

// compute nearest tick from a (normalized) t value
// vmin is the u_limit min, vmax is the ulimit max.
// step is the minor gird line distance
float get_tick(float t, float vmin, float vmax, float step) {
    // floor((vmin + step/2.0) / step) gets the index of the first 
    // minor tick.
    // we multiply by step to get the distance that tick is actually at
    float first_tick = floor((vmin + step/2.0)/ step) * step;
    // Use the same trick as above to get distance to last tick
    float last_tick = floor((vmax + step/2.0)/ step) * step;
    // Get current position
    float tick = vmin + t*(vmax-vmin);
    
    // clamp ticks to vmin or vmax. This creates an outline of the
    // cartesian grid
    if (tick < (vmin + (first_tick - vmin) / 2.0)) {
        return vmin;
    }
    if (tick > (last_tick + (vmax-last_tick)/2.0)) {
        return vmax;
    }

    // return the nearest tick
    // Use the trick for first_tick/last_tick
    tick += step/2.0;
    tick = floor(tick/step)*step;
    // clamp to within bounds incase t is beyond [0, 1]
    return min(max(vmin, tick), vmax);

}

// Compute the distance (in screen coordinates) between A and B
// Assume a monitor that is 800 x 640
float screen_distance(vec4 A, vec4 B) {
    vec4 mid = mix(A, B, 0.5);
    mid = projectionMatrix * viewMatrix * modelMatrix * mid;
    mid /= mid.w;
    float camera_dist = distance(cameraPosition, mid.xyz);

    vec2 iResolution = vec2(1920, 1080);// * camera_dist;
    vec4 pA = projectionMatrix * viewMatrix * modelMatrix * A;
    pA /= pA.w;
    pA.xy = pA.xy * iResolution / 2.0;
    
    vec4 pB = projectionMatrix * viewMatrix * modelMatrix * B;
    pB /= pB.w;
    pB.xy = pB.xy * iResolution / 2.0;
    
    return length(pA.xy - pB.xy);
}