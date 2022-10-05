import React from 'react'
import { observer } from 'mobx-react-lite'
import { HeatMapCanvas } from '@nivo/heatmap'

export const Heatmap = ({ model }: { model: any }) => {
  if (!model.geneId) {
    return <p>Please choose a gene!</p>
  }

  if (model.dataState !== 'done') {
    return null
  }

  const { subject, features, data } = model.heatmapData('nivo')

  return (
    <></>
    // <HeatMapCanvas
    //   indexBy={subject}
    //   keys={features}
    //   data={data}
    //   width={model.width}
    //   height={model.height}
    //   colors={model.colors}
    //   enableLabels={false}
    //   hoverTarget="rowColumn"
    //   cellHoverOpacity={1}
    //   cellHoverOthersOpacity={0.5}
    //   margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
    //   axisTop={null}
    //   axisRight={null}
    //   axisBottom={null}
    //   axisLeft={null}
    //   cellOpacity={1}
    //   cellBorderColor={{ from: 'color', modifiers: [['darker', 0.4]] }}
    //   labelTextColor={{ from: 'color', modifiers: [['darker', 1.8]] }}
    //   tooltip={({ xKey, yKey, value }) => (
    //     <strong style={{ color: 'black' }}>
    //       {xKey} / {yKey}: {value}
    //     </strong>
    //   )}
    // />
  )
}

export default observer(Heatmap)
