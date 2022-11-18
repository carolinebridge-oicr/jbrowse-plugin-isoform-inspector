import React from 'react'
import { observer } from 'mobx-react-lite'
import { HeatMapCanvas } from '@nivo/heatmap' // HeatMap is SVG based, may be switched to use when user downloads the chart

export const Heatmap = ({
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

  console.log(model.nivoData.data)

  return (
    <svg width={width} height={height}>
      <foreignObject x={0} y={0} width={width} height={height}>
        <HeatMapCanvas
          data={model.nivoData.data}
          width={width}
          height={height}
          axisBottom={null}
          axisTop={null}
          axisRight={null}
          axisLeft={null}
          enableLabels={false}
          inactiveOpacity={1}
          margin={{ top: 50, right: 2, bottom: 2, left: 2 }}
          colors={{
            type: 'sequential',
            scheme: 'oranges', // TODO: colour of the heatmap and annotations to be freely selectable
            minValue: 0,
            maxValue: 650, // TODO: min and max should not be hardcoded
          }}
          tooltip={(value) => {
            // setting tooltip values
            const { data, serieId, x, y } = value.cell
            const feature = data.x
            const score = data.y
            model.setCurrentPanel('heatmap')
            model.setCurrentX(x)
            model.setCurrentY(y)
            model.setCurrentSubjectId(serieId)
            model.setCurrentFeatureId(feature)
            model.setCurrentScoreVal(score)
            return <></>
          }}
          labelTextColor={{ from: 'color', modifiers: [['darker', 1.8]] }}
          legends={[
            {
              anchor: 'top-right',
              translateX: 0,
              translateY: -30,
              length: 200,
              thickness: 10,
              direction: 'row',
              tickPosition: 'after',
              tickSize: 3,
              tickSpacing: 4,
              tickOverlap: false,
              tickFormat: '>-.1s',
              title: 'Read count →',
              titleAlign: 'start',
              titleOffset: 4,
            },
          ]}
        />
      </foreignObject>
    </svg>
  )
}

export default observer(Heatmap)
