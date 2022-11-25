import { ElementId } from '@jbrowse/core/util/types/mst'
import { types, Instance, flow } from 'mobx-state-tree'
import { fetchLocalData, getNivoHmData } from './FetchData'

export default function IsoformInspectorView() {
  return types
    .model('IsoformInspectorView', {
      id: ElementId,
      type: types.literal('IsoformInspectorView'),
      displayName: 'Transcript Isoform Inspector',
      dataState: 'noData',
      initialized: false,
      geneId: '',
      colors: 'greens',
      width: 800,
      height: 500,
      keys: types.array(types.string),
      hiddenAnnotations: types.array(types.string),
    })
    .volatile(() => ({
      data: undefined as unknown as any,
      nivoData: undefined as unknown as any,
      allNivoAnnotations: undefined as unknown as any,
      nivoAnnotations: undefined as unknown as any,
      // geneModelData: undefined as unknown as any,
      error: undefined as unknown as any,
      currentSubjectId: undefined as unknown as any,
      currentFeatureId: undefined as unknown as any,
      currentScoreVal: undefined as unknown as any,
      currentAnnotation: undefined as unknown as any,
      uiState: {},
      subjects: {},
      features: {},
      subjectIds: [],
    }))
    .actions((self) => ({
      setSubjects(subjects: any) {
        self.subjects = subjects
      },
      setSubjectIds(array: any) {
        self.subjectIds = array
      },
      setCurrentSubjectId(subjectId: string | undefined) {
        self.currentSubjectId = subjectId
      },
      setCurrentFeatureId(featureId: string | undefined) {
        self.currentFeatureId = featureId
      },
      setCurrentScoreVal(score: number | undefined) {
        self.currentScoreVal = score
      },
      setCurrentAnnotation(field: string, value: string) {
        self.currentAnnotation = { field: field, value: value }
      },
      addHiddenAnnotation(annot: string) {
        self.hiddenAnnotations.push(annot)
      },
      removeHiddenAnnotation(annot: string) {
        self.hiddenAnnotations.remove(annot)
      },
      setNivoAnnotations(annotsToHide: Array<string>) {
        let revisedAnnots: Array<{}> = []
        let revisedData: Array<{}> = []

        self.allNivoAnnotations.forEach((subject: any) => {
          subject.data.forEach((annotField: any) => {
            if (!annotsToHide.find((annot: any) => annot === annotField.x)) {
              revisedData.push(annotField)
            }
          })
          revisedAnnots = [
            ...revisedAnnots,
            { id: subject.id, data: revisedData },
          ]
          revisedData = []
        })
        self.nivoAnnotations = revisedAnnots
      },
    }))
    .actions((self) => ({
      // unused but required by your view
      setWidth() {},
      setInitialized(bool: boolean) {
        self.initialized = bool
      },
      setCurrentPanel(
        currentPanel: 'annotations' | 'heatmap' | 'feature' | undefined,
      ) {
        self.uiState = { ...self.uiState, currentPanel: currentPanel }
      },
      setCurrentX(currentX: number | undefined) {
        self.uiState = { ...self.uiState, currentX: currentX }
      },
      setCurrentY(currentY: number | undefined) {
        self.uiState = { ...self.uiState, currentY: currentY }
      },
      setDisplayName(displayName: string) {
        self.displayName = displayName
      },
      setData(data: any) {
        self.data = data
      },
      setNivoData(data: any) {
        self.nivoData = data
      },
      setDataState(state: string) {
        self.dataState = state
      },
      loadGeneData: flow(function* (geneId) {
        self.dataState = 'pending'
        try {
          const localData = yield fetchLocalData(geneId)
          self.setSubjects(localData.subjects)
          self.allNivoAnnotations = localData.nivoAnnotations
          // TODO: when a settings option is added, these can be toggled through that instead of hardcoded
          self.setNivoAnnotations([
            'file_id',
            'object_id',
            'filename',
            'donor_id',
            'specimen_id',
            'size',
          ])
          self.setSubjectIds(localData.subjectIds)
          self.data = localData
          self.dataState = 'done'
          self.nivoData = getNivoHmData(
            self.dataState,
            self.data.subjectType,
            self.data.subjects,
          )
        } catch (error) {
          self.error = error
        }
      }),
      // setGeneModelData(data: any) {
      //   // WIP: coming back to it later
      //   // trial
      //   const truncatedIntronLength = 1000
      //   // Gather the transcripts into an array of arrays
      //   let arrayOfTranscriptArrays: Array<{}> = []
      //   data.subfeatures.forEach((transcript: any) => {
      //     const exonsOnly = transcript.subfeatures.filter(
      //       (subfeature: any) => subfeature.type === 'exon',
      //     )
      //     arrayOfTranscriptArrays.push(exonsOnly.slice().reverse())
      //   })
      //   // Collapse the transcripts into one array
      //   const arrayOfAllTranscriptExons = arrayOfTranscriptArrays.flat()
      //   // sort the array by start location
      //   arrayOfAllTranscriptExons.sort((a: any, b: any) => a.start - b.start)
      //   // Reduce the exons that share a start location to that which is the largest
      //   // @ts-ignore
      //   let currentStartLoc = arrayOfAllTranscriptExons[0].start
      //   let arrayOfOverlappingExons: Array<{}> = []
      //   const collapsedTranscriptExonsArray: Array<{}> = []
      //   const effectedTranscripts: Array<{}> = []
      //   arrayOfAllTranscriptExons.forEach((exon: any) => {
      //     // if you hit an exon that doesn't share the sequence of start locations
      //     if (exon.start !== currentStartLoc) {
      //       // find the exon with the largest length
      //       const targetEndLoc = Math.max(
      //         ...arrayOfOverlappingExons.map((exon: any) => exon.end),
      //       )
      //       const targetExon = arrayOfOverlappingExons.find(
      //         (exon: any) => exon.end === targetEndLoc,
      //       )
      //       if (targetExon) {
      //         // record which transcripts will be effected by the truncated intron
      //         const transcripts: Array<string> = []

      //         arrayOfOverlappingExons.forEach((exon: any) => {
      //           transcripts.push(exon.transcript_name)
      //         })
      //         effectedTranscripts.push({
      //           // @ts-ignore
      //           exonId: targetExon.exon_id,
      //           transcripts,
      //         })
      //         // @ts-ignore
      //         // console.log('pushed exon', targetExon.exon_id)
      //         // assign that exon to the collapsed array
      //         collapsedTranscriptExonsArray.push(targetExon)
      //       }
      //       // reset the overlapping exons array
      //       arrayOfOverlappingExons = [exon]
      //       // set a new starting location to this exon's starting location
      //       currentStartLoc = exon.start
      //     } else {
      //       // the current exon and the previous exon share a start location, add it to the array
      //       arrayOfOverlappingExons.push(exon)
      //     }
      //   })

      //   // console.log(effectedTranscripts)

      //   // loop over the collapsed array and create a new array of introns that must be collapsed
      //   let nextExon = collapsedTranscriptExonsArray[1]
      //   const truncatedIntrons: Array<{}> = []
      //   let totalCutLength = 0
      //   collapsedTranscriptExonsArray.forEach((exon: any, index: number) => {
      //     // console.log('exon of interest', exon.exon_id)
      //     if (index !== collapsedTranscriptExonsArray.length - 1) {
      //       // @ts-ignore
      //       const intronLength = nextExon.start - exon.end
      //       // console.log(intronLength, truncatedIntronLength)
      //       if (intronLength > truncatedIntronLength) {
      //         const obj = effectedTranscripts.find((e: any) => {
      //           return e.exonId === exon.exon_id
      //         })
      //           ? effectedTranscripts.find((e: any) => {
      //               return e.exonId === exon.exon_id
      //             })
      //           : { transcripts: [] }

      //         // console.log(exon.exon_id, obj)
      //         truncatedIntrons.push({
      //           start: exon.end,
      //           // @ts-ignore
      //           end: nextExon.start,
      //           length: intronLength,
      //           // @ts-ignore
      //           affects: obj.transcripts,
      //           cutLength: intronLength - truncatedIntronLength,
      //         })
      //         totalCutLength += intronLength - truncatedIntronLength
      //       }
      //       if (index + 2 !== collapsedTranscriptExonsArray.length) {
      //         nextExon = collapsedTranscriptExonsArray[index + 2]
      //       }
      //     }
      //   })

      //   // console.log('truncated introns', truncatedIntrons)

      //   const truncatedGeneLength = data.end - data.start - totalCutLength

      //   // console.log(data.end, data.start, totalCutLength, truncatedGeneLength)

      //   // MAIN SHIT
      //   // TODO: hardcoded
      //   const maxPixels = 900

      //   console.log(totalCutLength)

      //   const pixelsPerBase = maxPixels / truncatedGeneLength // used to be data.end - data.start

      //   const transcripts: Array<{}> = []
      //   data.subfeatures.forEach((transcript: any) => {
      //     let count = 0
      //     truncatedIntrons.forEach((tIntron: any) => {
      //       const foundI = tIntron.affects.find(
      //         (name: string) => name === transcript.transcript_name,
      //       )
      //       if (foundI) {
      //         count += tIntron.cutLength
      //       }
      //     })

      //     let drawnTranscriptX1 = 0
      //     if (transcript.start >= data.start) {
      //       const startDifference = transcript.start - data.start - count
      //       drawnTranscriptX1 = Math.floor(startDifference * pixelsPerBase)
      //     } else {
      //       // TODO: this shouldn't happen, remove this console after testing
      //       console.log('anomaly')
      //     }
      //     console.log(count, truncatedIntrons)

      //     const drawnTranscriptLineLength = Math.floor(
      //       pixelsPerBase * (transcript.end - transcript.start - count),
      //     )

      //     console.log(pixelsPerBase, drawnTranscriptLineLength)

      //     const exons: Array<{}> = []
      //     let nextStartLoc = Math.floor(drawnTranscriptX1) + 1
      //     let prevEndLoc = 0
      //     // let gapLength = 0
      //     transcript.subfeatures
      //       .slice()
      //       .reverse()
      //       .forEach((exon: any) => {
      //         if (exon.type === 'exon') {
      //           // console.log(exon)
      //           // console.log(exon.end, prevEndLoc)
      //           let gapLength =
      //             prevEndLoc !== 0 ? Math.floor(exon.start - prevEndLoc) : 0
      //           const intron = truncatedIntrons.find(
      //             (intron: any) => intron.start === prevEndLoc,
      //           )
      //           // console.log(intron)
      //           // @ts-ignore
      //           if (intron) {
      //             // console.log(gapLength)
      //             gapLength =
      //               (gapLength -
      //                 // @ts-ignore
      //                 intron.length) *
      //                 pixelsPerBase +
      //               truncatedIntronLength * pixelsPerBase
      //             // console.log('intron', gapLength)
      //           } else {
      //             gapLength = gapLength * pixelsPerBase
      //           }
      //           const drawnExonX = Math.floor(nextStartLoc + gapLength)
      //           // console.log(
      //           //   drawnExonX,
      //           //   '=',
      //           //   Math.floor(nextStartLoc),
      //           //   Math.floor(gapLength),
      //           // )
      //           const drawnExonRectWidth =
      //             Math.floor(pixelsPerBase * (exon.end - exon.start)) > 0
      //               ? Math.floor(pixelsPerBase * (exon.end - exon.start))
      //               : 1
      //           const subfeatureData = {
      //             start: exon.start,
      //             end: exon.end,
      //             length: exon.end - exon.start,
      //             type: exon.type,
      //             status: exon.transcript_status,
      //             drawnExonRectWidth,
      //             drawnExonX,
      //           }
      //           prevEndLoc = exon.end
      //           // console.log('DRAWN EXON X', drawnExonX)
      //           nextStartLoc = drawnExonX + drawnExonRectWidth
      //           exons.push(subfeatureData)
      //         }
      //         // TODO: Question, should I include type features other than exons?
      //       })

      //     const transcriptData = {
      //       start: transcript.start,
      //       end: transcript.end,
      //       length: transcript.end - transcript.start,
      //       status: transcript.transcript_status,
      //       type: transcript.type,
      //       drawnTranscriptLineLength,
      //       drawnTranscriptX1,
      //       drawnTranscriptX2: Math.floor(
      //         drawnTranscriptX1 +
      //           pixelsPerBase * (transcript.end - transcript.start - count),
      //       ),
      //       exons,
      //     }

      //     transcripts.push(transcriptData)
      //   })

      //   let geneModelData = {
      //     name: data.gene_name,
      //     ref: data.refName,
      //     start: data.start,
      //     end: data.end,
      //     length: data.end - data.start,
      //     pixelsPerBase,
      //     drawnGeneTotalLength: maxPixels,
      //     transcripts,
      //   }

      //   self.geneModelData = geneModelData
      // },
      setGeneId(geneId: string) {
        self.geneId = geneId
      },
      setColors(colors: string) {
        self.colors = colors
      },
      getAndSetNivoData() {
        self.nivoData = getNivoHmData(
          self.dataState,
          self.data.subjectType,
          self.data.subjects,
        )
      },
    }))
}

export type IsoformInspectorStateModel = ReturnType<typeof IsoformInspectorView>
export type IsoformInspectorModel = Instance<IsoformInspectorStateModel>
