import React from 'react';
import { Group } from '@visx/group';
import { Line } from '@visx/shape';
import { scaleLinear } from '@visx/scale';
import { HeatmapRect } from '@visx/heatmap';
import { useTooltip, useTooltipInPortal, defaultStyles } from '@visx/tooltip';
import { observer } from "mobx-react-lite";
import { localPoint } from '@visx/event';


export const colorRanges = {
    greens: ['#008000', '#ccff33'],
    blues: ['#013a63', '#a9d6e5'],
    reds: ['#77312f', '#f33d15']
}
export const background = '#28272c';
export const accentColorDark = '#75daad';

const HeatmapV = ({model}) => {
    const colors = model.colors;
    const width = model.width;
    const height = model.height;
    // const events = false;
    const margin = { top: 10, left: 20, right: 20, bottom: 40 };
    const separation = 20;

    const { tooltipOpen, tooltipLeft, tooltipTop, tooltipData, hideTooltip, showTooltip } =
        useTooltip();

    console.log(tooltipData)

    const { containerRef, TooltipInPortal } = useTooltipInPortal({
        // TooltipInPortal is rendered in a separate child of <body /> and positioned
        // with page coordinates which should be updated on scroll. consider using
        // Tooltip or TooltipWithBounds if you don't need to render inside a Portal
        scroll: true,
    });

    if (model.dataState !== 'done') {
        return null
    }

    const binData = model.heatmapData('visx');

    if (binData.length === 0) return null;

    function max(data, value) {
        return Math.max(...data.map(value));
    }

    // accessors
    const bins = (d) => d.bins;
    const count = (d) => d.count;

    const colorMax = max(binData, (d) => max(bins(d), count));
    const bucketSizeMax = max(binData, (d) => bins(d).length);

    // scales
    const xScale = scaleLinear({
        domain: [0, binData.length],
    });
    const yScale = scaleLinear({
        domain: [0, bucketSizeMax],
    });
    const rectColorScale = scaleLinear({
        range: colorRanges[colors],  // [cool1, cool2],
        domain: [0, colorMax],
    });
    const opacityScale = scaleLinear({
        range: [0.1, 1],
        domain: [0, colorMax],
    });

    const tooltipStyles = {
        ...defaultStyles,
        minWidth: 60,
        backgroundColor: 'rgba(0,0,0,0.9)',
        color: 'white',
    };
    let tooltipTimeout;


    // bounds
    const size =
        width > margin.left + margin.right ? width - margin.left - margin.right - separation : width;
    const xMax = size;
    const yMax = height - margin.bottom - margin.top;

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const binWidth = xMax / binData.length;
    const binHeight = yMax / bucketSizeMax;

    xScale.range([0, xMax]);
    yScale.range([0, yMax]);

    return width < 10 ? null : (
        <div style={{ position: 'relative' }}>
            <svg ref={containerRef} width={width} height={height}>
                <rect x={0} y={0} width={width} height={height} rx={14} fill={background} />
                <Group top={margin.top} left={margin.left}>
                    <HeatmapRect
                        data={binData}
                        xScale={(d) => xScale(d) ?? 0}
                        yScale={(d) => yScale(d) ?? 0}
                        colorScale={rectColorScale}
                        opacityScale={opacityScale}
                        binWidth={binWidth}
                        binHeight={binHeight}
                        gap={0}
                    >
                        {(heatmap) =>
                            heatmap.map((heatmapBins) =>
                                heatmapBins.map((bin) => (
                                    <rect
                                        key={`heatmap-rect-${bin.row}-${bin.column}`}
                                        className="visx-heatmap-rect"
                                        width={bin.width}
                                        height={bin.height}
                                        x={bin.x}
                                        y={bin.y}
                                        fill={bin.color}
                                        fillOpacity={bin.opacity}
                                        onClick={() => {
                                            const { row, column } = bin;
                                            alert(JSON.stringify({ row, column, bin: bin.bin }));
                                        }}
                                        onMouseLeave={() => {
                                            tooltipTimeout = window.setTimeout(() => {
                                                hideTooltip();
                                            }, 300);
                                        }}
                                        onMouseMove={(event) => {
                                            if (tooltipTimeout) clearTimeout(tooltipTimeout);
                                            // TooltipInPortal expects coordinates to be relative to containerRef
                                            // localPoint returns coordinates relative to the nearest SVG, which
                                            // is what containerRef is set to in this example.
                                            const eventSvgCoords = localPoint(event);
                                            showTooltip({
                                                tooltipData: bin,
                                                tooltipTop: eventSvgCoords?.y,
                                                tooltipLeft: eventSvgCoords?.x,
                                            });
                                        }}
                                    />
                                )),
                            )
                        }
                    </HeatmapRect>
                </Group>
                {tooltipData && (
                    <g>
                        <Line
                            from={{ x: tooltipLeft, y: margin.top }}
                            to={{ x: tooltipLeft, y: innerHeight + margin.top }}
                            stroke={accentColorDark}
                            strokeWidth={2}
                            pointerEvents="none"
                            strokeDasharray="5,2"
                        />
                        <Line
                            from={{ x: margin.left, y: tooltipTop }}
                            to={{ x: innerWidth + margin.left, y: tooltipTop }}
                            stroke={accentColorDark}
                            strokeWidth={2}
                            pointerEvents="none"
                            strokeDasharray="5,2"
                        />
                    </g>
                )}
            </svg>
            {tooltipOpen && tooltipData && (
                <TooltipInPortal top={tooltipTop} left={tooltipLeft} style={tooltipStyles}>
                    <div>Row: {tooltipData.row}</div>
                    <div>Column: {tooltipData.column}</div>
                    <div>Value: {tooltipData.count}</div>
                </TooltipInPortal>
            )}
        </div>
    );
};

export default observer(HeatmapV);
