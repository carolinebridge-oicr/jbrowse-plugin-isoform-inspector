import React from 'react'
import { observer } from 'mobx-react-lite'

export const GeneModel = ({
  model,
  width,
  height,
}: {
  model: any
  width: number
  height: number
}) => {
  if (model.dataState !== 'done' || !model.geneId || !model.geneModelData) {
    return null
  }

  return (
    <svg width={width} height={height}>
      <g>
        {model.geneModelData.transcripts.map(
          (transcript: any, index: number) => {
            return (
              <line
                x1={transcript.drawnTranscriptX1}
                x2={transcript.drawnTranscriptX2}
                y1={20 * (index + 1)}
                y2={20 * (index + 1)}
                stroke="black"
              />
            )
          },
        )}
      </g>
      {/* <g>
        {model.geneModelData.transcripts.map(
          (transcript: any, index: number) => {
            return transcript.exons.map((exon: any, eIndex: number) => {
              return (
                <rect
                  width={exon.drawnExonRectWidth}
                  height={10}
                  x={exon.drawnExonX}
                  y={20 * (index + 1) - 5}
                  stroke="black"
                  fill="white"
                />
              )
            })
          },
        )}
      </g> */}
    </svg>
  )
}

export default observer(GeneModel)
