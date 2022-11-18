import React from 'react'
import { observer } from 'mobx-react-lite'
import { ResponsiveHeatMapCanvas } from '@nivo/heatmap' // HeatMap is SVG based, may be switched to use when user downloads the chart

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

  return (
    <svg width={width} height={height}>
      <foreignObject x={0} y={0} width={width} height={height}>
        <ResponsiveHeatMapCanvas
          data={model.nivoAnnotations}
          axisBottom={null}
          axisTop={null}
          axisRight={null}
          axisLeft={null}
          enableLabels={false}
          inactiveOpacity={1}
          xInnerPadding={0.25}
          margin={{ top: 50, right: 2, bottom: 2, left: 2 }}
          // @ts-ignore
          colors={({ data }) => data.colour}
          tooltip={(value) => {
            // setting tooltip values
            const { data, serieId, x, y } = value.cell
            const annotField = data.x
            // @ts-ignore
            const annotVal = data.value
            model.setCurrentPanel('annotations')
            model.setCurrentX(x)
            model.setCurrentY(y)
            model.setCurrentSubjectId(serieId)
            model.setCurrentAnnotation(annotField, annotVal)
            return <></>
          }}
        />
      </foreignObject>
    </svg>
  )
}

export default observer(SubjectAnnotation)
