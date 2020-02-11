import { IViewModel, ISqlColumn, IView, IFormedView, IViewRoleRaw, IViewRole } from './types'

import { SqlTypes, SQL_TYPES } from 'app/globalConstants'
import { ModelTypeSqlTypeSetting, VisualTypeSqlTypeSetting, ViewModelVisualTypes, ViewModelTypes } from './constants'

export function getFormedView (view: IView): IFormedView {
  const { model, variable, roles } = view
  const formedView = {
    ...view,
    model: JSON.parse((model || '{}')),
    variable: JSON.parse((variable || '[]')),
    roles: (roles as IViewRoleRaw[]).map<IViewRole>(({ roleId, columnAuth, rowAuth }) => ({
      roleId,
      columnAuth: JSON.parse(columnAuth || '[]'),
      rowAuth: JSON.parse(rowAuth || '[]')
    }))
  }
  return formedView
}

function getMapKeyByValue (value: SqlTypes, map: typeof VisualTypeSqlTypeSetting | typeof ModelTypeSqlTypeSetting) {
  let result
  Object.entries(map).some(([key, values]) => {
    if (values.includes(value)) {
      result = key
      return true
    }
  })
  return result
}

export function getValidModel (model: IViewModel, sqlColumns: ISqlColumn[]) {
  if (!Array.isArray(sqlColumns)) { return {} }

  const validModel = sqlColumns.reduce<IViewModel>((accModel, column) => {
    const { name: columnName, type: columnType } = column
    const modelItem = model[columnName]
    if (!modelItem) {
      accModel[columnName] = {
        sqlType: columnType,

        // model item which columnType not registered with SQL_TYPES in globalConstants.ts
        // its default visualType is String and modelType is Category
        visualType: getMapKeyByValue(columnType, VisualTypeSqlTypeSetting) || ViewModelVisualTypes.String,
        modelType: getMapKeyByValue(columnType, ModelTypeSqlTypeSetting) || ViewModelTypes.Category
      }
    } else {
      accModel[columnName] = { ...modelItem, sqlType: columnType } // update newest sqlType
      // verify modelType & visualType are valid by the sqlType or not
      if (SQL_TYPES.includes(columnType)) { // model item which columnType not registered with SQL_TYPES do not need verify
        if (!ModelTypeSqlTypeSetting[modelItem.modelType].includes(columnType)) {
          accModel[columnName].modelType = getMapKeyByValue(columnType, ModelTypeSqlTypeSetting)
        }
        if (!VisualTypeSqlTypeSetting[modelItem.visualType].includes(columnType)) {
          accModel[columnName].visualType = getMapKeyByValue(columnType, VisualTypeSqlTypeSetting)
        }
        // @TODO changed modelType or visualType need be shown in step2 corresponding model table cell
      }
    }
    return accModel
  }, {})

  return validModel
}

export function getValidRoleModelNames (model: IViewModel, modelNames: string[]) {
  if (!Array.isArray(modelNames)) { return [] }

  const validModelNames = modelNames.filter((name) => !!model[name])
  return validModelNames
}
