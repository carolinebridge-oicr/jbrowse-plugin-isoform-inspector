import React from 'react'
import { observer } from 'mobx-react-lite'
import { hierarchy } from 'd3-hierarchy'

export const Dendrogram = ({
  model,
  width,
  height,
}: {
  model: any
  width: any
  height: any
}) => {
  if (!model.nivoData) {
    return null
  }

  // filter out duplicate id's for now, since the heatmap does that automatically
  // const arr = model.nivoData.data.filter(
  //   (target: any, index: any, array: any) =>
  //     array.findIndex((t: any) => t.id === target.id) === index,
  // )

  const offset = model.top
  let iter = 0
  let refArr: Array<number>
  const cellHeight = (height - model.top) / model.nivoData.data.length
  return (
    <svg width={width} height={height}>
      {model.clusterData?.clusters ? (
        <g>
          {hierarchy(model.clusterData.clusters)
            .links()
            .map(({ source, target }: { source: any; target: any }) => {
              console.log(source, target)

              const srcModHeight =
                source.data.height * (source.data.height / width) < width
                  ? source.data.height * (source.data.height / width)
                  : width - 2
              const tgtModHeight =
                target.data.height * (target.data.height / width) < width
                  ? target.data.height * (target.data.height / width)
                  : width - 2

              if (source.parent === null) {
                refArr = source.data.indexes
              }
              iter = refArr.findIndex(
                (ele: any) => ele === target.data.indexes[0],
              )
              const yi = cellHeight / 2 + cellHeight * iter + offset

              if (target.height > 0) {
                // determines how / when to draw the 」symbol
                let finalBranch = 0
                let tallestChild = 0
                target.children.forEach((child: any) => {
                  if (child.height !== 0) {
                    finalBranch += 1
                    if (child.data.height > tallestChild) {
                      tallestChild =
                        child.data.height * (child.data.height / width)
                    }
                  }
                })

                const xi = tgtModHeight > 2 ? tgtModHeight : 2
                const y2 =
                  finalBranch === 0 || finalBranch === 2
                    ? yi + cellHeight * target.height
                    : yi +
                      cellHeight * target.height -
                      (cellHeight / 2) * (target.height - 1)
                // the vertical line connecting the top of a group, i.e. the parent of children
                return (
                  <g>
                    {finalBranch === 2 ? (
                      <line
                        key={`${target.data.indexes[0]}_horiz_link`}
                        x1={xi}
                        x2={
                          target.children[0].data.height *
                          (target.children[0].data.height / width)
                        }
                        y1={finalBranch !== 2 ? yi : yi + cellHeight / 2}
                        y2={finalBranch !== 2 ? yi : yi + cellHeight / 2}
                        stroke="black"
                      />
                    ) : null}
                    <line
                      key={`${target.data.indexes[0]}_dendrogram_vert`}
                      x1={xi}
                      x2={xi}
                      y1={finalBranch !== 2 ? yi : yi + cellHeight / 2}
                      y2={finalBranch !== 2 ? y2 : y2 + cellHeight / 2}
                      stroke="black"
                    />
                    {finalBranch > 0 ? (
                      <line
                        key={`${target.data.indexes[0]}_horiz_link`}
                        x1={xi}
                        x2={tallestChild}
                        y1={finalBranch !== 2 ? y2 : y2 + cellHeight / 2}
                        y2={finalBranch !== 2 ? y2 : y2 + cellHeight / 2}
                        stroke="black"
                      />
                    ) : null}
                  </g>
                )
              }

              // might not need this, should always be less than the width
              const srcHeight = srcModHeight < width ? srcModHeight : width - 2
              const parentY =
                yi +
                cellHeight * source.height -
                (cellHeight / 2) * source.height
              return (
                <g>
                  <line
                    key={`${target.data.indexes[0]}_dendrogram_horiz`}
                    x1={target.height}
                    x2={srcHeight > 2 ? srcHeight : 2}
                    y1={yi}
                    y2={yi}
                    stroke="black"
                  />
                  {/* the vertical line connecting the top of the highest parent*/}
                  {source.parent === null ? (
                    <g>
                      <line
                        key={`${target.data.indexes[0]}_dendrogram_vert_root`}
                        x1={srcHeight}
                        x2={srcHeight}
                        y1={yi}
                        y2={parentY}
                        stroke="black"
                      />
                      <line
                        key={`${target.data.indexes[0]}_horiz_link`}
                        x1={srcHeight}
                        x2={
                          tgtModHeight > 0
                            ? tgtModHeight
                            : source.children[1].data.height *
                              (source.children[1].data.height / width)
                        }
                        y1={parentY}
                        y2={parentY}
                        stroke="black"
                      />
                    </g>
                  ) : null}
                </g>
              )
            })}
        </g>
      ) : null}
    </svg>
  )
}

export default observer(Dendrogram)
