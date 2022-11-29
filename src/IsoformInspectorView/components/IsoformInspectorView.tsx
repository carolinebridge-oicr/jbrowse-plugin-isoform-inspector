import React from 'react'
import { observer } from 'mobx-react-lite'
import { measureText } from '@jbrowse/core/util'
import { Line } from '@visx/shape'
import Heatmap from './Heatmap'
import GeneModel from './GeneModel'
import SubjectAnnotations from './SubjectAnnotations'

export const accentColorDark = '#005AB5' // TODO: colour of the crosshair to be freely selectable

const Tooltip = observer(
  ({ model, width, height }: { model: any; width: number; height: number }) => {
    const rectHeight = 60
    let xPos
    let yPos

    const tooltipLineA = `Subject: ${model.currentSubjectId}`
    let tooltipLineB = ''
    let tooltipLineC = ''
    if (model.uiState.currentPanel === 'annotations') {
      tooltipLineB = `Annotation: ${model.currentAnnotation.field}`
      tooltipLineC = `Annotation value: ${model.currentAnnotation.value}`

      xPos = model.uiState.currentX + 10
      yPos = model.uiState.currentY + 50 + 10
    }
    if (model.uiState.currentPanel === 'heatmap') {
      tooltipLineB = `Feature: ${model.currentFeatureId}`
      tooltipLineC = `Read count: ${model.currentScoreVal}`

      xPos = model.uiState.currentX + width * 0.1 + 25 + 10
      yPos = model.uiState.currentY + 50 + 10
    }

    const rectWidth =
      Math.max(
        measureText(tooltipLineA),
        measureText(tooltipLineB),
        measureText(tooltipLineC),
      ) + measureText('letters')

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
                {tooltipLineA}
              </tspan>
              <tspan x={xPos + 7} dy="1.4em">
                {tooltipLineB}
              </tspan>
              <tspan x={xPos + 7} dy="1.4em">
                {tooltipLineC}
              </tspan>
            </text>
          </svg>
        ) : null}
      </>
    )
  },
)

const Crosshair = observer(
  ({
    model,
    width,
    height,
    gap,
  }: {
    model: any
    width: number
    height: number
    gap: number
  }) => {
    const yPos = model.uiState.currentY
    let xPos
    if (model.uiState.currentPanel === 'annotations') {
      xPos = model.uiState.currentX
    }
    if (model.uiState.currentPanel === 'heatmap') {
      xPos = model.uiState.currentX + width * 0.1 + gap
    }
    return (
      <svg width={width} height={height} y={50}>
        {yPos <= height ? (
          <g>
            <Line
              from={{ x: 0, y: yPos }}
              to={{ x: width, y: yPos }}
              stroke={accentColorDark}
              strokeWidth={2}
              pointerEvents="none"
              strokeDasharray="5,2"
            />
          </g>
        ) : null}
        {xPos <= width + width * 0.1 + gap ? (
          <g>
            <Line
              from={{
                x: xPos,
                y: 0,
              }}
              to={{
                x: xPos,
                y: height - 50,
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

const AnnotationLabels = observer(
  ({ model, width, height }: { model: any; width: number; height: number }) => {
    if (model.dataState !== 'done' || !model.geneId) {
      return null
    }
    const sampleAnnot = model.nivoAnnotations[0].data
    const numAnnots = sampleAnnot.length
    return (
      <svg width={width} height={height}>
        {sampleAnnot.map((annot: any, i: number) => {
          return (
            <text
              x={0}
              y={-5 + i * 12}
              fontSize={64 / numAnnots}
              textAnchor="end"
              transform="translate(15, 15) rotate(270)"
            >
              {annot.x}
            </text>
          )
        })}
      </svg>
    )
  },
)

const IsoformInspectorView = observer(({ model }: { model: any }) => {
  const height = 650
  const width = 1000
  const gap = 15

  if (model.geneId) {
    model.loadGeneData(model.geneId)
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 25 }}>
        <svg width={width + gap} height={height}>
          <svg width={width * 0.1} height={height}>
            <SubjectAnnotations
              model={model}
              width={width * 0.1}
              height={height}
            />
          </svg>
          <svg width={width * 0.9} height={height} x={width * 0.1 + gap}>
            <Heatmap model={model} width={width * 0.9} height={height} />
          </svg>
          <Crosshair
            model={model}
            width={width + gap}
            height={height}
            gap={gap}
          />
          <Tooltip model={model} width={width + gap} height={height} />
        </svg>
        <div style={{ display: 'flex' }}>
          <AnnotationLabels
            model={model}
            width={width * 0.1 + gap}
            height={height - 150}
          />
          {/* <GeneModel model={model} width={width * 0.9} height={500} /> */}
        </div>
      </div>
    </div>
  )
})

export default IsoformInspectorView
