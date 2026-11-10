
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
        EC2_HOST = '172.31.36.163'
        EC2_USER = 'ubuntu'

        DEPLOY_DIR = '/home/ubuntu/microservices-devops-project'
    }

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    stages {

        stage('GitHub Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/Murugan6892/microservices-devops-project.git'
            }
        }

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

        stage('Build Docker Images') {
            steps {
                sh '''
                    set -e

                    docker build -t user-service:${BUILD_NUMBER} ./user-service
                    docker build -t product-service:${BUILD_NUMBER} ./product-service
                    docker build -t order-service:${BUILD_NUMBER} ./order-service
                '''
            }
        }

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
                '''
            }
        }

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

        stage('Push Images to ECR') {
            steps {
                sh '''
                    set -e

                    docker push ${ECR_REGISTRY}/${USER_IMAGE}:${BUILD_NUMBER}
                    docker push ${ECR_REGISTRY}/${PRODUCT_IMAGE}:${BUILD_NUMBER}
                    docker push ${ECR_REGISTRY}/${ORDER_IMAGE}:${BUILD_NUMBER}
                '''
            }
        }

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

                    echo "Docker image cleanup completed!"

                    docker images | grep -E 'user-service|product-service|order-service' || true

                    docker system df
                '''
            }
        }

        stage('Deploy to EC2') {
            steps {
                sshagent(credentials: ['ec2-ssh-key']) {
                    sh '''
                        set -e

                        ssh -o StrictHostKeyChecking=accept-new \
                        ${EC2_USER}@${EC2_HOST} \
                        "cd ${DEPLOY_DIR} && \
                        export IMAGE_TAG=${BUILD_NUMBER} && \
                        export AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID} && \
                        export AWS_REGION=${AWS_REGION} && \
                        docker compose pull && \
                        docker compose up -d"
                    '''
                }
            }
        }

        stage('Health Check') {
            steps {
                sshagent(credentials: ['deployment-ssh']) {
                    sh '''
                        set -e

                        ssh -o StrictHostKeyChecking=accept-new \
                        ${EC2_USER}@${EC2_HOST} \
                        "cd ${DEPLOY_DIR} && \
                        docker compose ps"
                    '''
                }
            }
        }
    }

    post {
        success {
            echo 'Deployment completed successfully!'
        }

        failure {
            echo 'Pipeline failed. Check Jenkins console output.'
        }

        always {
            echo 'Jenkins pipeline execution completed.'
        }
    }
}
