pipeline {
    agent any

    environment {
        REGISTRY         = 'ghcr.io/neueda-learning'
        API_IMAGE        = "${REGISTRY}/checkem-api"
        UI_IMAGE         = "${REGISTRY}/checkem-ui"
        BACKEND_DIR      = '109_10_Check-em/backend'
        FRONTEND_DIR     = '109_10_Check-em/frontend/shopflow-payments-main'
        VITE_API_BASE_URL = 'http://localhost:8082'
        NITRO_PRESET     = 'node-server'
        MYSQL_ROOT_PASSWORD = 'n3u3da!'
        MYSQL_DATABASE   = 'payflow'
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '20'))
        timeout(time: 45, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Backend Tests') {
    steps {
        dir(env.BACKEND_DIR) {
            sh '''
                chmod +x mvnw
                MYSQL_CONTAINER=checkem-mysql-1
                docker rm -f checkem-mysql-1
                docker run -d --name checkem-mysql-1 -e MYSQL_ROOT_PASSWORD=n3u3da! -e MYSQL_DATABASE=payflow mysql:8.4
                echo "Waiting for MySQL to become ready..."
for i in $(seq 1 30); do
  if docker exec checkem-mysql-1 mysql -uroot -p'n3u3da!' -e "SELECT 1" >/dev/null 2>&1; then
    echo "MySQL is up and accepting root logins"
    break
  fi
  echo "Attempt $i/30: not ready yet..."
  sleep 3
done
                docker exec -i checkem-mysql-1 mysql -uroot -pn3u3da!
                ...
            '''
        }
    }
}

        stage('Frontend Tests') {
            steps {
                dir(env.FRONTEND_DIR) {
                    sh '''
                        npm ci
                        NITRO_PRESET="${NITRO_PRESET}" npm run build
                    '''
                }
            }
        }

        stage('Login to GHCR') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'ghcr-credentials',
                    usernameVariable: 'GHCR_USER',
                    passwordVariable: 'GHCR_TOKEN'
                )]) {
                    sh 'echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin'
                }
            }
        }

        stage('Build & Push API Image') {
            steps {
                dir(env.BACKEND_DIR) {
                    sh '''
                        docker build \
                            -t "${API_IMAGE}:latest" \
                            -t "${API_IMAGE}:${GIT_COMMIT}" \
                            .

                        docker push "${API_IMAGE}:latest"
                        docker push "${API_IMAGE}:${GIT_COMMIT}"
                    '''
                }
            }
        }

        stage('Build & Push UI Image') {
            steps {
                dir(env.FRONTEND_DIR) {
                    sh '''
                        docker build \
                            --build-arg VITE_API_BASE_URL="${VITE_API_BASE_URL}" \
                            --build-arg NITRO_PRESET="${NITRO_PRESET}" \
                            -t "${UI_IMAGE}:latest" \
                            -t "${UI_IMAGE}:${GIT_COMMIT}" \
                            .

                        docker push "${UI_IMAGE}:latest"
                        docker push "${UI_IMAGE}:${GIT_COMMIT}"
                    '''
                }
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                    docker compose pull
                    docker compose down
                    docker compose up -d
                    docker compose ps
                '''
            }
        }
    }

    post {
        failure {
            sh 'docker rm -f "checkem-mysql-${BUILD_NUMBER}" >/dev/null 2>&1 || true'
        }
        aborted {
            sh 'docker rm -f "checkem-mysql-${BUILD_NUMBER}" >/dev/null 2>&1 || true'
        }
    }
}
