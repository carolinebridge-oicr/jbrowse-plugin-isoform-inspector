import React from 'react'
import { observer } from 'mobx-react-lite'
import { measureText } from '@jbrowse/core/util'
import { Line } from '@visx/shape'
import Heatmap from './Heatmap'
import GeneModel from './GeneModel'
import SubjectAnnotations from './SubjectAnnotations'
import { HeatMapCanvas } from '@nivo/heatmap'

export const accentColorDark = '#005AB5' // TODO: colour of the crosshair to be freely selectable

const Tooltip = observer(
  ({ model, width, height }: { model: any; width: number; height: number }) => {
    const rectHeight = 60
    let xPos
    let yPos

    let tooltipLineA = ''
    let tooltipLineB = ''
    let tooltipLineC = ''

    if (model.uiState.currentPanel === 'annotations') {
      tooltipLineA = `Subject: ${model.currentSubjectId}`
      tooltipLineB = `Annotation: ${model.currentAnnotation.field}`
      tooltipLineC = `Annotation value: ${model.currentAnnotation.value}`

      xPos = model.uiState.currentX + 10
      yPos = model.uiState.currentY + 65 + 10
    }

    if (model.uiState.currentPanel === 'heatmap') {
      tooltipLineA = `Subject: ${model.currentSubjectId}`
      tooltipLineB = `Feature: ${model.currentFeatureId}`
      tooltipLineC = `Read count: ${model.currentScoreVal}`

      xPos = model.uiState.currentX + width * 0.1 + 20
      yPos = model.uiState.currentY + 65 + 10
    }

    if (model.uiState.currentPanel === 'featureLabels') {
      tooltipLineA = `Label: ${model.currentSubjectId}` // e.g. KNOWN Junction 1
      tooltipLineB = `Feature: ${model.currentFeatureId}`
      tooltipLineC = `Total read count: ${model.currentScoreVal}` // sum of the scores for that feature

      xPos = model.uiState.currentX + width * 0.1 + 20
      yPos = model.uiState.currentY + height
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
    if (
      model.uiState.currentPanel === 'heatmap' ||
      model.uiState.currentPanel === 'featureLabels'
    ) {
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

const AnnotationLegend = observer(({ model }: { model: any }) => {
  if (!model.annotationsConfig) return null
  console.log(model.annotationsConfig)
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
      {Object.keys(model.annotationsConfig).map((key) => {
        if (model.annotationsConfig[key].show === true) {
          return (
            <div key={`${key}_legend`}>
              <div style={{ fontWeight: 'bold' }}>{key}</div>
              {Object.entries(model.annotationsConfig[key].fields).map(
                ([pKey, pValue]) => {
                  if (pKey !== 'id') {
                    return (
                      <div
                        key={`${pKey}_legend`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                        }}
                      >
                        <div
                          style={{
                            background: pValue as string,
                            width: 10,
                            height: 10,
                          }}
                        />
                        <div>{pKey}</div>
                      </div>
                    )
                  }
                  return null
                },
              )}
            </div>
          )
        }
        return null
      })}
    </div>
  )
})

const Labels = observer(
  ({ model, width, height }: { model: any; width: number; height: number }) => {
    if (!model.spliceJunctions) return null
    let arr = Array.from(Object.values(model.spliceJunctions))
    if (!model.showCols)
      arr = arr.filter((obj: any) => {
        if (obj.value > 0) return obj
      })
    const data = [
      {
        id: 'labels',
        data: arr,
      },
    ]
    return (
      <svg width={width} height={20}>
        <foreignObject x={0} y={0} width={width} height={20}>
          <HeatMapCanvas
            // @ts-ignore
            data={data}
            width={width}
            height={20}
            label={'data.label'}
            colors={{
              type: 'sequential',
              scheme: 'blues',
              minValue: 0,
              maxValue: 5,
            }}
            tooltip={(value) => {
              const { data, x, y } = value.cell
              const feature = data.x
              // @ts-ignore
              const status = data.status
              // @ts-ignore
              const score = data.value
              model.setCurrentPanel('featureLabels')
              model.setCurrentSubjectId(status)
              model.setCurrentX(x)
              model.setCurrentY(y)
              model.setCurrentFeatureId(feature)
              model.setCurrentScoreVal(score)
              return <></>
            }}
            onClick={(value) => {
              console.log(
                'queue dialog that lets a user change the label and status of this splice junction cell',
              )
            }}
          />
        </foreignObject>
      </svg>
    )
  },
)

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
        padding: '5px',
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
          <svg width={width * 0.1 + gap} height={500} />
          <div>
            <Labels model={model} width={width * 0.9} height={height} />
            <GeneModel model={model} width={width * 0.9} height={500} />
          </div>
        </div>
      </div>
    </div>
  )
})

export default IsoformInspectorView
