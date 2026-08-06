pipeline {

    agent any

    environment {
        BACKEND_IMAGE = "checkem-backend"
        FRONTEND_IMAGE = "checkem-frontend"
    }

    stages {

        stage('Checkout') {
            steps {
                git 'https://github.com/Neueda-Learning/109_10_Check-em.git'
            }
        }

        stage('Build Backend') {
            steps {
                dir('backend') {
                    sh 'mvn clean package -DskipTests'
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir('frontend/shopflow-payments-main') {
                    sh 'npm install'
                    sh 'npm run build'
                }
            }
        }

        stage('Docker Build') {
            steps {

                dir('backend') {
                    sh 'docker build -t $BACKEND_IMAGE .'
                }

                dir('frontend/shopflow-payments-main') {
                    sh 'docker build -t $FRONTEND_IMAGE .'
                }

            }
        }

        stage('Run Containers') {
            steps {

                sh '''
                docker rm -f backend || true
                docker rm -f frontend || true

                docker run -d \
                --name backend \
                -p 8080:8080 \
                checkem-backend

                docker run -d \
                --name frontend \
                -p 3000:80 \
                checkem-frontend
                '''
            }
        }

    }

}