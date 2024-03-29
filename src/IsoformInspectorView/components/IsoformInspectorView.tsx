import React, { useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { measureText } from '@jbrowse/core/util'
import { Line } from '@visx/shape'
import { HeatMapCanvas } from '@nivo/heatmap'
import { ToggleButtonGroup, ToggleButton } from '@mui/material'
import Heatmap from './heatmap'
import GeneModel from './geneModel'
import SubjectAnnotations from './SubjectAnnotations'
import Dendrogram from './dendrogram'
import ImportForm from './ImportForm'

export const accentColorDark = '#005AB5' // TODO: colour of the crosshair to be freely selectable

const HeatmapTooltip = observer(
  ({ model, width, height }: { model: any; width: number; height: number }) => {
    if (
      (model.uiState.currentPanel === 'geneModelJunction' &&
        model.mode !== 'junction') ||
      (model.uiState.currentPanel === 'geneModelExon' &&
        model.mode !== 'exon') ||
      model.uiState.currentPanel === 'none'
    ) {
      return null
    }
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
      yPos = model.uiState.currentY + model.top + 10
    }

    if (model.uiState.currentPanel === 'heatmap') {
      tooltipLineA = `Subject: ${model.currentSubjectId}`
      tooltipLineB = `Feature: ${model.currentFeatureId}`
      tooltipLineC = `Read count: ${model.currentScoreVal}`

      xPos = model.uiState.currentX + width * 0.1 + 20
      yPos = model.uiState.currentY + model.top + 10
    }

    if (
      model.uiState.currentPanel === 'featureLabels' ||
      model.uiState.currentPanel === 'geneModelJunction' ||
      model.uiState.currentPanel === 'geneModelExon'
    ) {
      tooltipLineA = `Label: ${model.currentSubjectId}` // e.g. KNOWN Junction 1
      tooltipLineB = `Feature: ${model.currentFeatureId}`
      tooltipLineC = `Total ${
        model.readType === 'raw' ? '' : '(normalized)'
      } read count: ${model.currentScoreVal}` // sum of the scores for that feature
      if (model.readDepth > 0) tooltipLineC = `Read depth: ${model.readDepth}`

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
    if (
      (model.uiState.currentPanel === 'geneModelJunction' &&
        model.mode !== 'junction') ||
      (model.uiState.currentPanel === 'geneModelExon' &&
        model.mode !== 'exon') ||
      model.uiState.currentPanel === 'none'
    ) {
      return null
    }

    let yPos = model.uiState.currentY
    let xPos
    if (model.uiState.currentPanel === 'annotations') {
      xPos = model.uiState.currentX
    }
    if (
      model.uiState.currentPanel === 'heatmap' ||
      model.uiState.currentPanel === 'featureLabels' ||
      model.uiState.currentPanel === 'geneModelJunction' ||
      model.uiState.currentPanel === 'geneModelExon'
    ) {
      xPos = model.uiState.currentX + width * 0.1 + gap
    }
    if (model.uiState.currentPanel === 'featureLabels') {
      yPos = model.uiState.currentY + height
    }

    return (
      <svg width={width} height={height} y={model.top}>
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
                y: height - model.top,
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
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        paddingLeft: 5,
        paddingTop: 5,
        gap: 5,
      }}
      onMouseEnter={(e) => {
        model.setCurrentPanel('none')
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

const Labels = observer(({ model, width }: { model: any; width: number }) => {
  if (model.mode === 'junction' && !model.spliceJunctions) return null
  if (model.mode === 'exon' && !model.subjectExons) return null
  const targetData =
    model.mode === 'junction' ? model.spliceJunctions : model.subjectExons
  let arr = Array.from(Object.values(targetData))
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
})

const ModeToggle = observer(({ model }: { model: any }) => {
  const [mode, setMode] = React.useState(model.mode)

  useEffect(() => {
    setMode(model.mode)
  }, [model.mode])

  return (
    <ToggleButtonGroup
      style={{ alignSelf: 'end' }}
      value={mode}
      color="secondary"
      exclusive
      onChange={(event: React.MouseEvent<HTMLElement>, newMode: string) => {
        if (newMode !== null) {
          setMode(newMode)
          model.setMode(newMode)
          model.getAndSetNivoData()
        }
      }}
      aria-label="mode"
    >
      <ToggleButton value="junction" data-testid="toggle-junction">
        {mode === 'junction'
          ? `Splice junction read counts (${model.readType})`
          : '...'}
      </ToggleButton>
      <ToggleButton value="exon" data-testid="toggle-exon">
        {mode === 'exon'
          ? `Canonical exon read counts (${model.readType})`
          : '...'}
      </ToggleButton>
    </ToggleButtonGroup>
  )
})

const IsoformInspectorView = observer(({ model }: { model: any }) => {
  const height = model.height
  const width = model.width
  const gap = 5
  const form = model.isImport

  if (model.data) {
    model.setOnLoadProperties(model.data)
  }

  return (
    <>
      {form ? (
        <ImportForm model={model} />
      ) : (
        <div
          style={{
            padding: '5px',
            display: 'flex',
            justifyContent: 'center',
            overflow: 'scroll',
            gap: gap,
          }}
        >
          <AnnotationLegend model={model} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <ModeToggle model={model} />
            <svg width={width * 0.9 + gap} height={height}>
              <svg width={width * 0.1} height={height}>
                <SubjectAnnotations
                  model={model}
                  width={width * 0.1}
                  height={height}
                />
              </svg>
              <svg width={width * 0.8} height={height} x={width * 0.1 + gap}>
                <Heatmap model={model} width={width * 0.8} height={height} />
              </svg>
              <Crosshair
                model={model}
                width={width + gap}
                height={height}
                gap={gap}
              />
              <HeatmapTooltip
                model={model}
                width={width * 0.9 + gap}
                height={height}
              />
            </svg>
            <div style={{ display: 'flex' }}>
              <svg
                width={width * 0.1 + gap}
                height={500}
                onMouseEnter={(e) => {
                  model.setCurrentPanel('none')
                }}
              />
              <div>
                <Labels model={model} width={width * 0.8} />
                <GeneModel model={model} width={width * 0.8} height={500} />
              </div>
            </div>
          </div>
          <Dendrogram model={model} width={width * 0.1} height={height} />
        </div>
      )}
    </>
  )
})

export default IsoformInspectorView
