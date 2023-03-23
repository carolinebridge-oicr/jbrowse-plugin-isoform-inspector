import React from 'react'
import { observer } from 'mobx-react-lite'

export const CoveragePlot = ({
  model,
  width,
  height,
}: {
  model: any
  width: number
  height: number
}) => {
  if (!model.subjectExons) {
    return null
  }

  const plotPxMax = 25 // min is always 0

  // get the max value among all plot points
  const arr: Array<{}> = []
  Object.values(model.subjectExons).forEach((e: any) => {
    arr.push(e.coverage)
  })
  const flattened = arr.flat(1)

  // @ts-ignore
  const covPlotMax = Math.max(...flattened)

  return (
    <g transform="translate(0, 105)">
      {Object.values(model.subjectExons).map((exon: any, index: number) => {
        if (exon.coverage.length === 0) return null
        const plotPtWidth = exon.drawnExonRectWidth / exon.coverage.length
        return exon.coverage.map((point: any, i: number) => {
          const plotPtX = exon.drawnExonX + plotPtWidth * i
          const plotPtHeight = (point / covPlotMax) * plotPxMax

          if (point === 0) return null
          return (
            <rect
              key={`${exon.uniqueId}_${point}_${i}`}
              width={plotPtWidth}
              height={plotPtHeight}
              x={plotPtX}
              y={0}
              stroke={'blue'}
              fill={'blue'}
            />
          )
        })
      })}
    </g>
  )
}

export default observer(CoveragePlot)
