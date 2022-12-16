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
      yPos = model.uiState.currentY + 65 + 10
    }
    if (model.uiState.currentPanel === 'heatmap') {
      tooltipLineB = `Feature: ${model.currentFeatureId}`
      tooltipLineC = `Read count: ${model.currentScoreVal}`

      xPos = model.uiState.currentX + width * 0.1 + 20
      yPos = model.uiState.currentY + 65 + 10
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
      <svg width={width} height={height} y={65}>
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
                y: height - 65,
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
              fontSize={12}
              fontWeight={'bold'}
              textAnchor="end"
              transform={`translate(${90 + (i + 1) * 15}, ${
                15 + i * 10
              }) rotate(340)`}
            >
              {annot.x}
            </text>
          )
        })}
      </svg>
    )
  },
)

const AnnotationLegend = observer(({ model }: { model: any }) => {
  if (!model.colours) return null
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        paddingLeft: 5,
        paddingTop: 5,
        gap: 5,
      }}
    >
      {Object.entries(model.colours).map((value) => {
        if (model.colours[value[0]].hide === false) {
          return (
            <div key={`${value[0]}_legend`}>
              <div style={{ fontWeight: 'bold' }}>{value[0]}</div>
              {Object.entries(model.colours[value[0]]).map((property) => {
                if (property[0] !== 'index' && property[0] !== 'hide') {
                  return (
                    <div
                      key={`${property[0]}_legend`}
                      style={{ display: 'flex', alignItems: 'center', gap: 2 }}
                    >
                      <div
                        style={{
                          background: model.colours[value[0]][property[0]],
                          width: 10,
                          height: 10,
                        }}
                      />
                      <div>{property[0]}</div>
                    </div>
                  )
                }
                return null
              })}
            </div>
          )
        }
        return null
      })}
    </div>
  )
})

const IsoformInspectorView = observer(({ model }: { model: any }) => {
  const height = 850
  const width = 1200
  const gap = 5

  if (model.geneId) {
    model.loadGeneData(model.geneId)
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        gap: gap,
      }}
    >
      <AnnotationLegend model={model} />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
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
          {/* <GeneModel model={model} width={width * 0.9} height={500} /> */}
        </div>
      </div>
    </div>
  )
})

export default IsoformInspectorView
