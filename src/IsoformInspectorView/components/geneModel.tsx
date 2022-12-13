import React from 'react'
import { observer } from 'mobx-react-lite'
import { Chip } from '@mui/material'

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
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <Chip
        label={model.geneModelData?.gene_name}
        style={{ width: 'fit-content' }}
      />
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
        {/* <g>
        {model.nivoData.data.map((feature: any, index: number) => {
          return feature.data.map((point: any, eIndex: number) => {
            const left = point.x.split(/-|:/)[1]
            const right = point.x.split(/-|:/)[2]

            // these left and right x values will need to be sorted out in fetch data
            return (
              <path
                key={point.x + '_canonical'}
                d={`M ${left} 0 C ${left} ${10}, ${right} ${10}, ${right} 0`}
                stroke={'black'}
                strokeWidth={2}
                fill="transparent"
                onClick={(e) => {}}
                pointerEvents="stroke"
              />
            )
          })
        })}
      </g> */}
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
    </div>
  )
}

export default observer(GeneModel)
