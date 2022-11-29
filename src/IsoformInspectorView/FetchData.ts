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

//@ts-ignore
export function getNivoHmData(
  dataState: string,
  subjectType: string,
  subjects: Array<Subject>,
) {
  if (dataState === 'done') {
    const { subject, features, data } = getHeatmapData(subjectType, subjects)
    return { subject, features, data }
  }
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

let nextIndex = 1
// colour-blind friendly palette retrieved from https://www.nature.com/articles/nmeth.1618
const colourPalette = [
  // '#000000',
  '#e69d00',
  '#56b3e9',
  '#009e74',
  '#f0e442',
  '#0071b2',
  '#d55c00',
  '#cc79a7',
]
let colours = {}

export async function fetchLocalData(geneId: string) {
  // TODO: hardcoded
  const subjectType: string = 'sample'
  const featureType: string = 'junction_quantifications'
  // const observationType: string = 'read_counts';
  const subjects: Array<Subject> = []
  const nivoAnnotations: Array<{}> = []
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
              [annotations[annotField]]: colourPalette[0],
            },
          }
        }
        // @ts-ignore
        const colour = colours[annotField][annotations[annotField]]
        if (!colour) {
          colours = {
            ...colours,
            [annotField]: {
              // @ts-ignore
              ...colours[annotField],
              [annotations[annotField]]: colourPalette[nextIndex],
            },
          }
          if (nextIndex === 7) {
            nextIndex = 0
          } else {
            nextIndex++
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
  return { subjectType, subjects, nivoAnnotations, subjectIds }
}

function getHeatmapData(subjectType: string, subjects: Array<Subject>) {
  var keys: Array<string> = []
  var nivoData: any[] = []

  subjects.forEach((subj, i) => {
    var count_info: { [key: string]: any } = {}
    count_info[subjectType] = subj.subject_id

    subj.features.forEach((feature: any, j: number) => {
      if (!keys.includes(feature.feature_id)) {
        keys.push(feature.feature_id)
      }

      count_info[feature.feature_id] = feature.value
    })

    let nivoDataObj = []

    for (const [key, value] of Object.entries(count_info)) {
      if (key !== 'sample') {
        nivoDataObj.push({
          x: key,
          y: value,
        })
      }
    }
    nivoData.push({
      id: count_info.sample,
      data: nivoDataObj,
      annotation: subj.annotation,
    })
  })

  return {
    subject: 'sample',
    features: keys,
    data: nivoData,
  }
}
