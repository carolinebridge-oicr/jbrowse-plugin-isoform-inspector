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
              onMouseLeave={(e) => {
                model.setReadDepth(0)
                model.setCurrentPanel('none')
                model.setCurrentFeatureId(null)
              }}
              onMouseEnter={(e) => {
                const sizeOfEach =
                  (model.width * 0.8) / Object.values(model.subjectExons).length
                const index = Object.values(
                  model.subjectExons,
                  // @ts-ignore
                ).findIndex((value) => value.x === exon.x)
                const x = sizeOfEach / 2 + index * sizeOfEach
                model.setCurrentPanel('geneModelExon')
                model.setCurrentX(x)
                model.setCurrentY(10)
                model.setCurrentSubjectId(exon.status)
                model.setCurrentFeatureId(exon.feature_id)
                model.setCurrentScoreVal(exon.value)
                model.setReadDepth(point)
              }}
            />
          )
        })
      })}
    </g>
  )
}

export default observer(CoveragePlot)
