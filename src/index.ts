import Plugin from '@jbrowse/core/Plugin'
import PluginManager from '@jbrowse/core/PluginManager'
import {
  AbstractSessionModel,
  isAbstractMenuManager,
  getSession,
} from '@jbrowse/core/util'
import { version } from '../package.json'

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
                      onClick: () => {
                        const session = getSession(self)
                        session.addView('IsoformInspectorView', {})
                        // @ts-ignore
                        session.views[session.views.length - 1].setGeneId(
                          feature.data.gene_id,
                        )
                        // @ts-ignore
                        session.views[session.views.length - 1].loadGeneData(
                          feature.data.gene_id,
                        )
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

  configure(pluginManager: PluginManager) {
    // TODO: remove this, this is for development only
    if (isAbstractMenuManager(pluginManager.rootModel)) {
      pluginManager.rootModel.appendToMenu('Add', {
        label: 'Isoform Inspector view',
        onClick: (session: AbstractSessionModel) => {
          session.addView('IsoformInspectorView', {})
          // @ts-ignore
          session.views[session.views.length - 1].setGeneId(
            'ENSG00000068878.10',
          )
        },
      })
    }
  }
}
