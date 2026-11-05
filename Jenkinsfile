
pipeline {

    agent any

    environment {
        AWS_REGION = 'us-east-2'
        AWS_ACCOUNT_ID = '372951851936'

        ECR_REGISTRY = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

        USER_IMAGE = 'user-service'
        PRODUCT_IMAGE = 'product-service'
        ORDER_IMAGE = 'order-service'

        // Deployment EC2 private IP
        EC2_HOST = '172.31.43.89'
        EC2_USER = 'ubuntu'

        DEPLOY_DIR = '/home/ubuntu/microservices-devops-project'
    }

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    stages {

        // 1. GitHub Checkout
        stage('GitHub Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/Murugan6892/microservices-devops-project.git'
            }
        }

        // 2. Validate Configuration
        stage('Validate Configuration') {
            steps {
                sh '''
                    set -e

                    test -f docker-compose.yml
                    test -f nginx/default.conf

                    test -f user-service/Dockerfile
                    test -f product-service/Dockerfile
                    test -f order-service/Dockerfile

                    docker compose config -q

                    echo "Configuration validation successful"
                '''
            }
        }

        // 3. Build Docker Images
        stage('Build Docker Images') {
            steps {
                sh '''
                    set -e

                    docker build -t user-service:${BUILD_NUMBER} ./user-service

                    docker build -t product-service:${BUILD_NUMBER} ./product-service

                    docker build -t order-service:${BUILD_NUMBER} ./order-service

                    echo "Docker images built successfully"
                '''
            }
        }

        // 4. Tag Docker Images
        stage('Tag Docker Images') {
            steps {
                sh '''
                    set -e

                    docker tag user-service:${BUILD_NUMBER} \
                    ${ECR_REGISTRY}/${USER_IMAGE}:${BUILD_NUMBER}

                    docker tag product-service:${BUILD_NUMBER} \
                    ${ECR_REGISTRY}/${PRODUCT_IMAGE}:${BUILD_NUMBER}

                    docker tag order-service:${BUILD_NUMBER} \
                    ${ECR_REGISTRY}/${ORDER_IMAGE}:${BUILD_NUMBER}

                    echo "Docker image tagging completed"
                '''
            }
        }

        // 5. Login to Amazon ECR
        stage('Login to Amazon ECR') {
            steps {
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding',
                    credentialsId: 'aws-cred'
                ]]) {
                    sh '''
                        set -e

                        aws ecr get-login-password \
                        --region ${AWS_REGION} | \
                        docker login \
                        --username AWS \
                        --password-stdin ${ECR_REGISTRY}
                    '''
                }
            }
        }

        // 6. Push Images to ECR
        stage('Push Images to ECR') {
            steps {
                sh '''
                    set -e

                    docker push ${ECR_REGISTRY}/${USER_IMAGE}:${BUILD_NUMBER}

                    docker push ${ECR_REGISTRY}/${PRODUCT_IMAGE}:${BUILD_NUMBER}

                    docker push ${ECR_REGISTRY}/${ORDER_IMAGE}:${BUILD_NUMBER}

                    echo "All images pushed to ECR successfully"
                '''
            }
        }

        // 7. Local Docker Image Cleanup
        stage('Docker Image Cleanup') {
            steps {
                sh '''
                    set -e

                    echo "Starting local Docker image cleanup..."

                    for IMAGE in user-service product-service order-service
                    do
                        echo "Processing $IMAGE"

                        OLD_TAGS=$(docker images \
                            --format '{{.Tag}}' "$IMAGE" \
                            | grep -E '^[0-9]+$' \
                            | sort -nr \
                            | tail -n +4 || true)

                        for TAG in $OLD_TAGS
                        do
                            echo "Deleting old image: $IMAGE:$TAG"

                            docker rmi "$IMAGE:$TAG" || true

                            docker rmi "${ECR_REGISTRY}/${IMAGE}:${TAG}" || true
                        done
                    done

                    echo "Local Docker image cleanup completed"

                    docker images | grep -E 'user-service|product-service|order-service' || true

                    docker system df
                '''
            }
        }

        // 8. Deploy to EC2
        stage('Deploy to EC2') {
            steps {
                sshagent(credentials: ['ec2-ssh-key']) {
                    sh '''
                        set -e

                        ssh -o StrictHostKeyChecking=accept-new \
                        ${EC2_USER}@${EC2_HOST} \
                        "export AWS_REGION=${AWS_REGION}; \
                        export AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID}; \
                        export ECR_REGISTRY=${ECR_REGISTRY}; \
                        export IMAGE_TAG=${BUILD_NUMBER}; \
                        cd ${DEPLOY_DIR} && \
                        aws ecr get-login-password --region ${AWS_REGION} | \
                        docker login --username AWS --password-stdin ${ECR_REGISTRY} && \
                        docker compose config -q && \
                        docker compose pull && \
                        docker compose up -d && \
                        docker compose ps"

                        echo "Deployment completed"
                    '''
                }
            }
        }

        // 9. Health Check
        stage('Health Check') {
            steps {
                sshagent(credentials: ['ec2-ssh-key']) {
                    sh '''
                        set -e

                        ssh -o StrictHostKeyChecking=accept-new \
                        ${EC2_USER}@${EC2_HOST} \
                        "cd ${DEPLOY_DIR} && \
                        docker compose ps && \
                        docker compose ps --services --filter status=running"
                    '''

                    echo 'Deployment health check completed'
                }
            }
        }
    }

    post {

        success {
            echo 'All microservices deployed successfully!'
        }

        failure {
            echo 'Pipeline failed. Check Jenkins Console Output.'
        }

        always {
            echo 'Jenkins pipeline execution completed.'
        }
    }
}
