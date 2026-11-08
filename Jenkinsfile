pipeline {
    agent any

    triggers {
        githubPush()
    }

    environment {
        FRONTEND_IMAGE = "manishyelam/frontend:latest"
        CONTAINER_NAME = "frontend"
        FRONTEND_PORT = "5173"
        EMAIL_TO = "manishyelam12e@gmail.com,manishyelam@gmail.com"
    }

    stages {

        stage('Start Email') {
            steps {
                emailext(
                    subject: "Frontend Build Started",
                    body: "Frontend pipeline started.",
                    to: "${EMAIL_TO}"
                )
            }
        }

        stage('Checkout Code') {
            steps {
                git branch: 'main',
                    credentialsId: 'b5f9cb92-1e9a-4568-88a1-67967c5864b9',
                    url: 'https://github.com/ManishYelam/ak_Client.git'
            }
        }

        stage('Remove Old Container') {
            steps {
                sh "docker rm -f ${CONTAINER_NAME} || true"
            }
        }

        stage('Build Docker Image') {
            steps {
                sh "docker build -t ${FRONTEND_IMAGE} ."
            }
        }

        stage('Run New Container') {
            steps {
                sh """
                docker run -d --name ${CONTAINER_NAME} \
                -p ${FRONTEND_PORT}:${FRONTEND_PORT} \
                ${FRONTEND_IMAGE}
                """
            }
        }

        stage('Cleanup Old Images') {
            steps {
                sh """
                LATEST_IMAGE_ID=\$(docker images --format "{{.ID}}" ${FRONTEND_IMAGE})
                ALL_IMAGES=\$(docker images -q)

                for img in \$ALL_IMAGES; do
                    if [ "\$img" != "\$LATEST_IMAGE_ID" ]; then
                        docker rmi -f "\$img" || true
                    fi
                done
                """
            }
        }
    }

    post {
        success {
            emailext(
                subject: "Frontend Build Successful",
                body: "Frontend deployed successfully.",
                to: "${EMAIL_TO}"
            )
        }
        failure {
            emailext(
                subject: "Frontend Build Failed",
                body: "Frontend build failed. Check Jenkins logs.",
                to: "${EMAIL_TO}"
            )
        }
    }
}
