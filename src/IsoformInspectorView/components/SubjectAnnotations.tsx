import React from 'react'
import { observer } from 'mobx-react-lite'
import { ResponsiveBarCanvas } from '@nivo/bar' // Bar is SVG based, may be switched to use when user downloads the chart
import { localPoint } from '@visx/event'
import { Line } from '@visx/shape'

export const accentColorDark = '#005AB5' // TODO: colour of the crosshair to be freely selectable
// colour-blind friendly palette retrieved from https://www.nature.com/articles/nmeth.1618
const colourPalette = [
  '#000000',
  '#e69d00',
  '#56b3e9',
  '#009e74',
  '#f0e442',
  '#0071b2',
  '#d55c00',
  '#cc79a7',
]
const data = [
  {
    country: 'AD',
    'hot dog': 69,
    burger: 98,
    sandwich: 195,
    kebab: 96,
    fries: 159,
    donut: 182,
    junk: 121,
    sushi: 125,
    ramen: 68,
    curry: 72,
    udon: 24,
    bagel: 7,
    yakitori: 63,
    takoyaki: 164,
    tacos: 153,
    'miso soup': 126,
    tortilla: 78,
    tapas: 16,
    chipirones: 151,
    gazpacho: 3,
    soba: 116,
    bavette: 160,
    steak: 46,
    pizza: 125,
    spaghetti: 150,
    ravioli: 84,
    salad: 50,
    'pad thai': 57,
    bun: 192,
    waffle: 53,
    crepe: 200,
    churros: 91,
    paella: 69,
    empanadas: 26,
    bruschetta: 135,
    'onion soup': 107,
    cassoulet: 199,
    bouillabaisse: 199,
    unagi: 160,
    tempura: 28,
    tonkatsu: 186,
    'shabu-shabu': 170,
    twinkies: 137,
    jerky: 83,
    fajitas: 190,
    jambalaya: 29,
    meatloaf: 123,
    "mac n' cheese": 56,
    'baked beans': 169,
    popcorn: 98,
    'buffalo wings': 83,
    'BBQ ribs': 53,
    'apple pie': 97,
    nachos: 170,
    risotto: 157,
    tiramisu: 36,
  },
]

export const SubjectAnnotation = ({
  model,
  width,
  height,
}: {
  model: any
  width: number
  height: number
}) => {
  if (model.dataState !== 'done' || !model.geneId) {
    return null
  }

  // todo: hardcoded
  const pixelsPerSubject = height / 155

  return (
    <svg width={width} height={height}>
      <foreignObject x={0} y={0} width={width} height={height}>
        <ResponsiveBarCanvas
          data={model.nivoAnnotations}
          indexBy="annotField"
          keys={model.subjectIds.slice().reverse()}
          colors={({ id, data }) => String(data[`${id}_color`])}
          margin={{ top: 2, right: 2, bottom: 2, left: 2 }}
          pixelRatio={1}
          padding={0.15}
          innerPadding={0}
          minValue="auto"
          maxValue="auto"
          layout="vertical"
          reverse={false}
          valueScale={{ type: 'linear' }}
          indexScale={{ type: 'band', round: true }}
          enableLabel={false}
          enableGridX={false}
          enableGridY={false}
          axisLeft={{ tickSize: 0 }}
          axisBottom={{ tickSize: 0 }}
          tooltip={(value) => {
            const { id, data, indexValue } = value
            // console.log(value)
            const annotValue = data[`${id}_value`]
            model.setCurrentPanel('annotations')
            // model.setCurrentX(x)
            // model.setCurrentY(y)
            model.setCurrentSubjectId(id)
            model.setCurrentAnnotation(indexValue, annotValue)
            // model.setCurrentFeatureId(feature)
            // model.setCurrentScoreVal(score)
            return <></>
          }}
        />
      </foreignObject>
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        opacity={0}
        onMouseLeave={() => {
          model.setCurrentPanel(undefined)
          model.setCurrentX(undefined)
          model.setCurrentY(undefined)
          model.setCurrentSubjectId(undefined)
          model.setCurrentFeatureId(undefined)
        }}
        onMouseMove={(event) => {
          const eventSvgCoords = localPoint(event)
          const setY = eventSvgCoords ? eventSvgCoords?.y : undefined
          model.setCurrentPanel('subjectAnnotation')
          model.setCurrentX(eventSvgCoords?.x)
          model.setCurrentY(setY)
          if (model.uiState.currentY) {
            const subjectIdIdx = Math.floor(
              (model.uiState.currentY - 2) / pixelsPerSubject,
            )
            if (subjectIdIdx < model.subjectIds.length) {
              model.setCurrentSubjectId(model.subjectIds[subjectIdIdx])
            } else {
              model.setCurrentSubjectId(undefined)
            }
          } else {
            model.setCurrentSubjectId(undefined)
          }
          model.setCurrentFeatureId(undefined)
        }}
      />
      {model.uiState?.currentY && model.uiState.currentY <= height && (
        <g>
          <Line
            from={{ x: 0, y: model.uiState.currentY + 2.5 }}
            to={{ x: width, y: model.uiState.currentY + 2.5 }}
            stroke={accentColorDark}
            strokeWidth={2}
            pointerEvents="none"
            strokeDasharray="5,2"
          />
        </g>
      )}
    </svg>
  )
}

export default observer(SubjectAnnotation)
