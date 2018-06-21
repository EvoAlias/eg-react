// declare const MathBox: MathboxLib.MathBox;
// declare var gTest: string;
declare var mathBox: (options?: any) => MathBox.MathBox;

declare namespace MathBox {
    // interface MathBox {
    //     Context: Context;
    //     mathBox: mathBox;
    // }
    export class Context {
        api: MathBox;
        constructor(renderer: any, scene: any, camera: any);
        init(): this;
        destroy(): void;
        frame(): void;
    }

    interface ArrayOptions {
        items?: number;
        channels?: number;
        live?: boolean;
        id?: string;
    }
    type AxisType = number | string;

    interface AxisOptions {
        axis?: AxisType;
        detail?: number;
        width?: number;
    }
    interface CameraOptions {
        // allow user to move camera
        proxy?: boolean;
        position: number[];
    }
    interface CartesianOptions {
        range: number[][];
        scale: number[];
    }

    interface GridOptions {
        axes?: string;
        width?: number;
        divideX?: number;
        divideY?: number;
        opacity?: number;
        zBias?: number;
    }

    type EmitCallback = (x?: number, y?: number, z?: number, w?: number) => void;
    type Expression = (emit: EmitCallback, x: number, i: number, t: number) => void;

    interface IntervalOptions {
        id?: string;
        width?: number;
        expr?: Expression;
        channels?: number;
    }

    interface LabelOptions {
        color?: any;
        offset?: number[];
    }

    interface LineOptions {
        points?: string;
        color?: number;
        width?: number;
    }

    interface PointOptions {
        points?: any;
        colors?: any;
        color?: any;
        size?: number;
    }

    interface VolumeOptions {
        id?: string;
        width?: number;
        height?: number;
        depth?: number;
        items?: number;
        channels?: number;
        live?: boolean;
        expr?: Expression;
    }
    
    interface RepeatOptions {
        items?: number;
    }

    interface SetOptions {
        [prop: string]: any;
    }

    interface ScaleOptions {
        axis?: string;
        divide?: number;
        origin?: number[];
    }

    interface SpreadOptions {
        unit?: string;
        alignItems?: string;
        items?: number[];
    }

    interface SwizzleOptions {
        order?: string;
    }

    interface TextOptions {
        live?: boolean;
        data?: any;
    }

    interface TickOptions {
        classes?: string[];
        width?: number;
    }

    interface TransformOptions {
        scale?: number[];
        position?: number[];
    }

    interface VectorOptions {
        color?: any;
    }

    export function mathBox(options: any): MathBox;

    export class MathBox {
        three: any;
        fallback: any;

        array(options?: ArrayOptions): this;
        axis(options?: AxisOptions): this;
        camera(options?: CameraOptions): this;
        cartesian(options?: CartesianOptions): this;
        end(): this;
        grid(options?: GridOptions): this;
        interval(options?: IntervalOptions): this;
        label(options?: LabelOptions): this;
        line(options?: LineOptions): this;
        point(options?: PointOptions): this;
        print(): this;
        repeat(options?: RepeatOptions): this;
        scale(options?: ScaleOptions): this;
        select(selector: string): this;
        set(prop: string, data: any): this;
        set(options?: SetOptions): this;
        spread(options?: SpreadOptions): this;
        swizzle(options?: SwizzleOptions): this;
        text(options?: TextOptions): this;
        ticks(options?: TickOptions): this;
        transform(options?: TransformOptions): this; 
        vector(options?: VectorOptions): this;  
        volume(options?: VolumeOptions): this;
    }
}
 