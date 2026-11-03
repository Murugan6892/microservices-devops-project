pipeline {

    agent any

    environment {
        AWS_REGION = 'ap-south-1'
        AWS_ACCOUNT_ID = 'YOUR_AWS_ACCOUNT_ID'

        ECR_REGISTRY = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

        USER_IMAGE = 'user-service'
        PRODUCT_IMAGE = 'product-service'
        ORDER_IMAGE = 'order-service'

        EC2_HOST = 'YOUR_EC2_PUBLIC_IP'
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
                    test -f nginx/nginx.conf

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
                sh '''
                    aws ecr get-login-password \
                    --region ${AWS_REGION} |
                    docker login \
                    --username AWS \
                    --password-stdin ${ECR_REGISTRY}
                '''
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

        stage('Deploy to EC2') {
            steps {
                sshagent(credentials: ['ec2-ssh-key']) {
                    sh '''
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
                sshagent(credentials: ['ec2-ssh-key']) {
                    sh '''
                        ssh ${EC2_USER}@${EC2_HOST} \
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
