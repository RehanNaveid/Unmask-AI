/**
 * @typedef {Object} AuthState
 * @property {string} token
 * @property {string} email
 * @property {string} fullName
 * @property {string[]} roles
 */

/**
 * @typedef {Object} Candidate
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string} githubUsername
 * @property {string} status
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {Object=} facts
 * @property {Object=} councilResult
 */

/**
 * @typedef {Object} CandidateAnalysis
 * @property {string} label
 * @property {number} score
 * @property {string[]} redFlags
 * @property {string[]} yellowFlags
 * @property {string} explanation
 * @property {string} recommendation
 * @property {Object} languageAlignment
 * @property {string[]} suggestedQuestions
 * @property {string[]} consolidatedReasons
 * @property {Array<Object>} projectVerification
 * @property {Array<Object>} topRepos
 */

/**
 * @typedef {Object} ReferenceCallState
 * @property {string} referenceCallId
 * @property {string} conversationId
 * @property {string} candidateId
 * @property {string} candidateName
 * @property {string} referenceName
 * @property {string} phoneNumber
 * @property {string} status
 * @property {string=} summary
 */

/**
 * @typedef {Object} ApiError
 * @property {number} status
 * @property {string} message
 * @property {any} details
 */

export {};
