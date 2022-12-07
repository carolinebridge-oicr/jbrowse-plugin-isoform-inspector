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

  console.log(model.canonicalExons)

  return (
    <svg width={width} height={height}>
      <g>
        {model.canonicalExons.map((exon: any) => {
          return (
            <rect
              key={exon.uniqueId + '_canonical'}
              width={exon.drawnExonRectWidth}
              height={10}
              x={exon.drawnExonX}
              y={30}
              stroke={'black'}
              fill={'white'}
            />
          )
        })}
      </g>
      <g>
        {model.geneModelData.transcripts.map(
          (transcript: any, index: number) => {
            return (
              <line
                key={transcript.uniqueId}
                x1={transcript.drawnTranscriptX1}
                x2={transcript.drawnTranscriptX2}
                y1={20 * (index + 5)}
                y2={20 * (index + 5)}
                stroke="black"
              />
            )
          },
        )}
      </g>
      <g>
        {model.geneModelData.transcripts.map(
          (transcript: any, index: number) => {
            return transcript.exons.map((exon: any, eIndex: number) => {
              return (
                <rect
                  key={exon.uniqueId}
                  width={exon.drawnExonRectWidth}
                  height={10}
                  x={exon.drawnExonX}
                  y={20 * (index + 5) - 5}
                  stroke={
                    model.currentFeatureId?.includes(exon.end + 1)
                      ? 'red'
                      : 'black'
                  }
                  fill={
                    model.currentFeatureId?.includes(exon.end + 1)
                      ? 'red'
                      : 'white'
                  }
                />
              )
            })
          },
        )}
      </g>
    </svg>
  )
}

export default observer(GeneModel)
