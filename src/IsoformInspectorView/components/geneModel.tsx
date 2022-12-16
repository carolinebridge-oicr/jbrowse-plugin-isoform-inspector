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

  const maxValue = Math.max(
    ...Object.entries(model.spliceJunctions).map((o: any) => {
      return o[1].value
    }),
  )

  const minValue = Math.min(
    ...Object.entries(model.spliceJunctions).map((o: any) => {
      return o[1].value
    }),
  )

  console.log(model.spliceJunctions)

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
                y={80}
                stroke={'black'}
                fill={'white'}
              />
            )
          })}
        </g>
        <g transform="translate(0, 70)">
          {model.nivoData.data.map((feature: any, index: number) => {
            return feature.data.map((point: any, eIndex: number) => {
              const object = model.spliceJunctions[point.x]
              const control = Math.min(
                (object.drawnJunctionX2 - object.drawnJunctionX1) / -4,
              )
              const thickness =
                ((model.spliceJunctions[point.x].value - minValue) * (5 - 1)) /
                  (maxValue - minValue) +
                1

              return (
                <g key={point.x + '_container_canonical'}>
                  <path
                    d={`M ${object.drawnJunctionX1} ${10} C ${
                      object.drawnJunctionX1
                    } ${control}, ${object.drawnJunctionX2} ${control}, ${
                      object.drawnJunctionX2
                    } ${10}`}
                    stroke={
                      model.currentFeatureId === point.x ? 'red' : '#D3D3D3'
                    }
                    strokeWidth={thickness}
                    fill="transparent"
                    onClick={(e) => {}}
                    pointerEvents="stroke"
                  />
                  <text
                    x={
                      object.drawnJunctionX1 +
                      (object.drawnJunctionX2 - object.drawnJunctionX1) / 2
                    }
                    y={-10}
                    style={{ stroke: 'white', strokeWidth: '0.6em' }}
                    visibility={
                      model.currentFeatureId === point.x ? 'visible' : 'hidden'
                    }
                  >
                    {model.spliceJunctions[point.x].value}
                  </text>
                  <text
                    x={
                      object.drawnJunctionX1 +
                      (object.drawnJunctionX2 - object.drawnJunctionX1) / 2
                    }
                    y={-10}
                    style={{ stroke: 'red' }}
                    visibility={
                      model.currentFeatureId === point.x ? 'visible' : 'hidden'
                    }
                  >
                    {model.spliceJunctions[point.x].value}
                  </text>
                </g>
              )
            })
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
                  y1={30 * (index + 5)}
                  y2={30 * (index + 5)}
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
                    y={30 * (index + 5) - 5}
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
