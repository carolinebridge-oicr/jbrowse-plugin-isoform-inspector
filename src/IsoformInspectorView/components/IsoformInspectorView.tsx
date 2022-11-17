import React from 'react'
import { observer } from 'mobx-react-lite'
import { measureText } from '@jbrowse/core/util'
import { Line } from '@visx/shape'
import Heatmap from './Heatmap'

export const accentColorDark = '#005AB5' // TODO: colour of the crosshair to be freely selectable

const Tooltip = observer(
  ({ model, width, height }: { model: any; width: number; height: number }) => {
    const rectWidth = measureText(`Feature: ${model.currentFeatureId}`) + 14
    const rectHeight = 60
    // setting position values
    let xPos = model.uiState.currentX + 10
    let yPos = model.uiState.currentY + 50 + 10

    if (xPos + rectWidth > width) {
      xPos = xPos - rectWidth - 20
    }
    if (yPos + rectHeight > height) {
      yPos = yPos - rectHeight - 20
    }

    return (
      <>
        {model.uiState.currentX && model.uiState.currentX ? (
          <svg>
            <rect
              x={xPos}
              y={yPos}
              width={rectWidth}
              height={rectHeight}
              rx={5}
              ry={5}
              fill="black"
              fillOpacity="50%"
            />
            <text x={xPos + 10} y={yPos + 7} fontSize={10} fill="white">
              <tspan x={xPos + 7} dy="1.4em">
                Feature: {model.currentFeatureId}
              </tspan>
              <tspan x={xPos + 7} dy="1.4em">
                Subject: {model.currentSubjectId}
              </tspan>
              <tspan x={xPos + 7} dy="1.4em">
                Score value: {model.currentScoreVal}
              </tspan>
            </text>
          </svg>
        ) : null}
      </>
    )
  },
)

const Crosshair = observer(
  ({ model, width, height }: { model: any; width: number; height: number }) => {
    return (
      <svg width={width} height={height}>
        {model.uiState.currentY <= height ? (
          <g>
            <Line
              from={{ x: 0, y: model.uiState.currentY + 50 }}
              to={{ x: width, y: model.uiState.currentY + 50 }}
              stroke={accentColorDark}
              strokeWidth={2}
              pointerEvents="none"
              strokeDasharray="5,2"
            />
          </g>
        ) : null}
        {model.uiState.currentX <= width ? (
          <g>
            <Line
              from={{
                x: model.uiState.currentX,
                y: 0,
              }}
              to={{
                x: model.uiState.currentX,
                y: height,
              }}
              stroke={accentColorDark}
              strokeWidth={2}
              pointerEvents="none"
              strokeDasharray="5,2"
            />
          </g>
        ) : null}
      </svg>
    )
  },
)

const IsoformInspectorView = observer(({ model }: { model: any }) => {
  // TODO: these should be dynamic to the heatmap generated
  const height = 500
  const width = 1000
  if (model.geneId) {
    model.loadGeneData(model.geneId)
  }
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <svg width={width} height={height}>
        <Heatmap model={model} height={height} width={width} />
        <Crosshair model={model} height={height} width={width} />
        <Tooltip model={model} height={height} width={width} />
      </svg>
    </div>
  )
})

export default IsoformInspectorView
