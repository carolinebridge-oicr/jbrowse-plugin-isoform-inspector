const localDataFolder = 'data'

export interface Feature {
  feature_id: string
  value: number
}

export interface Subject {
  subject_id: string
  features: Feature[]
  annotation: any
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
  data.transcripts.forEach((transcript: any) => {
    arrOfAllTranscriptExons.push(...transcript.exons)
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

  const maxPixels = 1200 * 0.9
  const pixelsPerBase = maxPixels / (data.end - data.start)

  // now we can use our array of introns to advise how to draw the transcripts
  const transcripts: Array<{}> = []
  data.transcripts.forEach((transcript: any) => {
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

    transcript.exons
      .slice()
      .reverse()
      .forEach((exon: any, i: number) => {
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

          const nextStart = transcript.exons.slice().reverse()[i + 1]
            ? transcript.exons.slice().reverse()[i + 1].start
            : 0
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

export async function fetchGeneModelData(geneId: string) {
  const dataPath = [localDataFolder, 'genes', `${geneId}.json`].join('/')

  const response = await fetch(dataPath, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  })

  const json = await response.json()

  return extractExonData(json[geneId])
}

let colours = {}

function getAnnotFieldsFromSubject(annotations: any) {
  const annotFields: Array<any> = []
  annotations.forEach((annotation: any) => {
    annotFields.push(annotation.type)
  })
  return { annotFields: annotFields }
}

export async function fetchLocalData(geneId: string, colourPalette: any) {
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
  const { geneModelData, canonicalExons } = await fetchGeneModelData(geneId)

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
      if (!colours[annotField]) {
        colours = {
          ...colours,
          [annotField]: {
            index: 0,
            [target.value]:
              // @ts-ignore
              colourPalette[0],
          },
        }
      }
      // @ts-ignore
      const colour = colours[annotField][target.value]
      if (!colour) {
        // @ts-ignore
        const index = colours[annotField].index + 1
        colours = {
          ...colours,
          [annotField]: {
            // @ts-ignore
            ...colours[annotField],
            index: index,
            [target.value]: colourPalette[index]
              ? colourPalette[index]
              : 'black',
          },
        }
      }
      annotatedDataForThisId.push({
        x: annotField,
        y: colourPalette.findIndex(
          // @ts-ignore
          (colour) => colour === colours[annotField][target.value],
        ),
        value: target.value,
        // @ts-ignore
        colour: colours[annotField][target.value],
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
    colours,
  }
}

export function getNivoHmData(
  dataState: string,
  showCols: boolean,
  subjectType: string,
  subjects: Array<Subject>,
) {
  if (dataState === 'done') {
    const { subject, features, data } = getHeatmapData(
      subjectType,
      subjects,
      showCols,
    )
    return { subject, features, data }
  }
  return
}

function getHeatmapData(
  subjectType: string,
  subjects: Array<Subject>,
  showCols: boolean,
) {
  let keys: Array<string> = []
  let nivoData: any[] = []

  subjects.forEach((subj, i) => {
    let count_info: { [key: string]: any } = {}
    count_info[subjectType] = subj.subject_id

    subj.features.forEach((feature: any, j: number) => {
      if (!keys.includes(feature.feature_id)) {
        keys.push(feature.feature_id)
      }

      count_info[feature.feature_id] = feature.value
    })

    let nivoDataObj = []

    let j = 0
    for (const [key, value] of Object.entries(count_info)) {
      let status = 'KNOWN' // TODO: eventually this will come from the junction_quantifications.json file instead
      if (j === 45) status = 'NOVEL'
      if (key !== 'sample') {
        nivoDataObj.push({
          x: key,
          y: value,
          status,
        })
      }
      j++
    }
    nivoData.push({
      id: count_info.sample,
      data: nivoDataObj,
      annotation: subj.annotation,
    })
  })

  if (!showCols) {
    nivoData = filterNoDataColumns(nivoData)
  }

  return {
    subject: 'sample',
    features: keys,
    data: nivoData,
  }
}

export function filterNoDataColumns(data: any) {
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
      // @ts-ignore
      mappedJunctions[junction.x] = {
        x: junction.x,
        y: junction.status === 'NOVEL' ? 1 : 0,
        label: junction.status === 'NOVEL' ? `NJ${i + 1}` : `J${i + 1}`,
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
