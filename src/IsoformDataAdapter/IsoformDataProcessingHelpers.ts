import { clusterData } from '@greenelab/hclust'

export interface Feature {
  feature_id: string
  value: number
  status: string
  rpkm: number
  coverage: any
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

export function getNivoHmData(
  dataState: string,
  showCols: boolean,
  showRows: boolean,
  cluster: boolean,
  subjects: Array<Subject>,
  readType: string,
) {
  if (dataState === 'done') {
    const { subject, junctions, exons } = getHeatmapData(
      subjects,
      showCols,
      showRows,
      cluster,
      readType,
    )
    return { subject, junctions, exons }
  }
  return
}

function getHeatmapData(
  subjects: Array<Subject>,
  showCols: boolean,
  showRows: boolean,
  cluster: boolean,
  readType: string,
) {
  let junctionData: any[] = []
  let exonData: any[] = []

  subjects.forEach((subj, i) => {
    const junctionDataObj: Array<any> = []
    const justReads: Array<any> = []
    subj.junctions.forEach((feature) => {
      junctionDataObj.push({
        x: feature.feature_id,
        y:
          readType === 'raw'
            ? feature.value
            : parseFloat(feature.rpkm.toFixed(2)),
        status: feature.status ? feature.status : '',
      })
      justReads.push(
        readType === 'raw'
          ? feature.value
          : parseFloat(feature.rpkm.toFixed(2)),
      )
    })
    if (junctionDataObj.length > 0) {
      junctionData.push({
        id: subj.subject_id,
        data: junctionDataObj,
        justReads,
        annotation: subj.annotation,
      })
    }

    const exonDataObj: Array<any> = []
    subj.exons.forEach((feature) => {
      exonDataObj.push({
        x: feature.feature_id,
        y:
          readType === 'raw'
            ? feature.value
            : parseFloat(feature.rpkm.toFixed(2)),
        status: feature.status ? feature.status : '',
        coverage: feature.coverage,
      })
      justReads.push(
        readType === 'raw'
          ? feature.value
          : parseFloat(feature.rpkm.toFixed(2)),
      )
    })
    if (exonDataObj.length > 0) {
      exonData.push({
        id: subj.subject_id,
        data: exonDataObj,
        justReads,
        annotation: subj.annotation,
      })
    }
  })

  // filter out duplicate id's for now
  junctionData = junctionData.filter(
    (target: any, index: any, array: any) =>
      array.findIndex((t: any) => t.id === target.id) === index,
  )

  let junctionClusterData = {}
  let exonClusterData = {}

  if (!showCols) {
    junctionData = filterNoDataColumns(junctionData)
    exonData = filterNoDataColumns(exonData)
  }
  if (!showRows) {
    junctionData = filterNoDataRows(junctionData)
    exonData = filterNoDataRows(exonData)
  }
  if (cluster) {
    const junctionClusterResult = runClustering(junctionData)
    junctionData = junctionClusterResult.nivoData
    junctionClusterData = junctionClusterResult.cluster
    const exonClusterResult = runClustering(exonData)
    exonData = exonClusterResult.nivoData
    exonClusterData = exonClusterResult.cluster
  } else {
    junctionData.sort((a: any, b: any) => {
      return a.id.localeCompare(b.id)
    })
    exonData.sort((a: any, b: any) => {
      return a.id.localeCompare(b.id)
    })
  }

  return {
    subject: 'sample',
    junctions: {
      data: junctionData,
      clusterData: junctionClusterData,
    },
    exons: {
      data: exonData,
      clusterData: exonClusterData,
    },
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
  const result = cluster.order.map((i: number) => data[i])
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
        value: parseFloat((prevValue + junction.y).toFixed(2)),
        drawnJunctionX1,
        drawnJunctionX2,
      }
    })
  })

  return mappedJunctions
}

export function mapExons(data: any, geneModelData: any) {
  const exonArrays: Array<{}> = []
  geneModelData.transcripts.forEach((transcript: any) => {
    exonArrays.push(transcript.exons)
  })
  const flattenedExons = exonArrays.flat(1)
  const mappedExons = {}
  data.forEach((subject: any) => {
    subject.data.forEach((exon: any, i: number) => {
      const end = exon.x.split(/-|:/)[2]

      const point = flattenedExons.find((exon: any) => {
        return `${exon.end}` === `${end}`
      })

      // @ts-ignore
      const prevValue = mappedExons[exon.x]?.value
        ? // @ts-ignore
          mappedExons[exon.x]?.value
        : 0
      const statusVal =
        exon.status === 'NOVEL' ? 2 : exon.status === 'PUTATIVE' ? 1 : 0
      // @ts-ignore
      mappedExons[exon.x] = {
        x: exon.x,
        y: statusVal,
        label: `E${i + 1}`,
        status: `${exon.status} Exon ${i + 1}`,
        feature_id: exon.x,
        value: parseFloat((prevValue + exon.y).toFixed(2)),
        coverage: exon.coverage,
        // @ts-ignore
        drawnExonX: point.drawnExonX,
        // @ts-ignore
        drawnExonRectWidth: point.drawnExonRectWidth,
      }
    })
  })

  return mappedExons
}
