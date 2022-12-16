import Plugin from '@jbrowse/core/Plugin'
import PluginManager from '@jbrowse/core/PluginManager'
import {
  AbstractSessionModel,
  isAbstractMenuManager,
  getSession,
} from '@jbrowse/core/util'
import { version } from '../package.json'
import { fetchLocalData } from './IsoformInspectorView/FetchData'

import IsoformInspectorViewF from './IsoformInspectorView'

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

export default class IsoformInspectorPlugin extends Plugin {
  name = 'IsoformInspector'
  version = version

  install(pluginManager: PluginManager) {
    pluginManager.addViewType(() =>
      pluginManager.jbrequire(IsoformInspectorViewF),
    )

    pluginManager.addToExtensionPoint(
      'Core-extendPluggableElement',
      (pluggableElement) => {
        // @ts-ignore
        if (pluggableElement.name === 'LinearBasicDisplay') {
          // @ts-ignore
          const { stateModel } = pluggableElement
          const newStateModel = stateModel.extend((self: any) => {
            const superContextMenuItems = self.contextMenuItems
            return {
              views: {
                contextMenuItems() {
                  const feature = self.contextMenuFeature
                  if (!feature) {
                    return superContextMenuItems()
                  }
                  return [
                    ...superContextMenuItems(),
                    {
                      label: 'Open in the Isoform Inspector',
                      onClick: async () => {
                        const session = getSession(self)
                        // get the geneId from the feature clicked
                        const geneId = feature.data.gene_id
                        try {
                          // retrieving and setting data within the model
                          const data = await fetchLocalData(geneId, nmetPalette)
                          if (data) {
                            session.addView('IsoformInspectorView', {})
                            const view = session.views[session.views.length - 1]
                            // @ts-ignore
                            view.setGeneId(geneId)
                            // @ts-ignore
                            view.setOnLoadProperties(data)
                          }
                        } catch (error) {
                          session.notify(
                            `Data for the selected gene unavailable. ${error}`,
                            'error',
                          )
                        }
                      },
                    },
                  ]
                },
              },
            }
          })
          // @ts-ignore
          pluggableElement.stateModel = newStateModel
        }
        return pluggableElement
      },
    )
  }

  configure(pluginManager: PluginManager) {}
}
