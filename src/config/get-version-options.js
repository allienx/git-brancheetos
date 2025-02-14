import { VersionType } from './version-type.js'

export default function getVersionOptions({ config, latestVersion }) {
  switch (config.versioningType) {
    case VersionType.SemVer:
      return getSemanticVersionOptions({ latestVersion })

    case VersionType.YearMajorMinor:
      return getYearMajorMinorOptions({ latestVersion })

    default:
      return null
  }
}

function getSemanticVersionOptions({ latestVersion }) {
  const version = latestVersion || ''
  const prefix = version.startsWith('v') ? 'v' : ''

  let [major, minor, patch] = version.replace('v', '').split('.')

  if (!major || !minor || !patch) {
    return ['0.0.1', '0.1.0', '1.0.0']
  }

  major = Number(major)
  minor = Number(minor)
  patch = Number(patch)

  return [
    `${prefix}${major}.${minor}.${patch + 1}`,
    `${prefix}${major}.${minor + 1}.0`,
    `${prefix}${major + 1}.0.0`,
  ]
}

function getYearMajorMinorOptions({ latestVersion }) {
  const version = latestVersion || ''
  const prefix = version.startsWith('v') ? 'v' : ''
  const currentYear = new Date().getFullYear()

  let [year, major, minor, patch] = version.replace('v', '').split('.')

  if (!year || !major || !minor) {
    return [`${prefix}${currentYear}.1.1`]
  }

  year = Number(year)
  major = Number(major)
  minor = Number(minor)
  patch = patch ? Number(patch) : 0

  if (currentYear !== year) {
    return [`${prefix}${currentYear}.1.1`]
  }

  return [
    `${prefix}${year}.${major}.${minor}.${patch + 1}`,
    `${prefix}${year}.${major}.${minor + 1}`,
    `${prefix}${year}.${major + 1}.1`,
  ]
}
