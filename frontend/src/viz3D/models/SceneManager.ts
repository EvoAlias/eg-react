import { ECS } from './ECS';
import { World } from '../systems/World';
import { ChromosomeRenderSystem } from '../systems/ChromosomeRenderSystem';
import { GenomeTreeSystem } from '../systems/GenomeTree';
import HG19 from '../../model/genomes/hg19/hg19';
import { SceneManagerSystem } from '../systems/SceneManagerSystem';
import { GraphSystem } from '../systems/mathbox/GraphSystem';

export class SceneManager {
    scene: THREE.Scene;
    camera: THREE.Camera;
    renderer: THREE.Renderer;
    ecs: ECS;
    context: MathBox.Context;
    mathbox: MathBox.MathBox;

    constructor(public canvas: HTMLCanvasElement) {
        const mathbox = mathBox({
            camera: {
            },
            controls: {
              klass: THREE.OrbitControls,
            },
            plugins: ['core', 'controls', 'cursor'],
          });
          
          const three = mathbox.three;
          three.controls.maxDistance = 4;
          three.camera.position.set(2.5, 1, 2.5);
          three.renderer.setClearColor(new THREE.Color(0xEEEEEE), 1.0);
          
          const view = mathbox
          .set({
            focus: 1,
            scale: 720,
          })
          .cartesian({
            range: [[0, 1], [0, 1], [0, 1]],
            scale: [1, 1, 1],
          })
          
          const rez = 10;
          view.volume({
            id: "volume",
            width: rez,
            height: rez,
            depth: rez,
            items: 1,
            channels: 4,
            live: false,
            expr(emit: (...arg: any[]) => any, x: number, y: number, z: number){
                emit(x,y,z,1);
            }
          })
          view.point({
            // The neat trick: use the same data for position and for color!
            // We don't actually need to specify the points source since we just defined them
            // but it emphasizes what's going on.
            // The w component 1 is ignored as a position but used as opacity as a color.
            points: "#volume",
            colors: "#volume",
            // Multiply every color component in [0..1] by 255
            color: 0xffffff,
            size: 20,
          });
          
        // this.ecs = new ECS([
        //     new SceneManagerSystem(this),
        //     new GraphSystem(),
        //     // new GenomeTreeSystem(HG19),
        //     // new ChromosomeRenderSystem()
        // ]);

        // this.resizeCanvas();
        // // this.update();
        // this.render();
    }

    update() {
        setInterval(() => {
            this.ecs.update();
        }, 1000 / 30)
    }

    render() {
        const r = () => {
            requestAnimationFrame(r);
            this.context.frame();
            this.renderer.render(this.scene, this.camera);
        }
    }


    private resizeCanvas() {
        this.renderer.setSize(this.canvas.width, this.canvas.height);
    }
}