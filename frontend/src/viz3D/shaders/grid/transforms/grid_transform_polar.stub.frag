const float M_PI = 3.14159265358979323846;

vec2 transform_forward(vec2 P) {
    // take in a (rho, theta)
    float x = P.x * cos(P.y);
    float y = P.x * sin(P.y);
    return vec2(x, y);
}

vec2 transform_inverse(vec2 P) {
    float rho = length(P);
    float theta = atan(P.y, P.x);
    if (theta < 0.0) {
        theta = 2.0 * M_PI + theta;
    }
    return vec2(rho, theta);
    return P;
}