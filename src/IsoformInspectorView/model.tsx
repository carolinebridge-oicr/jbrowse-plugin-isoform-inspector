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
        self.allNivoAnnotations.forEach((annotationType: any) => {
          if (
            !annotsToHide.find((element: any) => {
              return element === annotationType['annotField']
            })
          ) {
            revisedAnnots = [...revisedAnnots, annotationType]
          }
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
        currentPanel: 'subjectAnnotation' | 'heatmap' | 'feature' | undefined,
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
