import * as d3 from 'd3';

export interface AxisOptions {
    tickCount: number;
    tickSize: number;
    tickPadding: number;
    title: string;
}

export interface ChartMargin {
    top: number;
    bottom: number;
    left: number;
    right: number;
}

export interface ChartOptions {
    width: number;
    height: number; 
    margin: Partial<ChartMargin>;
    xAxis: Partial<AxisOptions>;
    yAxis: Partial<AxisOptions>;
}

export interface ChartDatum {
    id: () => number;
    x: () => number;
    y: () => number;
}

export interface DatumProps {
    hiddenCol: string;
}

export class Chart {
    private nextCol = 1;

    margin: ChartMargin;
    width: number;
    height: number;

    mainCanvas: HTMLCanvasElement;
    hiddenCanvas: HTMLCanvasElement;

    chartBase: HTMLElement;
    chart: d3.Selection<HTMLElement, ChartDatum, null, undefined>;

    propsFor: {[id: number]: Partial<DatumProps>} = {};
    colorToDatum: {[col: string]: ChartDatum} = {};

    datums: ChartDatum[];

    x: d3.ScaleLinear<number, number>;
    y: d3.ScaleLinear<number, number>;

    xAxisOptions: AxisOptions;
    yAxisOptions: AxisOptions;

    constructor({
        width = 512,
        height = 512,
        xAxis = {},
        yAxis = {},
        margin = {},
    }: Partial<ChartOptions>) {
        this.margin = Object.assign({
            top: 20, right: 20, bottom: 30, left: 50
        }, margin)

        this.width = width - this.margin.left - this.margin.right;
        this.height = height - this.margin.top - this.margin.bottom;

        this.mainCanvas = document.createElement('canvas');
        this.hiddenCanvas = document.createElement('canvas');
        for (const canvas of [this.mainCanvas, this.hiddenCanvas]) {
            canvas.width = width;
            canvas.height = height;
        }
    
        this.chartBase = document.createElement('chart');
        this.chart = d3.select(this.chartBase);

        this.x = d3.scaleLinear()
            .range([this.margin.left, this.width])
        this.y = d3.scaleLinear()
            .range([this.height, 0])

        this.xAxisOptions = Object.assign({
            title: '',
            tickCount: 10,
            tickSize: 6,
            tickPadding: 3,
        }, xAxis);
        this.yAxisOptions = Object.assign({
            title: '',
            tickCount: 10,
            tickSize: 6,
            tickPadding: 3,
        }, yAxis);
    }

    clear(hidden?: boolean) {
        const canvas = this.getCanvas(hidden);
        const ctx = this.getContext(hidden);
        ctx.save();
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
    }

    data(data: ChartDatum[]) {
        this.datums = data;
        const xExtent = d3.extent(data, d => d.x());
        const yExtent = d3.extent(data, d => d.y());

        this.x.domain(xExtent);
        this.y.domain(yExtent);

        // join is the update
        const join = this.chart.selectAll('datum')
            .data(data);

        // enterSel is adding new elements
        const enterSel = join.enter()
            .append('datum')
            .attr('x', d => this.x(d.x()))
            .attr('y', d => this.y(d.y()))

        // merge enter and exist
        join
            .merge(enterSel)
            .attr('hiddenCol', (d) => {
                let props = this.propsFor[d.id()];
                if (!props) {
                    props = this.propsFor[d.id()] = {};
                }
                if (!props.hiddenCol) {
                    props.hiddenCol = this.genColor();
                    this.colorToDatum[props.hiddenCol] = d;
                }
                return props.hiddenCol
            })
        
        const exitSel = join.exit();

        this.drawReal();
        this.drawHidden();
    }
    
    draw(hidden?: boolean) {
        hidden ? this.drawHidden() : this.drawReal();
    }

    drawReal() {
        this.clear();
        const context = this.getContext();

        this.drawXAxis();
        this.drawYAxis();
        
        // draw markers
        const elements = this.chart.selectAll('datum');
        context.fillStyle = 'red';
        elements.each(drawMarker(context));
        // draw lines
        const line = d3.line<ChartDatum>()
            .x(d => this.x(d.x()))
            .y(d => this.y(d.y()))
            .curve(d3.curveStep)
            .context(context);

        context.strokeStyle = '#999';
        // context.lineWidth = 1.5;
        context.beginPath();
        line(this.datums);
        context.stroke();

    }

    drawHidden() {
        const context = this.getContext(true)
        // draw markers
        const elements = this.chart.selectAll('datum');
        context.fillStyle = 'red';
        elements.each(drawMarker(context));
    }

    drawXAxis(hidden?: boolean) {
        const ctx = this.getContext(hidden);
        ctx.save();

        const tickCount = this.xAxisOptions.tickCount;
        const tickSize = this.xAxisOptions.tickSize;
        const ticks = this.x.ticks(tickCount);
        const tickFormat = this.x.tickFormat();

        ctx.beginPath();
        ticks.forEach((d) => {
            ctx.moveTo(this.x(d), this.height);
            ctx.lineTo(this.x(d), this.height + tickSize);
        });
        ctx.strokeStyle = 'black';
        ctx.stroke();
        
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ticks.forEach((d) => {
            ctx.fillText(tickFormat(d), this.x(d), this.height + tickSize)
        });
        ctx.restore();
    }

    drawYAxis(hidden?: boolean) {
        const ctx = this.getContext(hidden);
        ctx.save();

        const tickCount = this.yAxisOptions.tickCount;
        const tickSize = this.yAxisOptions.tickSize;
        const tickPadding = this.yAxisOptions.tickPadding;
        const ticks = this.y.ticks(tickCount);
        const tickFormat = this.y.tickFormat(tickCount);
        const title = this.yAxisOptions.title;

        const xRange = this.x.range();
        // draw ticks
        ctx.beginPath();
        ticks.forEach(d => {
            ctx.moveTo(xRange[0], this.y(d));
            ctx.lineTo(xRange[0]-tickSize, this.y(d));
        })
        ctx.strokeStyle = 'black';
        ctx.stroke();
 
        // draw axis
        ctx.beginPath()
        ctx.moveTo(xRange[0] -tickSize, 0);
        ctx.lineTo(xRange[0] + 0.5, 0);
        ctx.lineTo(xRange[0] + 0.5, this.height);
        ctx.lineTo(xRange[0] -tickSize, this.height);
        ctx.strokeStyle = 'black';
        ctx.stroke();

        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ticks.forEach(d => {
            ctx.fillText(tickFormat(d), xRange[0] - tickSize - tickPadding, this.y(d))
        });

        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText(title, -10, 10);
        ctx.restore();

    }

    getCanvas(hidden? : boolean) {
        const canvas = hidden ? this.hiddenCanvas : this.mainCanvas;
        return canvas;
    }

    getCanvasSelection(hidden?: boolean) {
        const canvas = this.getCanvas(hidden);
        return d3.select(canvas);
    }

    getContext(hidden?: boolean) {
        const canvas = this.getCanvas(hidden);
        return canvas.getContext('2d');
    }

    getDatumAt(mouseX: number, mouseY: number) {
        const context = this.getContext(true);
        const col = context.getImageData(mouseX, mouseY, 1, 1).data;
        const colKey = `rgb(${col[0]},${col[1]},${col[2]})`;
        const datum = this.colorToDatum[colKey];
        console.log(datum);
        return datum;
    }

    private genColor() {

        const ret = [];
        if (this.nextCol < 16777215) {
    
            ret.push(this.nextCol & 0xff); // R 
            ret.push((this.nextCol & 0xff00) >> 8); // G 
            ret.push((this.nextCol & 0xff0000) >> 16); // B
            this.nextCol += 1;
    
        }
        const col = "rgb(" + ret.join(',') + ")";
        return col;
    }
}

function drawMarker(context: CanvasRenderingContext2D) {
    return function(this: any) {
        const width = 10;
        const height = 10;
        const hw = width / 2;
        const hh = height / 2;
        const node = d3.select(this);
        context.fillRect(
            +node.attr('x') - hw,
            +node.attr('y') - hh,
            width,
            height
        )
    }
}