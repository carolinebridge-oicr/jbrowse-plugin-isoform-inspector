import { types, Instance, flow } from 'mobx-state-tree'
import { fetchLocalData, getNivoHmData } from './FetchData'

export default function IsoformInspectorView() {
  return types
    .model('IsoformInspectorView', {
      type: types.literal('IsoformInspectorView'),
      displayName: 'Transcript Isoform Inspector',
      dataState: 'noData',
      geneId: '',
      colors: 'greens',
      width: 800,
      height: 500,
      keys: types.array(types.string),
    })
    .volatile(() => ({
      data: undefined as unknown as any,
      nivoData: undefined as unknown as any,
      error: undefined as unknown as any,
      currentSubjectId: undefined as unknown as any,
      currentFeatureId: undefined as unknown as any,
      currentScoreVal: undefined as unknown as any,
      uiState: {},
      subjects: {},
      features: {},
    }))
    .actions((self) => ({
      setSubjects(subjects: any) {
        self.subjects = subjects
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
    }))
    .actions((self) => ({
      // unused but required by your view
      setWidth() {},
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
      setGeneId: flow(function* (geneId) {
        self.dataState = 'pending'
        try {
          const localData = yield fetchLocalData(geneId)
          self.setSubjects(localData.subjects)
          self.data = localData
          self.dataState = 'done'
          self.nivoData = getNivoHmData(
            self.dataState,
            self.data.subjectType,
            self.data.subjects,
          )
          self.geneId = geneId
        } catch (error) {
          self.error = error
        }
      }),
      setColors(colors: string) {
        self.colors = colors
      },
    }))
}

export type IsoformInspectorStateModel = ReturnType<typeof IsoformInspectorView>
export type IsoformInspectorModel = Instance<IsoformInspectorStateModel>
