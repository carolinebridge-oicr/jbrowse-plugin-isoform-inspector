import { openLocation } from '@jbrowse/core/util/io'

// colour-blind friendly palette retrieved from https://www.nature.com/articles/nmeth.1618
const nmetPalette = [
  // '#000000',
  '#e69d00',
  '#56b3e9',
  '#009e74',
  '#f0e442',
  '#0071b2',
  '#d55c00',
  '#cc79a7',
]

/**
 * Processes a local data file from public/data if it exists. If it does not exist, an error is thrown
 * @param geneName the name of the gene from the context menu action
 * @param geneId the id of the gene from the context menu action
 * @returns an object representing the processed data from the file, if found
 */
export async function fetchLocalDataFromName(
  geneName: string,
  geneId: string,
  geneModel: any,
) {
  const dataPath = `public/data/${geneId}_${geneName}_subj_observ.json`
  // const dataPath = `data/${geneId}_subj_observ.json`

  const response = await fetch(dataPath, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  })

  if (response.ok) {
    const completeJson = await response.json()
    return processIsoformDataFile(completeJson, geneModel)
  }
  throw {
    name: 'NoLocalDataFromNameError',
    message: `Local data file for ${geneId} not found in public/data folder.`,
  }
}

/**
 * Loads a local data file from a blob provided
 * @param blob a File blob of the data to load
 * @param geneModel the model for the gene being looked at, assigned to the data model from the context click
 */
export async function fetchLocalDataFromBlob(blob: any, geneModel: any) {
  const response = openLocation(blob)

  // @ts-ignore
  const completeJson = JSON.parse(await response.blob.text())
  const geneName = completeJson.gene_name

  if (geneName === geneModel.gene_name) {
    return processIsoformDataFile(completeJson, geneModel)
  } else {
    throw {
      name: 'MismatchGeneNameError',
      message: `The gene name from the provided file (${geneName}) does not match the gene model name (${geneModel.gene_name})`,
    }
  }
}

function processIsoformDataFile(json: any, geneModel: any) {
  const colourPalette = nmetPalette

  let annotationsConfig = {} // a dictionary of annotations where the key is the annotation name
  const subjectType = json['subject_type']
  const nivoAnnotations: Array<{}> = []
  // fetching data for the gene model
  const { geneModelData, canonicalExons } = extractExonData(geneModel)

  const { annotFields } = getAnnotFieldsFromSubject(
    json.subjects[0].annotations,
  )

  const colouredSubjects: Array<{}> = []
  const subjectIds: Array<string> = []
  json.subjects.forEach((subject: any) => {
    // Assigning colours to the annotations if they exist
    const annotatedDataForThisId: Array<{}> = []
    const annotations = subject['annotations']
    annotFields?.forEach((annotField: any) => {
      const target = annotations.find((annotation: any) => {
        return annotation.type === annotField
      })
      if (target.value === '') {
        target.value = 'N/A'
      }
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

function getAnnotFieldsFromSubject(annotations: any) {
  const annotFields: Array<any> = []
  annotations.forEach((annotation: any) => {
    annotFields.push(annotation.type)
  })
  return { annotFields: annotFields }
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
