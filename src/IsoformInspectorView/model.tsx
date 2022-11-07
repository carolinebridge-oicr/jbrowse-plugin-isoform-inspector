import { types, Instance, flow } from 'mobx-state-tree'
import { createContext, useContext } from 'react'
import { fetchLocalData, getNivoHmData, getVisxHmData } from './FetchData'

export default function IsoformInspectorView() {
  return types
    .model('IsoformInspectorView', {
      type: types.literal('IsoformInspectorView'),
      displayName: 'Transcript Isoform Inspector',
      geneId: '',
      colors: 'greens',
      width: 800,
      height: 500,
      keys: types.array(types.string),
      dataState: 'noData',
    })
    .volatile(() => ({
      data: undefined as unknown as any,
      nivoData: undefined as unknown as any,
      visxData: undefined as unknown as any,
      error: undefined as unknown as any,
    }))
    .actions((self) => ({
      // unused but required by your view
      setWidth() {},

      setDisplayName(displayName: string) {
        self.displayName = displayName
      },
      setGeneId: flow(function* (geneId) {
        self.dataState = 'pending'
        try {
          const localData = yield fetchLocalData(geneId)
          self.data = localData
          self.dataState = 'done'
          self.nivoData = getNivoHmData(
            self.dataState,
            self.data.subjectType,
            self.data.subjects,
          )
          self.visxData = getVisxHmData(
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
    .views((self) => ({
      //@ts-ignore
      heatmapData(chartLib: string) {
        if (chartLib === 'nivo') {
          return getNivoHmData(
            self.dataState,
            self.data.subjectType,
            self.data.subjects,
          )
        } else if (chartLib === 'visx') {
          return getVisxHmData(
            self.dataState,
            self.data.subjectType,
            self.data.subjects,
          )
        }
      },
    }))
}

export type IsoformInspectorStateModel = ReturnType<typeof IsoformInspectorView>
export type IsoformInspectorModel = Instance<IsoformInspectorStateModel>

let _store: any = null

export function initializeStore() {
  _store = IsoformInspectorView().create({
    type: 'IsoformInspectorView',
    displayName: 'Transcript Isoform Inspector',
    geneId: '',
    colors: 'greens',
    width: 800,
    height: 500,
    keys: [],
    dataState: 'noData',
  })
  return _store
}

export type IsoformInspectorInstance = Instance<typeof IsoformInspectorView>
const IsoformInspectorStoreContext =
  createContext<null | IsoformInspectorInstance>(null)
export const Provider = IsoformInspectorStoreContext.Provider

export function useStore(): Instance<typeof IsoformInspectorView> {
  const store = useContext(IsoformInspectorStoreContext)
  if (store === null) {
    throw new Error('Store cannot be null, please add a context provider')
  }
  return store
}
