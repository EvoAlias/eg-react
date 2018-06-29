import * as THREE from 'three';
import { GridVertCode, GridFragCartesianCode } from './grid_imports';

interface CartesianOptions {
    antialias?: number;
    // xmin,xmax,ymin,ymax
    domain: [number, number, number, number];
    // steps for x and y axis
    major_step?: [number, number];
    // steps for x and y minor axis
    minor_step?: [number, number];
    // width of major grid line in pixels
    major_width?: number;
    // width of minor grid line in pixels
    minor_width?: number;

    major_grid_color?: [number, number, number, number];
    minor_grid_color?: [number, number, number, number];
}

export function createCartesianShader({
    antialias = 1 / 1000,
    domain,
    major_step = [1, 1],
    minor_step = [0.5, 0.5],
    major_width = 1.5 / 1000,
    minor_width = 0.75 / 1000,
    major_grid_color = [1.0, 0, 0, 1],
    minor_grid_color = [0, 1.0, 0, 1],
}: CartesianOptions ): THREE.ShaderMaterial
{
    const u_antialias = {value: antialias};
    const u_limits1 = new THREE.Uniform(
        new THREE.Vector4(...[domain[0] - 0.1, domain[1] + 0.1, domain[2] - 0.1, domain[3] + 0.1]));
    const u_limits2 = new THREE.Uniform(new THREE.Vector4(...domain));
    const u_major_grid_step = {value: major_step};
    const u_minor_grid_step = {value: minor_step};
    const u_major_grid_width = {value: major_width};
    const u_minor_grid_width = {value: minor_width};
    const u_major_grid_color = new THREE.Uniform(new THREE.Vector4(...major_grid_color));
    const u_minor_grid_color = new THREE.Uniform(new THREE.Vector4(...minor_grid_color))

    const uniforms = {
        u_antialias,
        u_limits1,
        u_limits2,
        u_major_grid_step,
        u_minor_grid_step,
        u_major_grid_width,
        u_minor_grid_width,
        u_major_grid_color,
        u_minor_grid_color,
    };

    const material = new THREE.ShaderMaterial({
        uniforms,
        vertexShader: GridVertCode,
        fragmentShader: GridFragCartesianCode
    });
    return material;
}