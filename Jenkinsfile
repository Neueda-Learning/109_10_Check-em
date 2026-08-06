pipeline {

    agent any

    environment {
        BACKEND_IMAGE = "checkem-backend"
        FRONTEND_IMAGE = "checkem-frontend"
    }

    stages {

        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/Neueda-Learning/109_10_Check-em.git'
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


        stage('Stop Existing Containers') {
            steps {
                sh '''
                docker rm -f backend || true
                docker rm -f frontend || true
                '''
            }
        }


        stage('Run Containers') {
            steps {

                sh '''
                docker run -d \
                --name backend \
                -p 8081:8080 \
                checkem-backend


                docker run -d \
                --name frontend \
                -p 3000:80 \
                checkem-frontend
                '''

            }
        }


        stage('Verify Containers') {
            steps {
                sh 'docker ps'
            }
        }

    }

}
