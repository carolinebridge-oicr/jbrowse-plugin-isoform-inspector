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

  const offset = model.top
  let iter = 0
  let refArr: Array<number>
  const cellHeight = (height - model.top) / model.nivoData.data.length
  let secondBranch = 0
  return (
    <svg width={width} height={height}>
      {model.clusterData?.clusters ? (
        <g>
          {hierarchy(model.clusterData.clusters)
            .links()
            .map(({ source, target }: { source: any; target: any }) => {
              console.log(source, target)

              // the source height will be a percentage of its height in relation to the width of the container
              // unless it is greater than the width of the container in which case it will be width - 2
              // unless it is less than 2 in which case it will be 2
              const srcExpr = source.data.height * (source.data.height / width)
              const srcModHeight =
                srcExpr < width ? (srcExpr > 2 ? srcExpr : 2) : width - 2

              const tgtExpr = target.data.height * (target.data.height / width)
              const tgtModHeight =
                tgtExpr < width
                  ? target.height === 0 || tgtExpr > 2
                    ? tgtExpr
                    : 2
                  : width - 2 * target.depth

              if (source.parent === null) {
                refArr = source.data.indexes
                secondBranch += 1
              }
              iter = refArr.findIndex(
                (ele: any) => ele === target.data.indexes[0],
              )
              // a 'base child' is a child who has a height of 0
              // if the target has no children it is a base child, -1
              const numBaseChildren = target.children
                ? target.children.filter((child: any) => child.height === 0)
                    .length
                : -1
              // one base child 」
              // two base children |
              // zero base children ]

              let set = cellHeight / 2
              if (
                numBaseChildren === 0 &&
                target.children[0].data.indexes.length !== 2 &&
                target.children[1].data.indexes.length !== 2
              ) {
                set += cellHeight
              }

              let yi = set + cellHeight * iter + offset
              const y2 = yi + cellHeight * target.height

              let yxi =
                numBaseChildren !== 0
                  ? numBaseChildren === 1
                    ? y2 - (cellHeight / 2) * (target.height - 1)
                    : y2
                  : y2 + cellHeight / 2

              if (
                numBaseChildren === 0 &&
                target.data.indexes.length % 2 !== 0
              ) {
                if (
                  target.children[0].data.indexes.length !== 2 &&
                  target.children[1].data.indexes.length !== 2
                ) {
                  yxi += (target.height - 2) * (cellHeight / 2)
                } else {
                  yxi -= (target.height - 2) * (cellHeight / 2)
                }
              }

              const parentY =
                yi +
                cellHeight * source.height -
                (cellHeight / 2) * source.height

              const firstTgtChild = target.children
                ? target.children[0].data.height *
                  (target.children[0].data.height / width)
                : 0
              const secTgtChild = target.children
                ? target.children[1].data.height *
                  (target.children[1].data.height / width)
                : 0
              return (
                <g>
                  {/* the first horizontal line drawn */}
                  {numBaseChildren === -1 || numBaseChildren === 0 ? (
                    <line
                      key={`${target.data.indexes[0]}_dendrogram_horiz`}
                      x1={tgtModHeight}
                      x2={
                        numBaseChildren === -1
                          ? srcModHeight
                          : firstTgtChild < width
                          ? firstTgtChild > 2
                            ? firstTgtChild
                            : 2
                          : width - 2 * target.children[0].depth
                      }
                      y1={numBaseChildren === -1 ? yi : yi + cellHeight / 2}
                      y2={numBaseChildren === -1 ? yi : yi + cellHeight / 2}
                      stroke="black"
                    />
                  ) : null}
                  {/* the vertical line drawn */}
                  {numBaseChildren > -1 ? (
                    <line
                      key={`${target.data.indexes[0]}_dendrogram_vert`}
                      x1={tgtModHeight}
                      x2={tgtModHeight}
                      y1={numBaseChildren !== 0 ? yi : yi + cellHeight / 2}
                      y2={yxi}
                      stroke="black"
                    />
                  ) : null}
                  {/* the second horizontal line drawn, or the lower */}
                  {numBaseChildren < 2 && numBaseChildren >= 0 ? (
                    <line
                      key={`${target.data.indexes[0]}_horiz_link`}
                      x1={tgtModHeight}
                      x2={
                        secTgtChild < width
                          ? secTgtChild > 2
                            ? secTgtChild
                            : 2
                          : width - 2 * target.children[1].depth
                      }
                      y1={yxi}
                      y2={yxi}
                      stroke="black"
                    />
                  ) : null}
                  {/* the vertical line connecting the top of the highest parent */}
                  {source.parent === null && secondBranch === 1 ? (
                    <g>
                      <line
                        key={`${target.data.indexes[0]}_horiz_link_A`}
                        x1={tgtModHeight}
                        x2={srcModHeight}
                        y1={yi}
                        y2={yi}
                        stroke="black"
                      />
                      <line
                        key={`${target.data.indexes[0]}_dendrogram_vert_root`}
                        x1={srcModHeight}
                        x2={srcModHeight}
                        y1={yi}
                        y2={parentY}
                        stroke="black"
                      />
                      <line
                        key={`${target.data.indexes[0]}_horiz_link_B`}
                        x1={srcModHeight}
                        x2={
                          tgtModHeight > 0
                            ? tgtModHeight
                            : source.children[1].data.height *
                                (source.children[1].data.height / width) <
                              width
                            ? source.children[1].data.height *
                              (source.children[1].data.height / width)
                            : width - 2 * source.children[1].depth
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
