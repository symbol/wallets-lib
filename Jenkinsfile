pipeline {
    agent any
    
    options {
        skipStagesAfterUnstable()
    }

    parameters {
        string(name: 'VERSION_NUMBER', defaultValue: '0.1.0', description: 'Version Number')
        string(name: 'DEPLOY_ALPHA_BRANCH', defaultValue: 'dev', description: 'Deploy Alpha Branch Name')
        string(name: 'DEPLOY_RELEASE_BRANCH', defaultValue: 'main', description: 'Deploy Release Branch Name')
    }
    
    environment {
        RUNNING_ON_CI = 'true'
        VERSION_NUMBER = "${params.VERSION_NUMBER}"
        ALPHA_BUILD_NUMBER = sh(script: "echo `date +%Y%m%d%H%M`", returnStdout: true).trim()
        DEPLOY_ALPHA_BRANCH = "${params.DEPLOY_ALPHA_BRANCH}"
        DEPLOY_RELEASE_BRANCH = "${params.DEPLOY_RELEASE_BRANCH}"
        NPM_TOKEN_ID = credentials("NPM_TOKEN_ID")
    }

    stages {
        stage('Install & Build') {
            steps {
                sh "node --version"
                sh "npm --version"
                sh "npm ci"
            }
        }

        stage ('Lint') {
            steps {
                sh "npm run lint"
            }
        }

        stage ('Test') {
            steps {
                sh "echo 'Currently there are no tests to run!'"
            }
        }

        stage ('Publish - Alpha') {
            when {
                expression {
                    BRANCH_NAME == DEPLOY_ALPHA_BRANCH
                }
            }
            steps {
                sh "echo //registry.npmjs.org/:_authToken=${NPM_TOKEN_ID} >> .npmrc"

                sh "npm version ${VERSION_NUMBER}-alpha-${ALPHA_BUILD_NUMBER} --commit-hooks false --git-tag-version false"
                sh "npm publish --tag alpha"
            }
        }

        stage ('Publish - Release') {
            when {
                expression {
                    BRANCH_NAME == DEPLOY_RELEASE_BRANCH
                }
            }
            steps {
                sh "echo //registry.npmjs.org/:_authToken=${NPM_TOKEN_ID} >> .npmrc"

                sh "npm publish"
            }
        }
    }
    post {
        always {
            cleanWs()
        }
    }
}
