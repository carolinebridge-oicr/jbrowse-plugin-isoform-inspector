import Plugin from '@jbrowse/core/Plugin'
import PluginManager from '@jbrowse/core/PluginManager'
import { AbstractSessionModel, isAbstractMenuManager } from '@jbrowse/core/util'
import { version } from '../package.json'

import IsoformInspectorViewF from './IsoformInspectorView'

export default class IsoformInspectorPlugin extends Plugin {
  name = 'IsoformInspector'
  version = version

  install(pluginManager: PluginManager) {
    pluginManager.addViewType(() =>
      pluginManager.jbrequire(IsoformInspectorViewF),
    )
  }

  configure(pluginManager: PluginManager) {
    if (isAbstractMenuManager(pluginManager.rootModel)) {
      pluginManager.rootModel.appendToMenu('Add', {
        label: 'Isoform Inspector view',
        onClick: (session: AbstractSessionModel) => {
          session.addView('IsoformInspectorView', {})
        },
      })
    }
  }
}
