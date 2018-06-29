import { System } from "../models/System";
import { Entity } from "../models/Entity";

import { SimpleGridShader } from "../shaders/simple_grid/grid";

import * as THREE from 'three';
import * as d3 from 'd3';
import { ChartComponent } from "../components/ChartComponent";
import { SceneManager } from "../models/SceneManager";
import { SceneManagerSystem } from "./SceneManagerSystem";
import { createCartesianShader } from "../shaders/grid/grid";
import { AnyLoader } from "three";

let nextCol = 1;
function genColor() {

    const ret = [];
    if (nextCol < 16777215) {

        ret.push(nextCol & 0xff); // R 
        ret.push((nextCol & 0xff00) >> 8); // G 
        ret.push((nextCol & 0xff0000) >> 16); // B
        nextCol += 1;

    }
    const col = "rgb(" + ret.join(',') + ")";
    return col;
}

export class ChartSystem extends System {
    sm: SceneManagerSystem;

    onECSInit() {
        // Shader Test

        // const sm = this.ecs.getSystem<SceneManagerSystem>(SceneManagerSystem);
        // this.sm = sm;
        // const geometry = new THREE.PlaneGeometry(10, 10, 10, 10);
        // const mat = createCartesianShader({
        //     domain: [-5, 5, -5, 5]
        // });
        // const plane = new THREE.Mesh(geometry, mat)
        // this.sm.sm.scene.add(plane);

        // Canvas test
        const data: any[] = [];
        d3.range(5000).forEach(v => data.push({ value: v }))


        const width = 750;
        const height = 400;
        const canvas = d3.select('#d3-test')
            .append('canvas')
            .attr('width', width)
            .attr('height', height);

        const hiddenCanvas = d3.select('#d3-test')
            .append('canvas')
            .style('display', 'none')
            .attr('width', width)
            .attr('height', height);

        const context = (canvas.node() as HTMLCanvasElement).getContext('2d') as CanvasRenderingContext2D;
        const hiddenContext = (hiddenCanvas.node() as HTMLCanvasElement).getContext('2d') as CanvasRenderingContext2D;
        console.log('context', canvas.node(), context, hiddenContext);
        const customBase = document.createElement('custom');
        const custom = d3.select(customBase);

        const groupSpacing = 4;
        const cellSpacing = 2;
        const offsetTop = height / 5;
        const cellSize = Math.floor((width - 11 * groupSpacing) / 100) - cellSpacing

        const colorToNode = {};

        databind(data);
        // draw(context, false);

        const t = d3.timer((elapsed) => {
            draw(context, false);
            if (elapsed > 300) {
                t.stop();
            }
        });

        canvas.on('mousemove', () => {
            draw(hiddenContext, true);

            const mouseX = d3.event.layerX || d3.event.offsetX;
            const mouseY = d3.event.layerY || d3.event.offsetY;

            const col = hiddenContext.getImageData(mouseX, mouseY, 1, 1).data;
            const colKey = `rgb(${col[0]},${col[1]},${col[2]})`;
            const nodeData = colorToNode[colKey];

            console.log(nodeData);

            if (nodeData) {
                // Show the tooltip only when there is nodeData found by the mouse
                d3.select('#tooltip')
                    .style('opacity', 0.8)
                    .style('top', d3.event.pageY + 5 + 'px')
                    .style('left', d3.event.pageX + 5 + 'px')
                    .html(nodeData.value);
            } else {
                // Hide the tooltip when the mouse doesn't find nodeData.

                d3.select('#tooltip').style('opacity', 0);

            }
        })

        function databind(data: any) {
            const thing: any = d3;
            const colorScale = d3.scaleSequential(thing.interpolateViridis)
                .domain(d3.extent(data, (d: number) => d));

            const join = custom.selectAll('custom.rect')
                .data(data);
            const enterSel = join.enter()
                .append('custom')
                .attr('class', 'rect')
                .attr('x', (d: any, i) => {
                    const x0 = Math.floor(i / 100) % 10;
                    const x1 = Math.floor(i % 10);
                    return groupSpacing * x0 + (cellSpacing + cellSize) * (x1 + x0 * 10);
                })
                .attr('y', (d, i) => {
                    const y0 = Math.floor(i / 1000);
                    const y1 = Math.floor(i % 100 / 10);
                    return groupSpacing * y0 + (cellSpacing + cellSize) * (y1 + y0 * 10);
                })
                .attr('width', 0)
                .attr('height', 0);

            join
                .merge(enterSel)
                .transition()
                .attr('width', cellSize)
                .attr('height', cellSize)
                .attr('fillStyle', (d) => colorScale(d as any) as any)
                .attr('fillStyleHidden', (data) => {
                    const d: any = data;
                    if (!d.hiddenCol) {
                        d.hiddenCol = genColor();
                        colorToNode[d.hiddenCol] = d;
                    }
                    return d.hiddenCol;
                })

            const exitSel = join.exit()
                .transition()
                .attr('width', 0)
                .attr('height', 0)
                .remove()
        }

        function draw(context: CanvasRenderingContext2D, hidden: boolean) {
            // context.clearRect(0, 0, width, height);
            const elements = custom.selectAll('custom.rect');
            elements.each(function drawEl(d, i) {
                const node = d3.select(this);
                context.fillStyle = hidden ? node.attr('fillStyleHidden') : node.attr('fillStyle');
                console.log(context.fillStyle);
                context.fillRect(+node.attr('x'), +node.attr('y'), +node.attr('width'), +node.attr('height'));

            })
        }
    }

    test(e: Entity) {
        return e.hasComponent(ChartComponent);
    }

    addEntity(e: Entity) {
        // const geometry = new THREE.PlaneGeometry(11, 11, 10, 10);
        // const mat = new THREE.MeshBasicMaterial({color:0xffff00, side: THREE.DoubleSide})
        // const plane = new THREE.Mesh(geometry, SimpleGridShader)
        // const background = new THREE.Mesh(geometry, mat);
        // background.position.z = -1;
        // e.gameObject.transform.add(plane);
        // e.gameObject.transform.add(background);
    }

}