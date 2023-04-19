import Plugin from '@jbrowse/core/Plugin'
import PluginManager from '@jbrowse/core/PluginManager'
import { getSession } from '@jbrowse/core/util'
import { version } from '../package.json'
import { fetchLocalDataFromName } from './IsoformDataAdapter/IsoformDataAdapter'

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
                        const geneName = feature.data.gene_name
                        const geneModel = feature.data
                        try {
                          try {
                            const data = await fetchLocalDataFromName(
                              geneName,
                              geneId,
                              geneModel,
                            )
                            session.addView('IsoformInspectorView', {
                              geneId: geneId,
                              geneModel: geneModel,
                              isImport: false,
                            })
                            // TODO: possible to set the onLoad properties as the default config
                            //  instead of through a method but might be breaking for how the refresh
                            //  is currently done
                            const view = session.views[session.views.length - 1]
                            // @ts-ignore
                            view.setOnLoadProperties(data, true)
                          } catch (error) {
                            session.notify(
                              `You are viewing this import form because there is insufficient data for this gene in public/data`,
                              'info',
                            )
                            session.addView('IsoformInspectorView', {
                              geneId: geneId,
                              geneModel: geneModel,
                              isImport: true,
                            })
                          }
                        } catch (error) {
                          session.notify(
                            `Unable to open the isoform inspector: ${error}`,
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
