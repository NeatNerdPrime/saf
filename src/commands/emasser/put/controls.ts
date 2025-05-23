import fs from 'fs'
import {readFile} from 'fs/promises'
import {colorize} from 'json-colorizer'
import {Command, Flags} from '@oclif/core'

import {ApiConnection} from '../../../utils/emasser/apiConnection'
import {outputFormat} from '../../../utils/emasser/outputFormatter'
import {displayError, FlagOptions, getFlagsForEndpoint, getJsonExamples, printHelpMsg, printRedMsg} from '../../../utils/emasser/utilities'

import {ControlsApi} from '@mitre/emass_client'
import {ControlsResponsePut} from '@mitre/emass_client/dist/api'

interface Controls {
  // Required Fields
  acronym?: string
  responsibleEntities?: string
  controlDesignation?: string
  estimatedCompletionDate?: string
  implementationNarrative?: string

  // Conditional Fields
  commonControlProvider?: string
  naJustification?: string
  slcmCriticality?: string
  slcmFrequency?: string
  slcmMethod?: string
  slcmReporting?: string
  slcmTracking?: string
  slcmComments?: string

  // Optional Fields
  implementationStatus?: string
  severity?: string
  vulnerabiltySummary?: string
  recommendations?: string
  relevanceOfThreat?: string
  likelihood?: string
  impact?: string
  impactDescription?: string
  residualRiskLevel?: string
  testMethod?: string
  mitigations?: string
  applicationLayer?: string
  databaseLayer?: string
  operatingSystemLayer?: string
}

function getAllJsonExamples(): Record<string, unknown> {
  return {
    ...getJsonExamples('controls-required'),
    ...getJsonExamples('controls-conditional'),
    ...getJsonExamples('controls-optional'),
  }
}

function assertParamExists(object: string, value: string | number | undefined | null): void {
  if (value === undefined) {
    printRedMsg(`Missing required parameter/field: ${object}`)
    throw new Error('Value not defined')
  }
}

function addRequiredFieldsToRequestBody(dataObj: Controls): Controls {
  const bodyObj: Controls = {}
  try {
    assertParamExists('acronym', dataObj.acronym)
    assertParamExists('responsibleEntities', dataObj.responsibleEntities)
    assertParamExists('controlDesignation', dataObj.controlDesignation)
    assertParamExists('estimatedCompletionDate', dataObj.estimatedCompletionDate)
    assertParamExists('implementationNarrative', dataObj.implementationNarrative)
  } catch (error) {
    console.log('Required JSON fields are:')
    console.log(colorize(JSON.stringify(getJsonExamples('controls-required'), null, 2)))
    throw error
  }

  bodyObj.acronym = dataObj.acronym
  bodyObj.responsibleEntities = dataObj.responsibleEntities
  bodyObj.controlDesignation = dataObj.controlDesignation
  bodyObj.estimatedCompletionDate = dataObj.estimatedCompletionDate
  bodyObj.implementationNarrative = dataObj.implementationNarrative

  return bodyObj
}

function addConditionalFields(bodyObject: Controls, dataObj: Controls): void {
  if (Object.prototype.hasOwnProperty.call(dataObj, 'commonControlProvider')) {
    bodyObject.commonControlProvider = dataObj.commonControlProvider
  }

  if (Object.prototype.hasOwnProperty.call(dataObj, 'naJustification')) {
    bodyObject.naJustification = dataObj.naJustification
  }

  if (Object.prototype.hasOwnProperty.call(dataObj, 'slcmCriticality')) {
    bodyObject.slcmCriticality = dataObj.slcmCriticality
  }

  if (Object.prototype.hasOwnProperty.call(dataObj, 'slcmFrequency')) {
    bodyObject.slcmFrequency = dataObj.slcmFrequency
  }

  if (Object.prototype.hasOwnProperty.call(dataObj, 'slcmMethod')) {
    bodyObject.slcmMethod = dataObj.slcmMethod
  }

  if (Object.prototype.hasOwnProperty.call(dataObj, 'slcmReporting')) {
    bodyObject.slcmReporting = dataObj.slcmReporting
  }

  if (Object.prototype.hasOwnProperty.call(dataObj, 'slcmTracking')) {
    bodyObject.slcmTracking = dataObj.slcmTracking
  }

  if (Object.prototype.hasOwnProperty.call(dataObj, 'slcmComments')) {
    bodyObject.slcmComments = dataObj.slcmComments
  }
}

function addOptionalFields(bodyObject: Controls, dataObj: Controls): void {
  if (Object.prototype.hasOwnProperty.call(dataObj, 'implementationStatus')) {
    bodyObject.implementationStatus = dataObj.implementationStatus
  }

  if (Object.prototype.hasOwnProperty.call(dataObj, 'severity')) {
    bodyObject.severity = dataObj.severity
  }

  if (Object.prototype.hasOwnProperty.call(dataObj, 'vulnerabiltySummary')) {
    bodyObject.vulnerabiltySummary = dataObj.vulnerabiltySummary
  }

  if (Object.prototype.hasOwnProperty.call(dataObj, 'recommendations')) {
    bodyObject.recommendations = dataObj.recommendations
  }

  if (Object.prototype.hasOwnProperty.call(dataObj, 'relevanceOfThreat')) {
    bodyObject.relevanceOfThreat = dataObj.relevanceOfThreat
  }

  if (Object.prototype.hasOwnProperty.call(dataObj, 'likelihood')) {
    bodyObject.likelihood = dataObj.likelihood
  }

  if (Object.prototype.hasOwnProperty.call(dataObj, 'impact')) {
    bodyObject.impact = dataObj.impact
  }

  if (Object.prototype.hasOwnProperty.call(dataObj, 'impactDescription')) {
    bodyObject.impactDescription = dataObj.impactDescription
  }

  if (Object.prototype.hasOwnProperty.call(dataObj, 'residualRiskLevel')) {
    bodyObject.residualRiskLevel = dataObj.residualRiskLevel
  }

  if (Object.prototype.hasOwnProperty.call(dataObj, 'testMethod')) {
    bodyObject.testMethod = dataObj.testMethod
  }

  if (Object.prototype.hasOwnProperty.call(dataObj, 'mitigations')) {
    bodyObject.mitigations = dataObj.mitigations
  }

  if (Object.prototype.hasOwnProperty.call(dataObj, 'applicationLayer')) {
    bodyObject.applicationLayer = dataObj.applicationLayer
  }

  if (Object.prototype.hasOwnProperty.call(dataObj, 'databaseLayer')) {
    bodyObject.databaseLayer = dataObj.databaseLayer
  }

  if (Object.prototype.hasOwnProperty.call(dataObj, 'operatingSystemLayer')) {
    bodyObject.operatingSystemLayer = dataObj.operatingSystemLayer
  }
}

function processBusinessLogic(bodyObject: Controls, dataObj: Controls): void { // skipcq: JS-0044
  // ----------------------------------------------------------------------------------------
  // Conditional fields that are required based on the "implementationStatus" value
  // "Planned" or       estimatedCompletionDate, responsibleEntities, slcmCriticality,
  // "Implemented"      slcmFrequency, slcmMethod, slcmReporting, slcmTracking, slcmComments
  //
  // "Not Applicable"     naJustification, responsibleEntities
  //
  // "Manually Inherited" commonControlProvider, estimatedCompletionDate,
  //                      responsibleEntities, slcmCriticality, slcmFrequency, slcmMethod,
  //                      slcmReporting, slcmTracking, slcmComments
  //
  // "Inherited"          Only the following fields can be updated:
  //                      controlDesignation, commonnControlProvider
  // ----------------------------------------------------------------------------------------
  const HELP_MSG = 'Invoke saf emasser put controls [-h, --help] for additional help'
  // Only process if we have an Implementation Status (optional field)
  if (Object.prototype.hasOwnProperty.call(dataObj, 'implementationStatus')) {
    // The implementation Status is always required in any of these cases
    bodyObject.implementationStatus = dataObj.implementationStatus

    switch (dataObj.implementationStatus) {
      case 'Planned':
      case 'Implemented': {
        // No need to check for controlDesignation and estimatedCompletionDate, they are required fields
        if (!(Object.prototype.hasOwnProperty.call(dataObj, 'responsibleEntities')) || !(Object.prototype.hasOwnProperty.call(dataObj, 'slcmCriticality'))
          || !(Object.prototype.hasOwnProperty.call(dataObj, 'slcmFrequency')) || !(Object.prototype.hasOwnProperty.call(dataObj, 'slcmMethod'))
          || !(Object.prototype.hasOwnProperty.call(dataObj, 'slcmReporting')) || !(Object.prototype.hasOwnProperty.call(dataObj, 'slcmTracking'))
          || !(Object.prototype.hasOwnProperty.call(dataObj, 'slcmComments'))) {
          printRedMsg('Missing one of these parameters/fields:')
          printRedMsg('    responsibleEntities, slcmCriticality, slcmFrequency,')
          printRedMsg('    slcmMethod,slcmReporting, slcmTracking, slcmComments')
          printHelpMsg(HELP_MSG)
          process.exit(1)
        } else {
          bodyObject.responsibleEntities = dataObj.responsibleEntities
          bodyObject.slcmCriticality = dataObj.slcmCriticality
          bodyObject.slcmFrequency = dataObj.slcmFrequency
          bodyObject.slcmMethod = dataObj.slcmMethod
          bodyObject.slcmReporting = dataObj.slcmReporting
          bodyObject.slcmTracking = dataObj.slcmTracking
          bodyObject.slcmComments = dataObj.slcmComments
        }

        break
      }

      case 'Not Applicable': {
        // No need to check for controlDesignation, it is a required field
        if ((Object.prototype.hasOwnProperty.call(dataObj, 'naJustification') && Object.prototype.hasOwnProperty.call(dataObj, 'responsibleEntities'))) {
          bodyObject.naJustification = dataObj.naJustification
          bodyObject.responsibleEntities = dataObj.responsibleEntities
        } else {
          printRedMsg('Missing one of these parameters/fields:')
          printRedMsg('    naJustification, responsibleEntities')
          printHelpMsg(HELP_MSG)
          process.exit(1)
        }

        break
      }

      case 'Manually Inherited': {
        // No need to check for controlDesignation and estimatedCompletionDate, they are required fields
        if (!(Object.prototype.hasOwnProperty.call(dataObj, 'commonControlProvider')) || !(Object.prototype.hasOwnProperty.call(dataObj, 'responsibleEntities'))
          || !(Object.prototype.hasOwnProperty.call(dataObj, 'slcmCriticality')) || !(Object.prototype.hasOwnProperty.call(dataObj, 'slcmFrequency'))
          || !(Object.prototype.hasOwnProperty.call(dataObj, 'slcmMethod')) || !(Object.prototype.hasOwnProperty.call(dataObj, 'slcmReporting'))
          || !(Object.prototype.hasOwnProperty.call(dataObj, 'slcmTracking')) || !(Object.prototype.hasOwnProperty.call(dataObj, 'slcmComments'))) {
          printRedMsg('Missing one of these parameters/fields:')
          printRedMsg('    commonControlProvider, responsibleEntities, slcmCriticality,')
          printRedMsg('    slcmFrequency, slcmMethod, slcmReporting, slcmTracking, slcmComments')
          printHelpMsg(HELP_MSG)
          process.exit(1)
        } else {
          bodyObject.commonControlProvider = dataObj.commonControlProvider
          bodyObject.responsibleEntities = dataObj.responsibleEntities
          bodyObject.slcmCriticality = dataObj.slcmCriticality
          bodyObject.slcmFrequency = dataObj.slcmFrequency
          bodyObject.slcmMethod = dataObj.slcmMethod
          bodyObject.slcmReporting = dataObj.slcmReporting
          bodyObject.slcmTracking = dataObj.slcmTracking
          bodyObject.slcmComments = dataObj.slcmComments
        }

        break
      }

      case 'Inherited': {
        // No need to check for controlDesignation, it is a required field
        if ((Object.prototype.hasOwnProperty.call(dataObj, 'commonControlProvider'))) {
          bodyObject.commonControlProvider = dataObj.commonControlProvider
        } else {
          printRedMsg('When implementationStatus value is "Inherited" the following field is required: commonControlProvider')
          printHelpMsg(HELP_MSG)
          process.exit(1)
        }

        break
      }

      default: {
        printRedMsg('The "implementationStatus" field must one of the following:')
        printRedMsg('    Planned, Implemented, Not Applicable, Inherited, or Manually Inherited')
        printRedMsg(`Status provided was: ${dataObj.implementationStatus}`)
        process.exit(1)
      }
    }
  }
}

function generateBodyObj(dataObject: Controls): Controls {
  let bodyObj: Controls = {}
  try {
    bodyObj = addRequiredFieldsToRequestBody(dataObject)
    processBusinessLogic(bodyObj, dataObject)
    addConditionalFields(bodyObj, dataObject)
    addOptionalFields(bodyObj, dataObject)
  } catch {
    process.exit(1)
  }

  return bodyObj
}

const CMD_HELP = 'saf emasser put controls -h or --help'
export default class EmasserPutControls extends Command {
  static readonly usage = '<%= command.id %> [FLAGS]\n\x1B[93m NOTE: see EXAMPLES for command usages\x1B[0m'

  static readonly description = 'Update Security Control information of a system for both the Implementation Plan and Risk Assessment.'

  static readonly examples = [
    '<%= config.bin %> <%= command.id %> [-s,--systemId] [-f, --dataFile]',
    'The input file should be a well formed JSON containing the Security Control information based on defined business rules.',
    'Required JSON parameter/fields are: ',
    colorize(JSON.stringify(getJsonExamples('controls-required'), null, 2)),
    'Conditional JSON parameters/fields are: ',
    colorize(JSON.stringify(getJsonExamples('controls-conditional'), null, 2)),
    'Optional JSON parameters/fields are:',
    colorize(JSON.stringify(getJsonExamples('controls-optional'), null, 2)),
    '\x1B[1m\x1B[32mAll accepted parameters/fields are:\x1B[0m',
    colorize(getAllJsonExamples()),
  ]

  static readonly flags = {
    help: Flags.help({char: 'h', description: 'Show eMASSer CLI help for the PUT Controls command'}),
    ...getFlagsForEndpoint(process.argv) as FlagOptions, // skipcq: JS-0349
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(EmasserPutControls)
    const apiCxn = new ApiConnection()
    const updateControl = new ControlsApi(apiCxn.configuration, apiCxn.basePath, apiCxn.axiosInstances)

    const requestBodyArray: Controls[] = []

    // Check if a Security Control information json file was provided
    if (!fs.existsSync(flags.dataFile)) {
      console.error('\x1B[91m» Security Control(s) data file (.json) not found or invalid:', flags.dataFile, '\x1B[0m')
      process.exit(1)
    }

    try {
      // Read and parse the JSON file
      const fileContent = await readFile(flags.dataFile, 'utf8')
      const data: unknown = JSON.parse(fileContent)

      // Security Control information json file provided, check if we have multiple content to process
      if (Array.isArray(data)) {
        data.forEach((dataObject: Controls) => {
          // Generate the put request object based on business logic
          requestBodyArray.push(generateBodyObj(dataObject))
        })
      } else if (typeof data === 'object' && data !== null) {
        const dataObject: Controls = data
        // Generate the put request object based on business logic
        requestBodyArray.push(generateBodyObj(dataObject))
      } else {
        console.error('\x1B[91m» Invalid data format in Security Controls file\x1B[0m')
        process.exit(1)
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('\x1B[91m» Error reading Security Control(s) data file, possible malformed json. Please use the -h flag for help.\x1B[0m')
        console.error('\x1B[93m→ Error message was:', error.message, '\x1B[0m')
      } else {
        console.error('\x1B[91m» Unknown error occurred while reading the file:', flags.dataFile, '\x1B[0m')
      }
      process.exit(1)
    }

    updateControl.updateControlBySystemId(flags.systemId, requestBodyArray).then((response: ControlsResponsePut) => {
      console.log(colorize(outputFormat(response)))
    }).catch((error: unknown) => displayError(error, 'Controls'))
  }

  // skipcq: JS-0116 - Base class (CommandError) expects expected catch to return a Promise
  protected async catch(err: Error & {exitCode?: number}): Promise<void> {
    // If error message is for missing flags, display
    // what fields are required, otherwise show the error
    if (err.message.includes('See more help with --help')) {
      this.warn(err.message.replace('with --help', `with: \x1B[93m${CMD_HELP}\x1B[0m`))
    } else {
      this.warn(err)
    }
  }
}
