import { clusterData } from '@greenelab/hclust'
const localDataFolder = 'data'

export interface Feature {
  feature_id: string
  value: number
  status: string
}

export interface Subject {
  subject_id: string
  junctions: Feature[]
  exons: Feature[]
  annotation: any
}

export interface AnnotationConfig {
  fields: [{}]
  show: boolean
  id: string
  palette: String[]
}

function extractExonData(data: any) {
  // helper functions
  const getAllElements = (arr: any, val: any) => {
    const elements: Array<{}> = []
    for (let i = 0; i < arr.length; i++) {
      if (val.start == arr[i].start && val.end == arr[i].end) {
        elements.push(arr[i])
      }
    }
    return elements
  }

  // Collapse the transcripts into one
  let arrOfAllTranscriptExons: Array<{}> = []
  data.subfeatures.forEach((transcript: any) => {
    arrOfAllTranscriptExons.push(...transcript.subfeatures)
  })
  arrOfAllTranscriptExons.sort((a: any, b: any) => a.start - b.start)

  arrOfAllTranscriptExons = arrOfAllTranscriptExons.filter(
    (value: any, index: number, self: any) => {
      const matchingElements = getAllElements(self, value)
      const longestExon = matchingElements.sort((a: any, b: any) => {
        return b.end - b.start - (a.end - a.start)
      })[0]
      return (
        // @ts-ignore
        value.id === longestExon.id
      )
    },
  )

  // with our collapsed array, create an array of introns
  const introns: Array<{}> = []
  // truncated intron length, the length of an intron that has been truncated
  const truncIntronLen = 6000
  let nextExon = arrOfAllTranscriptExons[1]
  arrOfAllTranscriptExons.forEach((exon: any, i: number) => {
    // @ts-ignore
    const trueLength = nextExon.start - exon.end
    if (trueLength > 0) {
      const intron = {
        start: exon.end,
        // @ts-ignore
        end: nextExon.start,
        trueLength,
        truncated: trueLength > truncIntronLen,
        truncatedBy: trueLength - truncIntronLen,
      }
      introns.push(intron)
    }
    if (i < arrOfAllTranscriptExons.length - 2) {
      nextExon = arrOfAllTranscriptExons[i + 2]
    }
  })

  const maxPixels = 850 * 0.8
  const pixelsPerBase = maxPixels / (data.end - data.start)

  // now we can use our array of introns to advise how to draw the transcripts
  const transcripts: Array<{}> = []
  data.subfeatures.forEach((transcript: any) => {
    let drawnTranscriptX1 = 0
    if (transcript.start >= data.start) {
      drawnTranscriptX1 = Math.floor(
        (transcript.start - data.start) * pixelsPerBase,
      )
    }

    const drawnTranscriptLineLength = Math.floor(
      (transcript.end - transcript.start) * pixelsPerBase,
    )

    // we can use the introns similarly to advise how to draw the exons for this transcript
    const exons: Array<{}> = []
    let startLoc = drawnTranscriptX1

    const transcriptExons =
      transcript.strand === -1
        ? transcript.subfeatures.slice().reverse()
        : transcript.subfeatures

    transcriptExons.forEach((exon: any, i: number) => {
      if (exon.type === 'exon') {
        const drawnExonRectWidth =
          Math.floor((exon.end - exon.start) * pixelsPerBase) > 0
            ? Math.floor((exon.end - exon.start) * pixelsPerBase)
            : 1
        const exonData = {
          ...exon,
          drawnExonRectWidth,
          drawnExonX: startLoc,
          featureId: `${exon.refName.replace(/\D/g, '')}:${exon.start}-${
            exon.end
          }`,
        }

        const index = arrOfAllTranscriptExons.findIndex((cExon: any) => {
          return cExon.uniqueId === exon.uniqueId
        })

        arrOfAllTranscriptExons[index] = {
          ...arrOfAllTranscriptExons[index],
          ...exonData,
        }

        exons.push(exonData)

        i += 1
        while (transcriptExons[i]?.type !== 'exon') {
          i += 1
          if (!transcriptExons[i]) break
        }

        const nextStart = transcriptExons[i] ? transcriptExons[i].start : 0
        const gap = {
          start: exon.end,
          end: nextStart,
          length: Math.floor((nextStart - exon.end) * pixelsPerBase),
        }

        startLoc = Math.floor(startLoc + drawnExonRectWidth + gap.length)
      }
    })

    const drawnTranscriptX2 =
      // @ts-ignore
      exons[exons.length - 1].drawnExonX +
      // @ts-ignore
      exons[exons.length - 1].drawnExonRectWidth

    const transcriptData = {
      ...transcript,
      length: transcript.end - transcript.start,
      drawnTranscriptLineLength,
      drawnTranscriptX1,
      drawnTranscriptX2,
      exons,
    }

    transcripts.push(transcriptData)
  })

  const geneModelData = {
    ...data,
    transcripts,
  }
  return { geneModelData, canonicalExons: arrOfAllTranscriptExons }
}

function getAnnotFieldsFromSubject(annotations: any) {
  const annotFields: Array<any> = []
  annotations.forEach((annotation: any) => {
    annotFields.push(annotation.type)
  })
  return { annotFields: annotFields }
}

export async function fetchLocalData(
  geneModel: any,
  geneId: string,
  colourPalette: any,
) {
  let annotationsConfig = {} // a dictionary of annotations where the key is the annotation name
  // Open the processed file
  const dataPath = `${localDataFolder}/${geneId}_subj_observ.json`

  const response = await fetch(dataPath, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  })

  const completeJson = await response.json()
  const subjectType = completeJson['subject_type']
  const nivoAnnotations: Array<{}> = []
  // fetching data for the gene model
  const { geneModelData, canonicalExons } = extractExonData(geneModel)

  const { annotFields } = getAnnotFieldsFromSubject(
    completeJson.subjects[0].annotations,
  )

  const colouredSubjects: Array<{}> = []
  const subjectIds: Array<string> = []
  completeJson.subjects.forEach((subject: any) => {
    // Assigning colours to the annotations if they exist
    const annotatedDataForThisId: Array<{}> = []
    const annotations = subject['annotations']
    annotFields?.forEach((annotField: any) => {
      const target = annotations.find((annotation: any) => {
        return annotation.type === annotField
      })
      // @ts-ignore
      if (!annotationsConfig[annotField]) {
        annotationsConfig = {
          ...annotationsConfig,
          [annotField]: {
            id: annotField,
            show: true,
            palette: { name: 'nmetPalette', value: colourPalette },
            fields: {
              [target.value]:
                // @ts-ignore
                colourPalette[0],
            },
          },
        }
      }
      // @ts-ignore
      const colour = annotationsConfig[annotField].fields[target.value]
      if (!colour) {
        // @ts-ignore
        const i = Object.keys(annotationsConfig[annotField].fields).length
        const show = i > colourPalette.length ? false : true
        annotationsConfig = {
          ...annotationsConfig,
          [annotField]: {
            // @ts-ignore
            ...annotationsConfig[annotField],
            id: annotField,
            show,
            fields: {
              // @ts-ignore
              ...annotationsConfig[annotField].fields,
              [target.value]: colourPalette[i] ? colourPalette[i] : 'black',
            },
          },
        }
      }
      annotatedDataForThisId.push({
        x: annotField,
        y: colourPalette.findIndex(
          // @ts-ignore
          (colour) =>
            // @ts-ignore
            colour === annotationsConfig[annotField].fields[target.value],
        ),
        value: target.value,
        // @ts-ignore
        colour: annotationsConfig[annotField].fields[target.value],
      })
    })

    const subjectId = subject['subject_id']
    nivoAnnotations.push({
      id: subjectId,
      data: annotatedDataForThisId,
    })

    colouredSubjects.push({
      ...subject,
      annotation: {
        id: subjectId,
        data: annotatedDataForThisId,
      },
    })

    subjectIds.push(subjectId)
  })

  return {
    subjectType,
    subjects: colouredSubjects,
    geneModelData,
    subjectIds,
    canonicalExons,
    annotationsConfig,
  }
}

export function getNivoHmData(
  dataState: string,
  showCols: boolean,
  showRows: boolean,
  cluster: boolean,
  subjects: Array<Subject>,
) {
  if (dataState === 'done') {
    const { subject, features, data, clusterData } = getHeatmapData(
      subjects,
      showCols,
      showRows,
      cluster,
    )
    return { subject, features, data, clusterData }
  }
  return
}

function getHeatmapData(
  subjects: Array<Subject>,
  showCols: boolean,
  showRows: boolean,
  cluster: boolean,
) {
  let keys: Array<string> = []
  let nivoData: any[] = []

  subjects.forEach((subj, i) => {
    const nivoDataObj: Array<any> = []
    const justReads: Array<any> = []
    subj.junctions.forEach((feature) => {
      nivoDataObj.push({
        x: feature.feature_id,
        y: feature.value,
        status: feature.status ? feature.status : '',
      })
      justReads.push(feature.value)
    })
    nivoData.push({
      id: subj.subject_id,
      data: nivoDataObj,
      justReads,
      annotation: subj.annotation,
    })
  })

  // filter out duplicate id's for now
  nivoData = nivoData.filter(
    (target: any, index: any, array: any) =>
      array.findIndex((t: any) => t.id === target.id) === index,
  )

  let clusterData = {}

  if (!showCols) {
    nivoData = filterNoDataColumns(nivoData)
  }
  if (!showRows) {
    nivoData = filterNoDataRows(nivoData)
  }
  if (cluster) {
    const clusterResult = runClustering(nivoData)
    nivoData = clusterResult.nivoData
    clusterData = clusterResult.cluster
  } else {
    nivoData.sort((a: any, b: any) => {
      return a.id.localeCompare(b.id)
    })
  }

  return {
    subject: 'sample',
    features: keys,
    data: nivoData,
    clusterData: clusterData,
  }
}

function filterNoDataColumns(data: any) {
  const hasValues = data.reduce(
    (r: any, a: any) => a.data.map((value: any, i: number) => r[i] || value.y),
    [],
  )
  const result = data.map((a: any) => {
    return {
      ...a,
      data: a.data.filter((_: any, i: number) => hasValues[i]),
    }
  })

  return result
}

function filterNoDataRows(data: any) {
  const result = data.filter(
    (subject: any) => !subject.justReads.every((value: any) => value === 0),
  )
  return result
}

function runClustering(data: any) {
  const cluster = clusterData({ data, key: 'justReads' })
  // console.log(cluster)
  const result = cluster.order.map((i: number) => data[i])
  // console.log(result)
  return { cluster, nivoData: result }
}

export function mapSpliceJunctions(spliceJunctions: any, geneModelData: any) {
  const exonArrays: Array<{}> = []
  geneModelData.transcripts.forEach((transcript: any) => {
    exonArrays.push(transcript.exons)
  })
  const flattenedExons = exonArrays.flat(1)
  const mappedJunctions = {}

  spliceJunctions.forEach((subject: any) => {
    subject.data.forEach((junction: any, i: number) => {
      const start = junction.x.split(/-|:/)[1]
      const end = junction.x.split(/-|:/)[2]

      const startPoint = flattenedExons.find((exon: any) => {
        return `${exon.end + 1}` === `${start}`
      })
      const drawnJunctionX1 =
        // @ts-ignore
        startPoint.drawnExonX + startPoint.drawnExonRectWidth

      const endPoint = flattenedExons.find((exon: any) => {
        return `${exon.start}` === `${end}`
      })
      // @ts-ignore
      const drawnJunctionX2 = endPoint.drawnExonX

      // @ts-ignore
      const prevValue = mappedJunctions[junction.x]?.value
        ? // @ts-ignore
          mappedJunctions[junction.x]?.value
        : 0
      // we use a heatmap component to simulate labels below the actual heatmap
      // this helps colour them based on the processed status of the junction
      // the greater number being a more intense colour
      const statusVal =
        junction.status === 'NOVEL' ? 2 : junction.status === 'PUTATIVE' ? 1 : 0
      // @ts-ignore
      mappedJunctions[junction.x] = {
        x: junction.x,
        y: statusVal,
        label: `J${i + 1}`,
        status: `${junction.status} Junction ${i + 1}`,
        feature_id: junction.x,
        value: prevValue + junction.y,
        drawnJunctionX1,
        drawnJunctionX2,
      }
    })
  })

  return mappedJunctions
}
