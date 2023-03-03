import { MenuItem } from '@jbrowse/core/ui'
import { ElementId } from '@jbrowse/core/util/types/mst'
import { types, Instance, flow } from 'mobx-state-tree'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import SpeakerNotesIcon from '@mui/icons-material/SpeakerNotes'
import HighlightIcon from '@mui/icons-material/Highlight'
import { getSession } from '@jbrowse/core/util'

import { fetchLocalData, getNivoHmData, mapSpliceJunctions } from './FetchData'
import ToggleAnnotationsDialog from './components/ToggleAnnotationsDialog'

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
// colour-blind friendly palette retrieved from https://personal.sron.nl/~pault/
const paultPalette = [
  '#4477aa',
  '#66ccee',
  '#228833',
  '#ccbb44',
  '#ee6677',
  '#aa3377',
  '#bbbbbb',
]

export default function IsoformInspectorView() {
  return types
    .model('IsoformInspectorView', {
      id: ElementId,
      type: types.literal('IsoformInspectorView'),
      displayName: 'Transcript Isoform Inspector',
      dataState: 'noData',
      initialized: false,
      geneId: '',
      width: 850,
      height: 500,
      top: 65,
      keys: types.array(types.string),
      colourPalette: types.frozen(nmetPalette),
      defaultPalettes: types.frozen([nmetPalette, paultPalette]),
      geneModel: types.frozen(),
      annotationsConfig: types.frozen({}),
      showRows: true,
      showCols: true,
      cluster: false,
      showCanonicalExons: true,
      showCovPlot: true,
    })
    .volatile(() => ({
      data: undefined as unknown as any,
      nivoData: undefined as unknown as any,
      clusterData: undefined as unknown as any,
      nivoAnnotations: undefined as unknown as any,
      geneModelData: undefined as unknown as any,
      canonicalExons: undefined as unknown as any,
      spliceJunctions: undefined as unknown as any,
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
      setGeneModel(model: any) {
        self.geneModel = model
      },
      setTop(top: number) {
        self.top = top
      },
      setNivoAnnotations(annotsToHide: Array<{}>) {
        let revisedAnnots: Array<{}> = []
        let revisedData: Array<{}> = []
        let revisedConfig = {
          ...self.annotationsConfig,
        }

        Object.entries(self.annotationsConfig).forEach(([key, value]) => {
          const target = annotsToHide.find((annot: any) => annot.field === key)
          if (target) {
            const newConfig = {
              // @ts-ignore
              ...value,
              // @ts-ignore
              show: target.show,
            }
            // @ts-ignore
            revisedConfig[key] = newConfig
          }
        })

        self.nivoData.data.forEach((subject: any) => {
          subject.annotation.data.forEach((annotField: any) => {
            // @ts-ignore
            if (revisedConfig[annotField.x]?.show) {
              revisedData.push(annotField)
            }
          })
          revisedAnnots = [
            ...revisedAnnots,
            { id: subject.id, data: revisedData },
          ]
          revisedData = []
        })
        self.annotationsConfig = revisedConfig
        self.nivoAnnotations = revisedAnnots
      },
      getAndSetNivoData() {
        self.nivoData = getNivoHmData(
          self.dataState,
          self.showCols,
          self.showRows,
          self.cluster,
          self.data.subjects,
        )
        self.clusterData = self.nivoData.clusterData
      },
      setOnLoadProperties(data: any) {
        this.setSubjects(data.subjects)
        this.setSubjectIds(data.subjectIds)
        self.data = data
        self.dataState = 'done'
        this.getAndSetNivoData()
        self.canonicalExons = data.canonicalExons
        self.geneModelData = data.geneModelData
        self.spliceJunctions = mapSpliceJunctions(
          self.nivoData.data,
          self.geneModelData,
        )
        if (Object.keys(self.annotationsConfig).length === 0)
          self.annotationsConfig = data.annotationsConfig
        this.setNivoAnnotations([])
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
      setClusterData(data: any) {
        self.clusterData = data
      },
      setDataState(state: string) {
        self.dataState = state
      },
      loadGeneData: flow(function* (geneId) {
        self.dataState = 'pending'
        try {
          const localData = yield fetchLocalData(
            self.geneModel,
            geneId,
            self.colourPalette,
          )
          self.setOnLoadProperties(localData)
        } catch (error) {
          self.error = error
        }
      }),
      setGeneId(geneId: string) {
        self.geneId = geneId
      },
      setColours(colours: any) {
        self.annotationsConfig = colours
      },
      runClustering() {
        const session = getSession(self)
        if (self.cluster) {
          session.notify('The data is already clustered', 'info')
        } else {
          self.cluster = true
          self.getAndSetNivoData()
          self.setNivoAnnotations([])
          session.notify('The data has been clustered', 'info')
        }
      },
      runSortById() {
        const session = getSession(self)
        self.cluster = false
        self.getAndSetNivoData()
        self.setNivoAnnotations([])
        session.notify('The data has been sorted by id', 'info')
      },
      toggleHeatmapData(location: 'row' | 'column') {
        const session = getSession(self)
        location === 'row'
          ? (self.showRows = !self.showRows)
          : (self.showCols = !self.showCols)
        self.getAndSetNivoData()
        session.notify(
          `${location === 'row' ? 'Rows' : 'Columns'} with no reads have been ${
            self.showCols ? 'revealed' : 'hidden'
          } on the heatmap`,
          'info',
        )
        self.setNivoAnnotations([])
      },
      toggleCanonicalExons() {
        const session = getSession(self)
        self.showCanonicalExons = !self.showCanonicalExons
        session.notify(
          `Canonical exon model has been ${
            self.showCanonicalExons ? 'revealed' : 'hidden'
          }`,
          'info',
        )
      },
      toggleCoveragePlot() {
        self.showCovPlot = !self.showCovPlot
      },
      toggleAnnotationsBars() {
        getSession(self).queueDialog((handleClose) => [
          ToggleAnnotationsDialog,
          { model: self, handleClose },
        ])
      },
    }))
    .views((self) => ({
      menuItems(): MenuItem[] {
        const menuItems: MenuItem[] = [
          {
            label: 'Heatmap...',
            subMenu: [
              {
                label: `${self.showRows ? 'Hide' : 'Show'} rows with no reads`,
                icon: self.showRows ? VisibilityOffIcon : VisibilityIcon,
                onClick: () => {
                  self.toggleHeatmapData('row')
                },
              },
              {
                label: `${
                  self.showCols ? 'Hide' : 'Show'
                } columns with no reads`,
                icon: self.showCols ? VisibilityOffIcon : VisibilityIcon,
                onClick: () => {
                  self.toggleHeatmapData('column')
                },
              },
              {
                label: 'Emphasize cell/sample',
                icon: HighlightIcon,
                disabled: true,
                onClick: () => {
                  console.log(
                    'Opens a separate menu where a user can type in a cell or sample to emphasize. When submitted, draws a box around that row or column',
                  )
                },
              },
            ],
          },
          {
            label: 'Gene model...',
            subMenu: [
              {
                label: `${
                  self.showCanonicalExons ? 'Hide' : 'Show'
                } canonical exons`,
                icon: self.showCanonicalExons
                  ? VisibilityOffIcon
                  : VisibilityIcon,
                onClick: () => {
                  self.toggleCanonicalExons()
                },
              },
              {
                label: `${
                  self.showCovPlot ? 'Hide' : 'Show'
                } exon coverage plot`,
                icon: self.showCovPlot ? VisibilityOffIcon : VisibilityIcon,
                disabled: true,
                onClick: () => {
                  self.toggleCoveragePlot()
                  console.log(
                    'Shows or hides the exon coverage plot below the canonical exon, this option should be disabled if canonical exons are disabled',
                  )
                },
              },
            ],
          },
          {
            label: 'Annotations...',
            icon: SpeakerNotesIcon,
            onClick: () => {
              self.toggleAnnotationsBars()
            },
          },
          {
            label: 'Toggle junction mode',
            disabled: true,
            onClick: () => {
              console.log(
                'TBD the wording and placement of this, but basically just toggles between junction and exon features',
              )
            },
          },
          {
            label: 'Sort...',
            subMenu: [
              {
                label: 'by clustering',
                onClick: () => {
                  self.runClustering()
                },
              },
              {
                label: 'by subject id',
                onClick: () => {
                  self.runSortById()
                },
              },
              {
                label: 'by annotation',
                disabled: true,
                onClick: () => {
                  self.cluster = false
                  console.log(
                    'opens a sorting menu and allows user to select an annotation to sort by e.g. all specimens in project A appear first',
                  )
                },
              },
            ],
          },
          {
            label: 'Filter by annotation',
            disabled: true,
            onClick: () => {
              console.log(
                'opens filtering menu and allows user to select an annotation to filter by (e.g. filter out anything that isnt in project X)',
              )
            },
          },
        ]

        return menuItems
      },
    }))
}

export type IsoformInspectorStateModel = ReturnType<typeof IsoformInspectorView>
export type IsoformInspectorModel = Instance<IsoformInspectorStateModel>
