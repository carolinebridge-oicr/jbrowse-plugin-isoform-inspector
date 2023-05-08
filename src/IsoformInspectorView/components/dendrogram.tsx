import React from 'react'
import { observer } from 'mobx-react-lite'
import { hierarchy, cluster } from 'd3-hierarchy'

export const Dendrogram = ({
  model,
  width,
  height,
}: {
  model: any
  width: any
  height: any
}) => {
  if (!model.nivoData || !model.clusterData?.clusters) {
    return null
  }

  const offset = 35

  const clust = cluster()
    .size([height - model.top, width])
    .separation(() => 1)
  const root = hierarchy(model.clusterData.clusters)
  clust(root)
  return (
    <div
      data-testid="dendrogram"
      onMouseEnter={(e) => {
        model.setCurrentPanel('none')
      }}
    >
      <svg id="dendro" width={width} height={height + offset}>
        <g transform={`translate(0,${model.top + offset})`}>
          {root
            .links()
            .map(({ source, target }: { source: any; target: any }) => {
              const { x: sy, y: sx } = source
              const { x: ty, y: tx } = target
              return (
                <React.Fragment key={sx + '-' + sy + '-' + tx + '-' + ty}>
                  <line
                    x1={width - sx}
                    y1={sy}
                    x2={width - sx}
                    y2={ty}
                    stroke="black"
                  />
                  <line
                    x1={width - sx}
                    y1={ty}
                    x2={width - tx}
                    y2={ty}
                    stroke="black"
                  />
                </React.Fragment>
              )
            })}
        </g>
      </svg>
    </div>
  )
}

export default observer(Dendrogram)
