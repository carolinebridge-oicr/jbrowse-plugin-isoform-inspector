const localDataFolder = 'data'
const subjectIds = [
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
]

export interface Feature {
  feature_id: string
  value: number
}

export interface Subject {
  subject_id: string
  features: Feature[]
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

export async function fetchLocalData(geneId: string) {
  const subjectType: string = 'sample'
  const featureType: string = 'junction_quantifications'
  // const observationType: string = 'read_counts';
  const subjects: Array<Subject> = []
  const fetchAll = new Promise(async (resolve, reject) => {
    subjectIds.forEach(async (subjectId) => {
      const dataPath = [
        localDataFolder,
        'observations',
        geneId,
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
          subjects.push(jsonObj.subjects[0])
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
  return { subjectType, subjects }
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
    nivoData.push({ id: count_info.sample, data: nivoDataObj })
  })

  return {
    subject: 'sample',
    features: keys,
    data: nivoData,
  }
}
