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
    fillStyle: string;
    fillStyleHidden: string;
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

    propsFor: { [id: number]: Partial<DatumProps> } = {};
    colorToDatum: { [col: string]: ChartDatum } = {};

    datums: ChartDatum[];

    x: d3.ScaleLinear<number, number>;
    y: d3.ScaleLinear<number, number>;

    fontBase = 1000;                   // selected default height for canvas
    fontSize = 70;                     // default size for font

    uvX: d3.ScaleLinear<number, number>;
    uvY: d3.ScaleLinear<number, number>;

    xAxisOptions: AxisOptions;
    yAxisOptions: AxisOptions;

    onRepaint: () => void;

    constructor({
        width = 512,
        height = 512,
        xAxis = {},
        yAxis = {},
        margin = {},
    }: Partial<ChartOptions>) {
        this.margin = Object.assign({
            top: 0, right: 0, bottom: 0, left: 0
        }, margin)

        this.fontSize = height / 32;

        this.width = width - this.margin.left - this.margin.right;
        this.height = height - this.margin.top - this.margin.bottom;

        this.mainCanvas = document.createElement('canvas') as any;
        this.hiddenCanvas = document.createElement('canvas') as any;
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

        this.uvX = d3.scaleLinear()
            .domain([0, 1]).range([0, width]);
        this.uvY = d3.scaleLinear()
            .domain([0, 1]).range([height, 0]);

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

        // merge enter and update
        join
            .merge(enterSel)
            .attr('fillStyle', this.getPropsWithDefault('fillStyle', () => 'red'))
            .attr('fillStyleHidden', this.getPropsWithDefault('fillStyleHidden', () => this.genColor()))

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
        // const elements = this.chart.selectAll('datum');
        // elements.each(drawMarker(context));
        // draw lines
        const line = d3.line<ChartDatum>()
            .x(d => this.x(d.x()))
            .y(d => this.y(d.y()))
            .curve(d3.curveStep)
            .context(context);

        context.lineWidth = 10;
        context.strokeStyle = '#f99';
        context.fillStyle = '#f99';
        // context.lineWidth = 1.5;
        context.beginPath();
        line(this.datums);

        context.lineTo(this.x.range()[1], this.y.range()[0]);
        context.lineTo(0, this.y.range()[0]);
        context.closePath();
        context.fill();

        if (this.onRepaint) {
            this.onRepaint();
        }
    }

    drawHidden() {
        const context = this.getContext(true)
        // draw markers
        const elements = this.chart.selectAll('datum');
        elements.each(drawMarker(context, true));
    }

    drawCursor(x: number, y: number) {
        if (x < this.margin.left || x > this.width) {
            return;
        }
        if (y < this.margin.top || y > this.height) {
            return;
        }
        const ctx = this.getContext();
        ctx.save();
        ctx.strokeStyle = "black";
        ctx.beginPath();
        ctx.moveTo(this.margin.left, y);
        ctx.lineTo(this.width, y);
        ctx.moveTo(x, this.height);
        ctx.lineTo(x, 0);
        ctx.stroke();

        this.drawToolTip(x, y);

        ctx.restore();
    }

    drawToolTip(x: number, y: number) {
        const bisector = d3.bisector((d: ChartDatum) => d.x()).right;
        const index = bisector(this.datums, this.x.invert(x));
        console.log('datum index', index);
        const left = this.datums[index];
        const right = this.datums[index];

        const value = left ? left : right;

        const ctx = this.getContext();
        ctx.strokeStyle = "black";
        ctx.strokeRect(x, y, 100, 50);
        ctx.font = this.getFont();
        ctx.fillText(`value: ${value.y()}`, x + 20, y + 20);
    }

    drawXAxis(hidden?: boolean) {
        const ctx = this.getContext(hidden);
        ctx.save();
        ctx.strokeStyle = 'black';

        const tickCount = this.xAxisOptions.tickCount;
        const tickSize = this.xAxisOptions.tickSize;
        const ticks = this.x.ticks(tickCount);
        const tickFormat = this.x.tickFormat();

        ctx.beginPath();
        ticks.forEach((d) => {
            ctx.moveTo(this.x(d), this.height);
            ctx.lineTo(this.x(d), this.height + tickSize);
        });
        ctx.stroke();

        ctx.fillStyle = 'black';

        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.font = this.getFont();
        ticks.forEach((d) => {
            ctx.fillText(tickFormat(d), this.x(d), this.height + tickSize)
        });
        ctx.restore();
    }

    drawYAxis(hidden?: boolean) {
        const ctx = this.getContext(hidden);
        ctx.save();
        ctx.strokeStyle = 'black';

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
            ctx.lineTo(xRange[0] - tickSize, this.y(d));
        })
        ctx.stroke();

        // draw axis
        ctx.beginPath()
        ctx.moveTo(xRange[0] - tickSize, 0);
        ctx.lineTo(xRange[0] + 0.5, 0);
        ctx.lineTo(xRange[0] + 0.5, this.height);
        ctx.lineTo(xRange[0] - tickSize, this.height);
        ctx.strokeStyle = 'black';
        ctx.stroke();

        ctx.fillStyle = 'black';

        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.font = this.getFont();
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

    getCanvas(hidden?: boolean) {
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

    getDatumAtUV(uvX: number, uvY: number) {
        const x = this.uvX(uvX);
        const y = this.uvY(uvY);
        return this.getDatumAt(x, y);
    }


    getFont() {
        const ratio = this.fontSize / this.fontBase;   // calc ratio
        const size = this.mainCanvas.height * ratio;   // get font size based on current width
        return (size | 0) + 'px sans-serif'; // set font
    }

    getPropsWithDefault(propName: string, getDefault: (d: ChartDatum) => any) {
        return (d: ChartDatum) => {
            let props = this.propsFor[d.id()];
            if (!props) {
                props = this.propsFor[d.id()] = {};
            }
            if (!props[propName]) {
                props[propName] = getDefault(d);
                if (propName === 'fillStyleHidden') {
                    this.colorToDatum[props.fillStyleHidden] = d;
                }
            }
            return props[propName];
        }
    }

    getDatumAt(mouseX: number, mouseY: number) {
        const context = this.getContext(true);
        const col = context.getImageData(mouseX, mouseY, 1, 1).data;
        const colKey = `rgb(${col[0]},${col[1]},${col[2]})`;
        const datum = this.colorToDatum[colKey];
        return datum;
    }

    onMouseMoveUV(u: number, v: number) {
        const x = this.uvX(u);
        const y = this.uvY(v);
        this.onMouseMove(x, y);
    }

    onMouseMove(x: number, y: number) {
        console.log('drawing', x, y);
        this.drawReal();
        this.drawCursor(x, y);
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

function drawMarker(context: CanvasRenderingContext2D, hidden?: boolean) {
    return function (this: any) {
        const width = 10;
        const height = 10;
        const hw = width / 2;
        const hh = height / 2;
        const node = d3.select(this);
        const x = +node.attr('x') - hw;
        const y = +node.attr('y') - hh;
        // console.log('fillStyleHidden', node.attr('fillStyleHidden'))
        context.fillStyle = hidden ? node.attr('fillStyleHidden') : node.attr('fillStyle');
        context.fillRect(
            x,
            y,
            width,
            height
        )
        // context.fillText(`${Math.floor(x)}, ${Math.floor(y)}`, x, y - 20);
    }
}