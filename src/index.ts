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
                          const data = await fetchLocalData(geneId)
                          if (data) {
                            session.addView('IsoformInspectorView', {})
                            const view = session.views[session.views.length - 1]
                            // @ts-ignore
                            view.setData(data)
                            // @ts-ignore
                            view.setDataState('done')
                            // @ts-ignore
                            view.setGeneId(geneId)
                            // @ts-ignore
                            view.getAndSetNivoData()
                            // @ts-ignore
                            // view.setGeneModelData(feature.data)
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
