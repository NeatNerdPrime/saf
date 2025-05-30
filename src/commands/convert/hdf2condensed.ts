import {Flags} from '@oclif/core'
import {ContextualizedProfile, convertFileContextual} from 'inspecjs'
import fs from 'fs'
import {
  calculateCompliance,
  extractControlSummariesBySeverity,
  extractStatusCounts,
  renameStatusName,
  severityTargetsObject,
} from '../../utils/threshold'
import _ from 'lodash'
import {checkSuffix} from '../../utils/global'
import {BaseCommand} from '../../utils/oclif/baseCommand'

export default class HDF2Condensed extends BaseCommand<typeof HDF2Condensed> {
  static readonly usage
    = '<%= command.id %> -i <hdf-scan-results-json> -o <condensed-json> [-h]'

  static readonly description
    = 'Condensed format used by some community members to pre-process data for elasticsearch and custom dashboards'

  static readonly examples = ['<%= config.bin %> <%= command.id %> -i rhel7-results.json -o rhel7-condensed.json']

  static readonly flags = {
    input: Flags.string({
      char: 'i',
      required: true,
      description: 'Input HDF file',
    }),
    output: Flags.string({
      char: 'o',
      required: true,
      description: 'Output condensed JSON file',
    }),
  }

  async run() {
    const {flags} = await this.parse(HDF2Condensed)
    const thresholds: Record<string, Record<string, number>> = {}
    const parsedExecJSON = convertFileContextual(
      fs.readFileSync(flags.input, 'utf8'),
    )
    const parsedProfile = parsedExecJSON.contains[0] as ContextualizedProfile
    const overallStatusCounts = extractStatusCounts(parsedProfile)
    const overallCompliance = calculateCompliance(overallStatusCounts)

    _.set(thresholds, 'compliance', overallCompliance)

    // Severity counts
    for (const [severity, severityTargets] of Object.entries(
      severityTargetsObject,
    )) {
      const severityStatusCounts = extractStatusCounts(parsedProfile, severity)
      for (const severityTarget of severityTargets) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
        const [statusName, _severity, thresholdType]
          = severityTarget.split('.')
        _.set(
          thresholds,
          severityTarget.replace(`.${thresholdType}`, ''),
          _.get(severityStatusCounts, renameStatusName(statusName)),
        )
      }
    }

    // Total Counts
    for (const [type, counts] of Object.entries(thresholds)) {
      let total = 0
      for (const [, count] of Object.entries(counts)) {
        total += count
      }

      _.set(thresholds, `${type}.total`, total)
    }

    const result = {
      buckets: extractControlSummariesBySeverity(parsedProfile),
      status: thresholds,
    }
    fs.writeFileSync(
      checkSuffix(flags.output),
      JSON.stringify(result, null, 2),
    )
  }
}
