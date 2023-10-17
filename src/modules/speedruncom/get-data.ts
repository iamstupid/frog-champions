import SpeedrunApiResponse from './models/SpeedrunApiResponse'
import SpeedrunCategory from './models/SpeedrunCategory'
import SpeedrunLevel from './models/SpeedrunLevel'
import SpeedrunVariable from './models/SpeedrunVariable'
import SpeedrunLeaderboard from './models/SpeedrunLeaderboard'
import { fetchLevelCategories, fetchLevelBoard, fetchLevels, fetchLevelVariables, fetchLevelBoardWithVariable } from './wrapper'
import { ARB_RUN_VALUE, Categories, ChapterNames, COLLECTIBLES_VARIABLE_NAME, FC_RUN_VALUE } from './constants/celeste'

interface RawDataCollection {
    categories: SpeedrunApiResponse<SpeedrunCategory[]>,
    levels: SpeedrunApiResponse<SpeedrunLevel[]>,
    grid: SpeedrunApiResponse<SpeedrunLeaderboard>[][],
    variables: SpeedrunApiResponse<SpeedrunVariable[]>[]
}

const getRawLeaderboardData = async (): Promise<RawDataCollection> => {
  const levels = await fetchLevels()
  const categories = (await fetchLevelCategories(levels.data[0]))
  const variables = await Promise.all(levels.data.map((lvl) => fetchLevelVariables(lvl)))
  const grid = await Promise.all(categories.data.map((cat) => {
    return Promise.all(levels.data.map((lvl, i) => {
      if (cat.name === Categories.COLLECTIBLES) {
        if (lvl.name === ChapterNames.C9) return fetchLevelBoard(lvl, cat)

        // find the 2 relevant IDs based on variable name and run value label
        const variable = variables[i].data.find((x) => x.name === COLLECTIBLES_VARIABLE_NAME)
        const label = lvl.name === ChapterNames.C8 ? ARB_RUN_VALUE : FC_RUN_VALUE // Core only has ARB subcat
        const value = Object.entries(variable!.values.values).find(([_key, val]) => val.label === label)

        return fetchLevelBoardWithVariable(lvl, cat, variable!.id, value![0])
      }
      return fetchLevelBoard(lvl, cat)
    }))
  }))

  return {
    categories,
    levels,
    grid,
    variables
  }
}

export { getRawLeaderboardData }
