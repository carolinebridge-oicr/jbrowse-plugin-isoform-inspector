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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', paddingTop: 5 }}>
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
                y={90}
                stroke={'black'}
                fill={'white'}
              />
            )
          })}
        </g>
        <g transform="translate(0, 80)">
          {Object.entries(model.spliceJunctions).map(
            (feature: any, index: number) => {
              const id = feature[0]
              const object = feature[1]
              const control = Math.min(
                (object.drawnJunctionX2 - object.drawnJunctionX1) / -4,
              )
              const thickness =
                ((model.spliceJunctions[id].value - minValue) * (5 - 1)) /
                  (maxValue - minValue) +
                1
              const t = 0.5
              // formula: https://en.wikipedia.org/wiki/B%C3%A9zier_curve#Cubic_B%C3%A9zier_curves
              let textYCoord =
                (1 - t) * (1 - t) * (1 - t) * 0 +
                3 * ((1 - t) * (1 - t)) * (t * control - 5) +
                3 * (1 - t) * (t * t) * control -
                5 +
                t * t * t * 0

              if (textYCoord < -75) textYCoord = -70

              if (!model.showCols && object.value === 0) return null
              return (
                <g key={id + '_container_canonical'}>
                  <path
                    d={`M ${object.drawnJunctionX1} ${10} C ${
                      object.drawnJunctionX1
                    } ${control}, ${object.drawnJunctionX2} ${control}, ${
                      object.drawnJunctionX2
                    } ${10}`}
                    stroke={model.currentFeatureId === id ? 'red' : '#D3D3D3'}
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
                    y={textYCoord}
                    style={{ stroke: 'red' }}
                    visibility={
                      model.currentFeatureId === id ? 'visible' : 'hidden'
                    }
                  >
                    {object.value}
                  </text>
                </g>
              )
            },
          )}
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
                      model.currentFeatureId?.includes(exon.end)
                        ? 'red'
                        : 'black'
                    }
                    fill={
                      model.currentFeatureId?.includes(exon.end)
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
