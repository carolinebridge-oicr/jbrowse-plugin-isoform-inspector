const localDataFolder = 'data'
// todo: hardcoded
export const subjectIds = [
  'SA407918',
  'SA407986',
  'SA408414',
  'SA408530',
  'SA408570',
  'SA408706',
  'SA408758',
  'SA408891',
  'SA409186',
  'SA409258',
  'SA409310',
  'SA409342',
  'SA409446',
  'SA409498',
  'SA409543',
  'SA409622',
  'SA409662',
  'SA409711',
  'SA409775',
  'SA410118',
  'SA410207',
  'SA410234',
  'SA410263',
  'SA410310',
  'SA410311',
  'SA410350',
  'SA410383',
  'SA410410',
  'SA410535',
  'SA410582',
  'SA410687',
  'SA410742',
  'SA410750',
  'SA410758',
  'SA410763',
  'SA410859',
  'SA410883',
  'SA410899',
  'SA410911',
  'SA411001',
  'SA411029',
  'SA411189',
  'SA411209',
  'SA411241',
  'SA411305',
  'SA411397',
  'SA411406',
  'SA411430',
  'SA411557',
  'SA411578',
  'SA411721',
  'SA411745',
  'SA411769',
  'SA411797',
  'SA411833',
  'SA411923',
  'SA412076',
  'SA412212',
  'SA412299',
  'SA507131',
  'SA507134',
  'SA507135',
  'SA507144',
  'SA507147',
  'SA507155',
  'SA507158',
  'SA507167',
  'SA507174',
  'SA507176',
  'SA507177',
  'SA507179',
  'SA507194',
  'SA507197',
  'SA507216',
  'SA507217',
  'SA507219',
  'SA507228',
  'SA507232',
  'SA507237',
  'SA507240',
  'SA507249',
  'SA507252',
  'SA507253',
  'SA507261',
  'SA507262',
  'SA507264',
  'SA507271',
  'SA507272',
  'SA507275',
  'SA507285',
  'SA507305',
  'SA507308',
  'SA507315',
  'SA507317',
  'SA507320',
  'SA507324',
  'SA507339',
  'SA507341',
  'SA507344',
  'SA507351',
  'SA507372',
  'SA507375',
  'SA507376',
  'SA507379',
  'SA507384',
  'SA507387',
  'SA507388',
  'SA507396',
  'SA507399',
  'SA507408',
  'SA507411',
  'SA507424',
  'SA507439',
  'SA507442',
  'SA507446',
  'SA507455',
  'SA507458',
  'SA507466',
  'SA507467',
  'SA507469',
  'SA507487',
  'SA507492',
  'SA507494',
  'SA507495',
  'SA507497',
  'SA507504',
  'SA507506',
  'SA507507',
  'SA507509',
  'SA507539',
  'SA507542',
  'SA507557',
  'SA507566',
  'SA507575',
  'SA507578',
  'SA507587',
  'SA518603',
  'SA518614',
  'SA518615',
  'SA518630',
  'SA518637',
  'SA518665',
  'SA518695',
  'SA518704',
  'SA518716',
  'SA518750',
  'SA518765',
  'SA518806',
  'SA518817',
  'SA528675',
  'SA528687',
  'SA528695',
  'SA528709',
  'SA528761',
  'SA528768',
]

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
      if (val.start >= arr[i].start && val.end <= arr[i].end) {
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

  // we can calculate our pixelsPerBase by the number of introns truncated and the length of the gene
  const totalTruncatedBy = introns.reduce((acc: any, intron: any) => {
    if (intron.truncated) return acc + intron.truncatedBy
    return 0
  }, 0)
  const maxPixels = 1200 * 0.9
  const pixelsPerBase = maxPixels / (data.end - data.start - totalTruncatedBy)

  // now we can use our array of introns to advise how to draw the transcripts
  const transcripts: Array<{}> = []
  data.transcripts.forEach((transcript: any) => {
    let truncatedBy = 0
    let intronStartOffset = 0
    introns.forEach((intron: any) => {
      if (
        transcript.start <= intron.start &&
        transcript.end >= intron.end &&
        intron.truncated
      ) {
        truncatedBy += intron.truncatedBy
      }
      if (transcript.start >= intron.end && intron.truncated) {
        intronStartOffset += intron.truncatedBy
      }
    })

    let drawnTranscriptX1 = 0
    if (transcript.start >= data.start) {
      drawnTranscriptX1 = Math.floor(
        (transcript.start - data.start - intronStartOffset) * pixelsPerBase,
      )
    }

    const drawnTranscriptLineLength = Math.floor(
      (transcript.end - transcript.start - truncatedBy) * pixelsPerBase,
    )

    const drawnTranscriptX2 = Math.floor(
      drawnTranscriptX1 + drawnTranscriptLineLength,
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
            length: (nextStart - exon.end) * pixelsPerBase,
          }
          startLoc = Math.floor(startLoc + drawnExonRectWidth + gap.length)

          introns.forEach((intron: any) => {
            if (
              gap.start <= intron.start &&
              gap.end >= intron.end &&
              intron.truncated
            ) {
              startLoc -= Math.floor(intron.truncatedBy * pixelsPerBase)
            }
          })
        }
      })

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
  const dataPath = [
    localDataFolder,
    'features',
    'genes',
    `${geneId}.json`,
  ].join('/')

  const response = await fetch(dataPath, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  })

  const json = await response.json()

  return extractExonData(json[geneId])
}

export async function fetchSubjectAnnotations(subjectId: string) {
  const dataPath = [
    localDataFolder,
    'subjects',
    subjectId,
    'annotations.json',
  ].join('/')

  const response = await fetch(dataPath, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  })

  const myJson = await response.json()

  let annotFields: string[] = []
  let annotations: { [key: string]: string | number } = {}

  for (const annot of myJson.annotations) {
    if (!annotFields.includes(annot.type)) annotFields.push(annot.type)
    annotations[annot.type] = annot.value
  }

  return { annotFields, annotations }
}

let colours = {}

export async function fetchLocalData(geneId: string, colourPalette: any) {
  // TODO: hardcoded
  const subjectType: string = 'sample'
  const featureType: string = 'junction_quantifications'
  // const observationType: string = 'read_counts';
  const subjects: Array<Subject> = []
  const nivoAnnotations: Array<{}> = []
  // fetching data for the gene model
  const { geneModelData, canonicalExons } = await fetchGeneModelData(geneId)
  const fetchAll = new Promise(async (resolve, reject) => {
    subjectIds.forEach(async (subjectId) => {
      // fetching the data for the annotations
      const { annotFields, annotations } = await fetchSubjectAnnotations(
        subjectId,
      )

      const annotatedDataForThisId: Array<{}> = []
      annotFields.forEach((annotField) => {
        // @ts-ignore
        if (!colours[annotField]) {
          colours = {
            ...colours,
            [annotField]: {
              index: 0,
              [annotations[annotField]]:
                // @ts-ignore
                colourPalette[0],
            },
          }
        }
        // @ts-ignore
        const colour = colours[annotField][annotations[annotField]]
        if (!colour) {
          // @ts-ignore
          const index = colours[annotField].index + 1
          colours = {
            ...colours,
            [annotField]: {
              // @ts-ignore
              ...colours[annotField],
              index: index,
              [annotations[annotField]]: colourPalette[index]
                ? colourPalette[index]
                : 'black',
            },
          }
        }
        annotatedDataForThisId.push({
          x: annotField,
          y: colourPalette.findIndex(
            // @ts-ignore
            (colour) => colour === colours[annotField][annotations[annotField]],
          ),
          value: annotations[annotField],
          // @ts-ignore
          colour: colours[annotField][annotations[annotField]],
        })
      })

      nivoAnnotations.push({
        id: subjectId,
        data: annotatedDataForThisId,
      })

      // fetching the data for the heatmap
      const dataPath = [
        localDataFolder,
        'observations',
        geneId,
        'subjects',
        subjectId,
        'observations',
        featureType + '.json',
      ].join('/')

      await fetch(dataPath, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      })
        .then((response) => {
          if (!response.ok) {
            throw Error(response.statusText)
          }
          return response.json()
        })
        .then((jsonObj) => {
          subjects.push({
            ...jsonObj.subjects[0],
            annotation: {
              id: subjectId,
              data: annotatedDataForThisId,
            },
          })
          if (subjectIds.length === subjects.length) {
            resolve(1)
          }
        })
        .catch((error) => {
          reject(error)
        })
    })
  })
  await fetchAll
  return {
    subjectType,
    subjects,
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
      let status = 'KNOWN' // TODO: eventually this will come from the splice_junstions.json file instead
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
